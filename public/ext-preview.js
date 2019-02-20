let activeColor = NaN;

function togglePixelEditor(){
    document.body.classList.toggle("pixelEditor");
    editor.setReadOnly( document.body.classList.contains("pixelEditor") );
}

function setActiveColor( c ){
    if( c < 0 || c > 15 )
        c = 0;

    if( !isNaN(activeColor) )
        DOM.color[ activeColor ].classList.remove("active");

    DOM.color[ c ].classList.add("active");
    activeColor = c;
    DOM.activeColor.style.backgroundColor = DOM.color[ c ].style.backgroundColor;
    DOM.activeColor.setAttribute("colorIndex", c.toString(16).toUpperCase());
}

function preview( editor ){
    editor.renderer.on("afterRender", afterRenderPreview.bind(null, editor));
}

function afterRenderPreview( editor ){
    let palette = DOM.color.map( e => e.style.backgroundColor );

    if( isNaN(activeColor) )
        setActiveColor(0);

    let lines = editor
        .renderer
        .container
        .querySelectorAll(".ace_content .ace_text-layer .ace_line");

    let tokens = [];

    [...lines].forEach( line => tokens.push(...line.children) );

    function next(){
        let token;
        do{
            token = tokens.shift();
        }while( token && token.classList.contains("ace_comment") );
        return token;        
    }

    function expect(tok){
        let token = next();
        return token && token.textContent == tok && token;
    }

    function expectSwitch( ...cases ){
        let token = next();

        if( token )
            for( let i=0; i<cases.length; i+=2 )
                if( cases[i] === token.textContent )
                    return cases[i+1]();
        
        return false;
    }
    
    let token = next(), identifiers = [];
    while( token ){

        if( !token.classList.contains("ace_identifier") ){
            identifiers.length = 0;
            token = next();
            continue;
        }

        identifiers.push(token);

        if( token.textContent == "set_palette_16bit" ){

            if( !expect("([") )
                continue;

            let color = 0;
            while( (token = next()) && token.classList.contains("ace_numeric") ){
                let c565 = parseInt(token.textContent)|0;
                let R = (c565>>11)/0x1F*0xFF|0;
                let G = ((c565>>5)&0x3F)/0x3F*0xFF|0;
                let B = (c565&0x1F)/0x1F*0xFF|0;
                DOM.color[ color ].style.backgroundColor = `rgb(${R},${G},${B})`;
                if( color == activeColor )
                    DOM.activeColor.style.backgroundColor = DOM.color[color].style.backgroundColor;

                let inp = token.querySelector('input[type=color]');
                if( !inp ){
                    inp = document.createElement('input');
                    inp.className = 'previewPalEntry';
                    inp.setAttribute('type', 'color');
                    inp.onchange = editPalette.bind( null, color, token );
                    token.style.position = "relative";
                    token.appendChild(inp);
                }
                inp.value = `#${((R<<16)|(G<<8)|(B)).toString(16).padStart(6, '0')}`;

                color++;

            }

            continue;

        }
/*
        if( identifiers.slice(1).join(".") == "surface.Surface" ){
            
        }
*/        
        if( /Pixels/i.test(token.textContent)
            && expect("=")
            && expectSwitch(
                "[", _=>{
                    while( (token=next()) && token.classList.contains("ace_numeric") ){
                        cellInit( token );
                    }
                    return true;
                },

                "b", _=>{
                    
                    token = next();
                    if( !token || (token.textContent != "'" && token.textContent != "'\\") )
                        return false;

                    while( (token=next()) && (token.classList.contains("ace_escape") || token.textContent == '\\') ){
                        const values = token.textContent.split(/\\x/);
                        values.splice(0, 1);
                        if( !values.length ) continue;
                        
                        let container = token.querySelector('.colorContainer');
                        if( !container ){
                            container = document.createElement('div');
                            container.className = 'colorContainer';
                            token.appendChild(container);
                            token.classList.add("previewPixel");
                        }
                        
                        while( container.children.length > values.length*2 )
                            container.firstElementChild.remove();

                        while( container.children.length < values.length*2 )
                            container.appendChild( document.createElement('div') );

                        for( let i=0; i<values.length; ++i ){
                            const color = parseInt(values[i], 16);
                            let child = container.children[i*2];
                            child.style.backgroundColor = palette[ color >> 4 ];
                            child.setAttribute("text", "\\x");
                            child.onclick = setColorInline.bind(null, token);
                            child.onmousemove = setColorInline.bind(null, token);
                            
                            child = container.children[i*2+1];
                            child.style.backgroundColor = palette[ color&0xF ];
                            child.setAttribute("text", values[i]);
                            child.onclick = setColorInline.bind(null, token);
                            child.onmousemove = setColorInline.bind(null, token);
                        }
                    }
                    
                    return true;
                }
            ) )
            continue;
        
        token = next();
    }

    function cellInit( cell ){
        
        let colorIndex = parseInt(cell.textContent);
        
        if( isNaN(colorIndex) || colorIndex < 0 || colorIndex > 255 )
            return;
        
        cell.style.backgroundColor = palette[ colorIndex>>4 ];
        cell.style.color = cell.style.backgroundColor;
        cell.classList.add("previewPixel");
        cell.onclick = setColor.bind(null, cell);
        cell.onmousemove = setColor.bind(null, cell);
        
        let altBGE = cell.querySelector('.altBGE');
        if( !altBGE ){
            altBGE = document.createElement("div");
            altBGE.classList.add('altBGE');                    
            cell.appendChild(altBGE);
        }
        altBGE.style.backgroundColor = palette[ colorIndex&0xF ];
        
        let txt = cell.querySelector('.textOverlay');
        if( !txt ){
            txt = document.createElement("div");
            txt.className = cell.className;
            txt.classList.add("textOverlay");
            cell.appendChild(txt);
        }
        txt.setAttribute("text", cell.textContent);
    }


    function setColorInline( cell, event ){

        if( !document.body.classList.contains("pixelEditor") )
            return;

        editor.selection.clearSelection();

        if( event.type == "mousemove" && event.buttons == 0 )
            return;

        event.stopPropagation();
        event.preventDefault();

        const values = cell.textContent.split(/\\x/);
        values.splice(0, 1);

        let index = Array.prototype.indexOf.call(
            event.target.parentElement.children,
            event.target
        );

        let cellValue = parseInt(values[index>>1], 16);

        if( index&1 ){
            cellValue = (cellValue&0xF0) | activeColor;
        }else{
            cellValue = (cellValue&0x0F) | (activeColor<<4);
        }

        editor.session.replace(
            getElementRange(cell, (index&~1)*2, 4),
            "\\x"+cellValue.toString(16).padStart(2, "0")
        );

    }

    function setColor( cell, event ){

        if( !document.body.classList.contains("pixelEditor") )
            return;

        editor.selection.clearSelection();

        if( event.type == "mousemove" && event.buttons == 0 )
            return;

        event.stopPropagation();
        event.preventDefault();
        
        let cellValue = parseInt(cell.textContent);

        if( event.target.classList.contains("altBGE") ){
            cellValue = (cellValue&0xF0) | activeColor;
        }else{
            cellValue = (cellValue&0x0F) | (activeColor<<4);
        }

        editor.session.replace(
            getElementRange(cell),
            "0x"+cellValue.toString(16).padStart(2, "0")
        );

    }

    function editPalette( color, cell, event ){
        let c888 = parseInt(event.target.value.replace(/[^0-9a-fA-F]/g, ''), 16);

        let cellValue = 0;

        cellValue |= (c888&0xFF)/0xFF*0x1F>>>0;
        cellValue |= ((c888&0xFF00)>>8)/0xFF*0x3F<<5;
        cellValue |= ((c888&0xFF0000)>>16)/0xFF*0x1F<<11;

        editor.session.replace(
            getElementRange( cell ),
            '0x' + cellValue.toString(16).padStart(4, "0")
        );
    }

    function getElementRange( cell, colOffset=0, length=-1 ){
        
        let lineNum = editor.getFirstVisibleRow();
        lineNum += [...cell.parentElement.parentElement.children]
            .indexOf(cell.parentElement);        

        let cellId = [...cell.parentElement.childNodes].indexOf(cell);
        let column = 0;
        for( let i=0; i<cellId; ++i )
            column += cell.parentElement.childNodes[i].textContent.length;

        if( length == -1 )
            length = cell.textContent.length;

        return new ace.Range(
            lineNum,
            column + colOffset,
            lineNum,
            column + colOffset + length
        );

    }
}
