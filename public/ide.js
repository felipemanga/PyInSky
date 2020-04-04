const DOM = {};
let source = null;
let mpy = {};
let busy = false;
let project = {};
let projectIdList = [];
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

function scheduleSave( project, force=false ){

    if( project.saveHandle )
        clearTimeout( project.saveHandle );

    if( !force )
        project.saveHandle = setTimeout(doSave, 1000);
    else
        return doSave();

    function doSave(){
        
        delete project.saveHandle;

        if( !project.id )
            project.id = `proj:${uuid()}`;

        return localforage.setItem(project.id, project);

    }
}

function createFile( name, src ){
    let sess = new ace.EditSession(src);

    if( /^Win/.test(navigator.platform) )
        sess.getDocument().setNewLineMode( "windows" );

    sess.setUndoManager( new ace.UndoManager() );

    name = name.replace(/^.*[\\/]([^\\/]+)$/, "$1");

    project.files[ name ] = src;
    source[ name ] = sess;
    mpy[name] = null;
    
    sess.setMode("ace/mode/python");
    sess.on('change', _ => {
        mpy[name] = null;
        try{
            project.files[name] = sess.getValue();
            scheduleSave(project);
        }catch(ex){
            console.log(ex);
        }
    });

    scheduleSave(project);
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

function loadProject( projectId ){
    localforage.setItem("lastProjectId", projectId)
        .then(_=>{})
        .catch(_=>{});

    localforage.getItem(projectId)
        .then( _project=>{
            
            if( !_project || !_project.files || typeof _project.files != "object" )
                _project = {
                    files:{"main.py":"# Unnamed Project"}
                };
            
            project = _project;

            if( !project.name )
                project.name = "Unnamed Project";

            if( !project.flags )
                project.flags = {};

            for( let k in project.flags ){
                if( DOM[k] )
                    DOM[k].value = project.flags[k];
            }

            DOM.projectList.value = projectId;
            DOM.projectName.value = project.name;
            DOM.fontPreview.src = DOM.PROJ_FONT.value.replace(/^font/, "fonts/").toLowerCase() + ".png";

            mpy = {};
            source = {};

            for( let fileName in project.files ){
                createFile( fileName, project.files[fileName] );
            }
            
            editor.setSession( source[ Object.keys(source)[0] ] );
            updateFileList();
            updateProjectList();
        })
        .catch( ex => console.error(ex) );
}

function loadExample( name ){
    project = {name, id:`proj:${uuid()}`, files:{}};
    source = {};
    mpy = {};
    projectIdList.push( project.id );

    let example = examples[name];
    
    for( let fileName in example ){
        if(/.*\.ppp/i.test(fileName)){
            importPPP(example[fileName]);
        }else{
            createFile( fileName, example[fileName] );
        }
    }

    DOM.projectName.value = name;

    editor.setSession( source[ Object.keys(source)[0] ] );
    updateFileList();
    scheduleSave(project, true)
        .then( _=>updateProjectList() );
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


function updateProjectList( ){

    let current = project.id;

    while( DOM.projectList.children.length )
        DOM.projectList.removeChild( DOM.projectList.firstElementChild );

    for( let key of projectIdList ){
        localforage.getItem(key)
            .then(project => {

                if( !project )
                    return;
                
                let opt = document.createElement("option");
                opt.value = project.id;
                opt.textContent = project.name;
                DOM.projectList.appendChild(opt);

                if( project.id == current )
                    DOM.projectList.value = current;
            })
            .catch( ex => console.error(ex) );
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
    DOM.tabContainer.setAttribute("mode", "output");
}

function closeEmulator(){
    editor.focus();
    DOM.emulator.src = "empty.html";
    DOM.tabContainer.setAttribute("mode", "project");
}

function clearOutput(){
    while( DOM.output.children.length )
        DOM.output.removeChild( DOM.output.firstElementChild );
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

function importFile( file, reader, paletteMode=false ){

    if( reader.result )
        reader = reader.result;

    let ext = file.replace(/.*?\.([^.]+)$/, '$1').toLowerCase();
    
    switch( ext ){
    case 'ppp':
        importPPP(abtostr(reader));
        break;

    case 'pal':
        importPalette( abtostr(reader), file.replace(/^([^.]+)\..*$/, "$1") );
        break;

    case 'zip':
        
        JSZip.loadAsync( reader )
            .then( zip => {

                let isNewProject = zip.files["PokittoPythonProject.ppp"];

                if( isNewProject ){
                    mpy = {};
                    source = {};
                    project = {files:{}, id:`proj:${uuid()}`};
                    projectIdList.push( project.id );
                }

                let pending = 1;

                for( let name in zip.files ){
                    
                    if( zip.files[name].dir )
                        continue;

                    pending++;
                    
                    zip.file(name)
                        .async("arraybuffer")
                        .then( data => {
                            importFile( name, data );
                            done();
                        })
                        .catch( ex => console.log(ex) );
                }

                done();

                function done( ){
                    pending--;
                    if( pending )
                        return;

                    showFile( Object.keys(project.files).pop(), 0 );
                    
                    scheduleSave(project, true)
                        .then( x=>updateProjectList() );
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

    case 'mp3':
    case 'wav':
    case 'ogg':
        let libaudio = new LibAudio();
        libaudio.downSample( reader, 4, 8000 )
            .then( data => {
                let name = file.replace(/^([^.]+)\..*$/, "$1");
                
                let strdata = "", hi=0;
                for( let i=0; i<data.length; ++i ){
                    if( i&1 ){
                        let b=data[i]|hi;
                        strdata += "\\x" + b.toString(16).padStart(2, "0");
                    }else{
                        hi=data[i]<<4;
                    }
                }
                
                strdata=strdata.replace(/((?:\\x[^\\]*){20,20})/g, "$1\\\n");
                strdata=`${name} = b'\\\n${strdata}\\\n'`;
                
                editor.session.insert( editor.getCursorPosition(), strdata );
            })
            .catch( ex => {
                console.error(ex);
            });
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

        if( paletteMode === true ){
            img.onload = importPaletteFromImage.bind(
                null,
                img,
                file.replace(/^([^.]+)\..*$/, "$1")
            );
        }else{
            img.onload = importImage.bind(
                null,
                img,
                file.replace(/^([^.]+)\..*$/, "$1")
            );
        }

        img.src = url;
        
    }

}

function importPPP(str){
    try{
        let tmp = JSON.parse( str );
        delete tmp.files;
        delete tmp.id;
        Object.assign(project, tmp);
    }catch(ex){
        console.warn(ex);
    }

    DOM.projectName.value = project.name;
    if( !project.flags || typeof project.flags != "object" )
        project.flags = {};

    for( let k in project.flags ){
        if( DOM[k] )
            DOM[k].value = project.flags[k];
    }
}

function importPalette( pal, name ){
    let str = pal.split(/\r?\n/);
    let acc = [];
    
    if( str.shift() != "JASC-PAL" )
        return alert("Invalid palette file!"); // JASC-PAL
    str.shift(); // 0100 version

    let max = parseInt( str.shift() ); // color count

    for( let i=0; i<max && str.length; ++i ){
	var line = str.shift().split(/\s/).map( x => parseInt(x) );
        
	acc.push(
	    '0x' + (
		((line[0]/0xFF*0x1F|0)<<11)
		    + ((line[1]/0xFF*0x3F|0)<<5)
		    + ((line[2]/0xFF*0x1F|0))
	    ).toString(16).padStart(4, '0')
	);
        
    }

    pal = `upygame.display.set_palette_16bit([${acc.join(", ")}]);\n`;

    editor.session.insert( editor.getCursorPosition(), pal );

}

function importPaletteFromImage( image, name ){
    let q = new RgbQuant({
        method: 1,
        colors: 16,
        minHueCols: 0
    });

    q.sample(image);

    URL.revokeObjectURL( image.src );

    let pal = q.palette( true, true );

    pal = pal.map( c => "0x" + ( (c[0]/0xFF*0x1F>>>0) |
                          (c[1]/0xFF*0x3F<<5>>>0) |
                          (c[2]/0xFF*0x1F<<11>>>0)
                        ).toString(16)
                 ).join(", ");

    editor.session.insert(
        editor.getCursorPosition(),
        `upygame.display.set_palette_16bit([${pal}]);\n`
    );

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
            let A = data[i++];
            let c;

            if( A > 128 ){
                for( let c=0; c<palette.length; ++c ){
                    let ca = palette[c];
		    let dist = (R-ca[0])*(R-ca[0]) + (G-ca[1])*(G-ca[1]) + (B-ca[2])*(B-ca[2]);
                    if( dist < closestDist ){
                        closest = c;
                        closestDist = dist;
                    }
                }
            }

            line[x>>1] = (line[x>>1]||"\\x") + closest.toString(16);

        }

        out += '\\\n' + line.join('');
        if( W&1 ) out += "0";
    }

    out += "\\\n'\n";

    if( W&1 ) W++;
    
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

            let ppp = Object.assign({}, project);
            delete ppp.files;
            zip.file( "PokittoPythonProject.ppp", JSON.stringify(ppp) );
            
            zip.generateAsync({type:"uint8array"})
                .then(function(arr){
                    
                    let a = document.createElement("a");
                    a.href = URL.createObjectURL( new Blob([arr.buffer], {type:'application/bin'}) );
                    a.download = (project.name || "pokitto-mpy-project") + ".zip";
                    
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

            scheduleSave(project);
            updateFileList();
            
        }
    },

    addFile:{
        click(){
            
            let p = prompt("New file name:", "file.py");
            if( !p )
                return;

            p = p.replace(/[^a-z0-9_\.]*/gi, '');
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

    projectList:{
        change(){
            loadProject( DOM.projectList.value );
        }
    },

    projectName:{
        change(){

            project.name = DOM.projectName.value;

            let option = [...DOM.projectList.children]
                .find( child => {
                    return child.value == project.id;
                });
            
            if( option )
                option.textContent = project.name;
            
            scheduleSave(project);

        }
    },

    deleteProject:{
        click(){
            if( !confirm(`Are you sure you want to delete ${project.name}?`) )
                return;

            let index = projectIdList.indexOf(project.id);
            projectIdList.splice(index, 1);

            localforage.removeItem( project.id )
                .then( _=>{
                    if( projectIdList.length == 0 )
                        loadExample( Object.keys(examples)[0] );
                    else
                        loadProject( projectIdList[ projectIdList.length-1 ] );
                });
        }
    },

    importPalette:{
        change(){
            let files = DOM.importPalette.files;
            for( let i=0, file; (file=files[i]); ++i ){
                let fr = new FileReader();
                fr.onload = importFile.bind( null, file.name, fr, true );
                fr.readAsArrayBuffer( file );
            }
        }
    },

    importImage:{
        change(){
            let files = DOM.importImage.files;
            for( let i=0, file; (file=files[i]); ++i ){
                let fr = new FileReader();
                fr.onload = importFile.bind( null, file.name, fr );
                fr.readAsArrayBuffer( file );
            }
        }
    },

    imageCreate:{
        click(){
            let w = parseInt(DOM.imageWidth.value)|0;
            let h = parseInt(DOM.imageHeight.value)|0;
            if( w < 0 || h < 0 )
                return;

            let n = DOM.imageName.value;

            w += w&1;

            let str = `${n}Pixels = b'\\\n`;
            for( let y=0; y<h; ++y ){
                for( let x=0; x<w; x+=2 ){
                    str += "\\x00";
                }
                str += "\\\n";
            }
            str += `'\n${n} = upygame.surface.Surface(${w}, ${h}, ${n}Pixels);\n`;
            editor.session.insert( editor.getCursorPosition(), str );
            
        }
    },

    imageWidth:{
        change(){
            DOM.imageWidth.value = parseInt(DOM.imageWidth.value);
        }
    },

    imageHeight:{
        change(){
            DOM.imageHeight.value = parseInt(DOM.imageHeight.value);
        }
    },

    PROJ_FONT:{
        change(){
            DOM.fontPreview.src = DOM.PROJ_FONT.value.replace(/^font/, "fonts/").toLowerCase() + ".png";
        }
    },

    flag:{
        change( evt ){
            if( !project.flags )
                project.flags = {};
            project.flags[ evt.target.id ] = evt.target.value;
            scheduleSave( project );
        }
    }


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

    localforage.config({
        name:"pokittopython"
    });

    for( let name in examples ){
        let opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        DOM.exampleSelect.appendChild(opt);
    }

    localforage.keys().then(keys => {
        for( let key of keys ){
            if( /^proj:.*$/.test(key) ){
                projectIdList.push(key);
            }
        }

        localforage.getItem("lastProjectId")
            .then( lastProjectId => {

                if( !lastProjectId )
                    lastProjectId = projectIdList[ projectIdList.length-1 ];

                if( lastProjectId )
                    loadProject( lastProjectId );
                else
                    loadExample( Object.keys(examples)[0] );

            }).catch( ex => console.log(ex) );
            
    });

    setFontSize(0);

})();
