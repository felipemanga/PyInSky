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
        DOM.tabContainer.setAttribute("mode", "output");
        return;
    }

    let mpyext = {};
    
    for( let fileName in mpy ){
        let nameExt = fileName.replace(/\.py$/i, '.mpy');
        mpyext[ nameExt ] = mpy[ fileName ];
    }

    let flags = "PROJ_ID=" + project.id.replace(/proj:|-/g, "").toUpperCase();

    for( let k in project.flags ){
        flags += "&" + k + "=" + project.flags[k];
    }

    fetch(`/build?` + flags, { method:"POST", body:JSON.stringify(mpyext) })
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
