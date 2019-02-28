const DOM = {};
let source = null;
let mpy = {};
let busy = false;

let fontSize = 3;
let fontSizes = [8, 12, 14, 16, 18, 24, 48];

function setFontSize( offset ){
    fontSize += offset;
    if( fontSize >= fontSizes.length )
        fontSize = fontSizes.length - 1;
    if( fontSize < 0 )
        fontSize = 0;
    editor.setFontSize( fontSizes[fontSize] );
}

function createFile( name, src ){
    let sess = new ace.EditSession(src);

    if( /^Win/.test(navigator.platform) )
        sess.getDocument().setNewLineMode( "windows" );

    sess.setUndoManager( new ace.UndoManager() );

    source[ name ] = sess;
    mpy[name] = null;
    
    sess.setMode("ace/mode/python");
    sess.on('change', _ => {
        mpy[name] = null;
    });
    return sess;
}

function showFile( name, line ){
    if( !(name in source) )
        return;

    editor.setSession( source[name] );

    if( line !== undefined ){
        line |= 0;
        editor.scrollToLine( line, true, true, function () {} );
        editor.gotoLine( line, 0, true );
        editor.selection.selectLineEnd();
        editor.focus();
    }
}

function loadExample( name ){
    if( source && !confirm("Loading an example will discard your current project.\nAre you sure you want to do this?") ){
        return;
    }

    source = {};
    mpy = {};

    let example = examples[name];
    
    for( let fileName in example ){
        createFile( fileName, example[fileName] );
    }
    
    editor.setSession( source[ Object.keys(source)[0] ] );

    updateFileList();
}

function updateFileList(){
    while( DOM.fileList.children.length )
        DOM.fileList.removeChild( DOM.fileList.firstElementChild );

    for( let fileName in source ){
        let e = document.createElement("option");
        DOM.fileList.appendChild(e);
        e.value = fileName;
        e.textContent = fileName;
        if( editor.session == source[fileName] )
            DOM.fileList.value = fileName;
    }
}

function setBusy( state ){

    if( state == busy )
        return;

    busy = state;
    
    if( state ){
        DOM.compile.setAttribute("disabled", true);
    }else{
        DOM.compile.removeAttribute("disabled");
    }

}

function TimeoutPromise(cb, time){
    return new Promise((ok, nok) => {
        setTimeout(_ => {
            try{
                ok( cb() );
            }catch(ex){
                nok(ex);
            }
        }, time);
    });
}

function focusEmulator(){
    DOM.emulator.focus();
    DOM.emulator.contentWindow.focus();
}

function closeEmulator(){
    editor.focus();
    DOM.emulator.src = "empty.html";    
}

function clearOutput(){
    while( DOM.output.children.length )
        DOM.output.removeChild( DOM.output.firstElementChild );
}

function compile(){
    if( busy )
        return;

    setBusy( true );
    clearOutput();

    let isAborted = false;
    
    for( let fileName in source ){
        
        if( !mpy[fileName] ){
            makeMPY( fileName );
            if( isAborted )
                break;
        }
        
    }

    if( isAborted ){
        setBusy(false);
        return;
    }

    let mpyext = {};
    
    for( let fileName in mpy ){
        let nameExt = fileName.replace(/\.py$/i, '.mpy');
        mpyext[ nameExt ] = mpy[ fileName ];
    }

    fetch("/build", { method:"POST", body:JSON.stringify(mpyext) })
        .then( rsp => rsp.text() )
        .then( txt => pollCompilerService( txt|0 ) )
        .then( url => {
            let e = document.createElement('div');
            let a = document.createElement('a');
            e.textContent = 'Build succeeded. ';
            e.appendChild(a);
            a.textContent = 'Download BIN';
            // a.style.color = 'white';
            a.href = `builds/${url}/build.bin`;
            DOM.output.appendChild(e);

            setTimeout( _=>{
                if( a.parentElement == e )
                    e.remove();
            }, 50000);

            DOM.emulator.src=`emulator?${url}`;
            setBusy(false);
            focusEmulator();
        })
        .catch( ex => {
            console.warn(ex);
            setBusy(false);
        });

    function pollCompilerService( id ){
        return fetch(`/poll?id=${id}`)
            .then( rsp => rsp.text() )
            .then( txt => {
                
                if( txt == "QUEUED" || txt == "BUILDING" )
                    return TimeoutPromise(
                        _=>pollCompilerService(id),
                        1000
                    );

                if( txt == "DONE" )
                    return id;
                
                throw new Error(txt);
            });
    }

    function makeMPY( name ){
        let bin;
        
        Module.reset();
        FS.writeFile( name, source[name].getValue() );

        try{
            Module.callMain(["-o", "out.mpy", "-s", name, name]);
            bin = FS.readFile( "out.mpy", {encoding:"binary"} );
        }catch(ex){
        }

        try{
            FS.unlink("out.mpy");
        }catch(ex){}
        
        if( bin ){
            let str = "";
            for( let i=0; i<bin.length; ++i )
                str += String.fromCharCode(bin[i]);
            mpy[name] = btoa(str);
        }else{
            abort();
        }
        
    }

    function abort(){
        isAborted = true;
    }

}

editor.commands.addCommand({
    name: "compile",
    bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
    exec: () => compile()
});	    

function cancelEvent( event ){
    event.stopPropagation();
    event.preventDefault();    
}


function abtostr( ab ){
    let str = "";
    let b = new Uint8Array(ab);

    for( let i=0; i<b.length; ++i )
        str += String.fromCharCode(b[i]);

    return str;
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

    case 'py':

        let isCurrent = source[file] == editor.session;

        createFile( file, abtostr( reader ) );

        if( isCurrent )
            editor.setSession( source[file] );
        
        updateFileList();
        
        break;

    case 'png':
    case 'jpg':

        let img = new Image();
        let url = URL.createObjectURL(
            new Blob(
                [reader],
                {type:"image/"+ext}
            )
        );

        img.onload = importImage.bind(
            null,
            img,
            file.replace(/^([^.]+)\..*$/, "$1")
        );

        img.src = url;
        
    }

}

function importImage( image, name ){

    let canvas = document.createElement("canvas");
    let W = canvas.width = image.width;
    let H = canvas.height = image.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage( image, 0, 0 );
    URL.revokeObjectURL( image.src );
    let {data} = ctx.getImageData( 0, 0, canvas.width, canvas.height );

    let palette = DOM.color.map( e => e[0] == '#' ? [
        parseInt(e.style.backgroundColor.substr(1, 2), 16),
        parseInt(e.style.backgroundColor.substr(3, 2), 16),
        parseInt(e.style.backgroundColor.substr(5, 2), 16)
    ] : [
        e.style.backgroundColor.replace(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+).*/, "$1")|0,
        e.style.backgroundColor.replace(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+).*/, "$2")|0,
        e.style.backgroundColor.replace(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+).*/, "$3")|0
    ]);

    let out = `${name}Pixels = b'`;
    
    for( let y=0; y<H; y++ ){

        let line = [];
        for( let x=0; x<W; x++ ){

            let i = (y*W + x) * 4;
            let closest = 0;
            let closestDist = Number.POSITIVE_INFINITY;
            let R = data[i++];
            let G = data[i++];
            let B = data[i++];
            let c;

            for( let c=0; c<palette.length; ++c ){
                let ca = palette[c];
		let dist = (R-ca[0])*(R-ca[0]) + (G-ca[1])*(G-ca[1]) + (B-ca[2])*(B-ca[2]);
                if( dist < closestDist ){
                    closest = c;
                    closestDist = dist;
                }
            }

            line[x>>1] = (line[x>>1]||"\\x") + closest.toString(16);

        }

        out += '\\\n' + line.join('');

    }

    out += "\\\n'\n";

    out += `${name} = upygame.surface.Surface(${W}, ${H}, ${name}Pixels)\n`;

    editor.session.insert( editor.getCursorPosition(), out );
}

function randomizeDude(){
    let dudes = ["charR", "charG", "charB"];
    let dude;
    do{
        dude = dudes[ Math.random()*dudes.length|0 ];
    }while( document.body.classList.contains(dude) )
    dudes.forEach( old => document.body.classList.remove(old) );
    document.body.classList.add(dude);
}

const events = {

    color:{
        click( event ){
            setActiveColor( DOM.color.indexOf(event.target) );
        }
    },

    dude:{
        click(){
            randomizeDude();
        }
    },

    btnSprites:{
        click(){
            togglePixelEditor();
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
                if( source[key] == editor.session ){
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

            if( names.length == 0 )
                editor.setSession( createFile("main.py", '# main.py') );
            else
                editor.setSession( source[names[0]] );

            updateFileList();
            
        }
    },

    addFile:{
        click(){
            
            let p = prompt("New file name:", "file.py");
            if( !p )
                return;

            p = p.replace(/[^a-z0-9_\.]*/g, '');
            if( p in source ){
                alert("File already exists");
                return;
            }

            if( !/\.py$/i.test(p) )
                p += '.py';

            
            editor.setSession( createFile(p, '# ' + p) );

            updateFileList();

        }
    },

    fileList:{
        change(){
            editor.setSession( source[DOM.fileList.value] );
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



// setup the DOM index

(function(){
    
    let elements = document.querySelectorAll("*");
    
    for( let i=0, element; (element=elements[i]); ++i ){
        
        index( element, element.tagName, false );
        index( element, element.id, true );
        
        for( let j=0, clazz; (clazz=element.classList[j]); ++j ){
            index( element, clazz, false );
        }
        
    }

    function index( e, key, unique ){
        
        if( unique ){
            DOM[ key ] = e;            
        }else{
            if( DOM[key] && !Array.isArray(DOM[key]) ){
                DOM[key] = null;
            }
            (DOM[ key ] = DOM[ key ] || []).push( e );
        }
        
        if( events[key] ){
            for( evtName in events[key] ){
                let handler = events[key][evtName];
                if( typeof handler == "function" ){
                    e.addEventListener( evtName, handler );
                }
            }
        }
        
    }

    randomizeDude();
    
})();


(function(){

    for( let name in examples ){
        let opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        DOM.exampleSelect.appendChild(opt);
    }
    
    loadExample( Object.keys(examples)[0] );
    setFontSize(0);

})();
