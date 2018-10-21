var editor;
let fontSize = 3;
let fontSizes = [8, 12, 14, 16, 18, 24, 48];

function isCurrentFile( name ){
    return source[ name ]
        && source[ name ].getInjectionDiv()
        .parentElement
        .style
        .display != "none";
}

function setFontSize( offset ){
    fontSize += offset;
    if( fontSize >= fontSizes.length )
        fontSize = fontSizes.length - 1;
    if( fontSize < 0 )
        fontSize = 0;
    // editor.setFontSize( fontSizes[fontSize] );
}

window.onresize = function(){
    for( let k in source ){
        if( source[k] instanceof Blockly.Workspace )
            Blockly.svgResize(source[k]);
    }
};

function createFile( name, src ){
    
    let el = document.createElement("div");
    el.className = "blocklyInstance";
    DOM.editor.appendChild(el);

    editor = Blockly.inject(
        el, {
	 media: '/blockly/media/',
	 toolbox: document.getElementById('toolbox')
        });

    source[ name ] = editor;
    
    mpy[name] = null;
    
    editor.addChangeListener( event => {
        if( event.type == Blockly.Events.CHANGE )
            mpy[name] = null;
    });

    updateFileList();
    
    return editor;
}

function editorElement(){
    return editor && editor.getInjectionDiv().parentElement;
}

function showFile( name ){
    if( !(name in source) )
        return;

    if( editor )
        editorElement().style.display = "none";

    editor = source[name];
    editorElement().style.display = "block";
}

function getSource( name ){
    let header = `
import upygame as __upygame__
__upygame__.display.init()
__screen_sf__ = __upygame__.display.set_mode()

`;
    let tail = `
while True:
    __upygame__.display.flip()
`;
    return header +
        Blockly.Python.workspaceToCode(source[ name ]) +
        tail;
}

function importFile( file, reader ){

    if( reader.result )
        reader = reader.result;

    let ext = file.replace(/.*?\.([^.]+)$/, '$1').toLowerCase();
    
    switch( ext ){
    case 'zip':
        
        JSZip.loadAsync( reader )
            .then( zip => {

                for( let name in zip.files ){
                    zip.file(name)
                        .async("arraybuffer")
                        .then( importFile.bind(null, name) );
                }

            });

        break;

    case '?':

        let isCurrent = isCurrentFile(file);

        createFile( file, abtostr( reader ) );

        if( isCurrent )
            showFile( file );
        
        updateFileList();
        
        break;
        
    }

}

function getEventHandlers(){
    return {

        dude:{
            click(){
                randomizeDude();
            }
        },

        btnExamples:{
            click(){
                DOM.examplesContainer.classList.add("visible");
            }
        },

        exampleCancel:{
            click(){
                DOM.examplesContainer.classList.remove("visible");
            }
        },

        exampleApply:{
            click(){
                DOM.examplesContainer.classList.remove("visible");
                loadExample( DOM.exampleSelect.value );
            }
        },

        examplesContainer:{
            click( evt ){
                if( evt.target == DOM.examplesContainer )
                    DOM.examplesContainer.classList.remove("visible");
            }
        },

        BODY:{
            dragenter:cancelEvent,
            dragover:cancelEvent,
            drop( event ){
                cancelEvent(event);

                for( let i=0, file; (file=event.dataTransfer.files[i]); ++i ){
                    let fr = new FileReader();
                    fr.onload = importFile.bind( null, file.name, fr );
                    fr.readAsArrayBuffer( file );
                }
                
            }
        },

        download:{
            click(){
                let zip = new JSZip();
                for( let fileName in source )
                    zip.file( fileName, source[fileName].getValue() );
                
                zip.generateAsync({type:"uint8array"})
                    .then(function(arr){
                        
                        let a = document.createElement("a");
                        a.href = URL.createObjectURL( new Blob([arr.buffer], {type:'application/bin'}) );
                        a.download = "pokitto-mpy-project.zip";
                        
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        URL.revokeObjectURL(a.href);
                        
                    });
            }
        },

        deleteFile:{
            click(){
                let fileName;
                for( let key in source ){
                    if( source[key] == editor ){
                        fileName = key;
                        break;
                    }
                }
                if( !fileName )
                    return; // o_O

                if( !confirm("Are you sure you want to delete " + fileName + "?") )
                    return;

                delete source[fileName];
                delete mpy[fileName];

                let names = Object.keys(source);
                let next;
                if( names.length == 0 ){
                    createFile('main');
                    next = 'main';
                }else
                    next = names[0];

                showFile(next);

                updateFileList();
                
            }
        },

        addFile:{
            click(){
                
                let p = prompt("New file name:", "file name");
                if( !p )
                    return;

                p = p.replace(/[^a-z0-9_\.]*/g, '');
                if( p in source ){
                    alert("File already exists");
                    return;
                }

                createFile(p);

                showFile(p);
                
                updateFileList();

            }
        },

        fileList:{
            change(){
                showFile( DOM.fileList.value );
            }
        },

        compile:{
            click(){
                if( busy ) return;
                compile();
            }
        },

        fontInc:{
            click(){
                setFontSize(1);
            }
        },
        
        fontDec:{
            click(){
                setFontSize(-1);
            }
        },
    };
};



function initEditor(){
/*
    for( let name in examples ){
        let opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        DOM.exampleSelect.appendChild(opt);
    }
*/    
    // loadExample( Object.keys(examples)[0] );

    source = {};
    createFile("main");
    setFontSize(0);

}
