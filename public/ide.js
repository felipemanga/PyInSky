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

function compile(){
    if( busy )
        return;

    setBusy( true );

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
        
    }

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
