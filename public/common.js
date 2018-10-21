const DOM = {};
let source = null;
let mpy = {};
let busy = false;

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
    
    showFile( Object.keys(source)[0] );

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
        if( isCurrentFile(fileName) )
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
        if( nameExt.indexOf('.') == -1 )
            nameExt += '.mpy';
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

            DOM.emulator.src=`/emulator?${url}`;
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
        let bin, pyname = name;

        if( !/\.py/i.test(name) )
            pyname = name + ".py";
        
        Module.reset();
        FS.writeFile( pyname, getSource(name) );

        try{
            Module.callMain(["-o", "out.mpy", "-s", pyname, pyname]);
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

function randomizeDude(){
    let dudes = ["charR", "charG", "charB"];
    let dude;
    do{
        dude = dudes[ Math.random()*dudes.length|0 ];
    }while( document.body.classList.contains(dude) )
    dudes.forEach( old => document.body.classList.remove(old) );
    document.body.classList.add(dude);
}


// setup the DOM index

setTimeout(function(){

    let events = getEventHandlers();
    
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

    initEditor();

}, 1);

