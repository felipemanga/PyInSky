const { exec, execFile, execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const copy = require('recursive-copy');
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

let nbid = 1;
let queue = [], builders = {}, busy = false;
let projects = {};

let settings = `
#ifndef MY_SETTINGS_H
#define MY_SETTINGS_H

#define PROJ_BUTTONS_POLLING_ONLY 1
#define PROJ_HIRES 0
#define PROJ_STARTUPLOGO 1
#define PROJ_GAMEBUINO 0
#define PROJ_HIGH_RAM HIGH_RAM_MUSIC
#define PROJ_STREAMING_MUSIC 1
#define PROJ_ENABLE_SYNTH 0
#define PROJ_ENABLE_SOUND       1
#define PROJ_AUD_FREQ           8000
#define PROJ_STREAM_TO_DAC      1
#define PROJ_USE_PWM            1
#define PROJ_GBSOUND 0
#define PROJ_ENABLE_SYNTH 0
#define PROJ_FPS 40

// Python specific
#define PROJ_PYTHON_REPL 0
#define MICROPY_ENABLE_GC 1
#define USE_USB_SERIAL_PRINT (0)

$flags

#if PROJ_HIRES>0
#undef PROJ_HIRES
#define PROJ_MODE15 1
#endif

#endif
`;

function sendHeaders( res ){

    res.writeHead(200, {
	'Content-Type': 'text/plain'
    });
    
}

function Builder( PROJ_ID ){

    this.id = nbid++;

    this.result = "";

    this.state = "INIT";

    builders[ this.id ] = this;
    
    if( PROJ_ID )
        projects[ PROJ_ID ] = this.id;

    console.log("New builder: " + PROJ_ID);

    fs.mkdirSync(__dirname + '/builds/' + this.id);
    fs.mkdirSync(__dirname + '/public/builds/' + this.id);

    let data = '', stdout = '', files;

    let flags = {}, dirtyLib = true;

    let main = null;

    let retry = {};

    this.addFlags = obj => {
        for( let k in obj ){
            let v = obj[k];
            if( /^[A-Z0-9_]+$/.test(k) && /^[A-Z0-9_]+$/i.test(v) && flags[k] != v ){
                console.log(`Dirty: ${flags[k]} != ${v}`);
                flags[k] = v;
                dirtyLib = true;
            }
        }
    };
    
    this.destroy = _ => {
	this.destroyHND = 0;

        delete projects[ PROJ_ID ];

	if( builders[ this.id ] == this )
	    delete builders[ this.id ];
	try{
	    rimraf( __dirname + '/builds/' + this.id, _ => {});
	}catch( err ){
	    console.error(err);
	}
	try{
	    rimraf( __dirname + '/public/builds/' + this.id, _ => {});
	}catch( err ){
	    console.error(err);
	}
    };
    
    this.resetDestroy = _ => {
        if( this.destroyHND )
            clearTimeout( this.destroyHND );

	this.destroyHND = setTimeout( this.destroy, 5 * 60 * 1000 );
    };
    
    this.resetDestroy();
    
    this.addData = _data => {
	data += _data;
	if( data.length > 3 * 1024 * 1024 ){
	    data = '';
	    return false;
	}
	this.resetDestroy();
	return true;
    };

    this.start = _ => {
	
	try{
            files = JSON.parse(data);
	}catch( ex ){
	    data = '';
	    this.result = ex.toString();
	    this.state = "DONE";
	    return;
	}
	
	data = '';
	this.resetDestroy();
	queue.push( this );
	this.state = "QUEUED";
	
    };

    this.run = _ => {

	if( this.state != "QUEUED" ) return;

	this.resetDestroy();
	this.state = "BUILDING";
	busy = true;

        let strflags = '';
        for( let k in flags ){
            strflags += `
#if defined(${k})
#undef ${k}
#endif
`;
            if( flags[k] != "undefined" )
                strflags += `
#define ${k} ${flags[k]}
`;
        }

        files["My_settings.h"] = settings.replace("$flags", strflags);

	let fileList = Object.keys( files );

	this.pop( fileList );
    };

    this.pop = fileList => {
	
	if( !fileList.length )
	    return this.compile();
	
	let file = fileList.shift().replace(/\\/g, '/'); // convert \ to /
	let fullPath = __dirname + '/builds/' + this.id + '/' + file.replace(/\/\.+\//g, '/'); // remove shenanigans
	
	let parts = fullPath.split('/');
	parts.pop();

	if( parts.length ){
	    mkdirp( parts.join('/'), e => writeFile.call( this ) );
	}else
	    writeFile.call(this);

	function writeFile(){

            let str = files[file];
            let buf = Buffer.from(str, file == "My_settings.h" ? 'utf-8' : 'base64');

	    fs.writeFile( fullPath, buf, e => {
		
		if( e ){
		    this.state = 'DONE';
		    busy = false;
		    this.result = "ERROR: " + file + " - " + e.toString();
		    return;
		}

		this.pop(fileList);

	    });
	}
    };

    this.compile = _ => {

	try{	    

	    const child = exec(
		[
		    __dirname + '/build.sh',
                    this.id,
                    dirtyLib|0
		].join(" "),
		(error, _stdout, stderr) => {

		    stdout += _stdout;

		    if( error ){
                        
			busy = false;
			this.state = "DONE";
			this.result = "ERROR: " + error + " " + stderr + stdout;
                        
		    }else{

                        dirtyLib = false;
	                busy = false;
	                this.state = "DONE";
	                this.result = 'DONE';
                        
		    }
		    
		});
	    
	}catch( ex ){
	    console.error(ex);
	    this.result = "ERROR: " + ex;
	    this.state = "DONE";
	    busy = false;
	    
	}
	
    };
    
}



setInterval( _ => {
    
    if( !queue.length || busy )
	return;

    let next = queue.shift();
    next.run();
    
}, 1000 );

execSync("chmod +x -R " + __dirname + "/gcc-arm-none-eabi/");
execSync("chmod +x " + __dirname + "/build.sh");

express()
    .get('/*',function(req,res,next){
	res.header('Access-Control-Allow-Origin', '*');
	next();
    })
    .post('/*',function(req,res,next){
	res.header('Access-Control-Allow-Origin', '*');
	next();
    })
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/blockly', (req, res) => res.render('pages/blockly'))
    .get('/emulator', (req, res) => res.render('pages/emulator'))
    .get('/poll', (req, res) => {

	let builder = builders[ req.query.id ];
	
	sendHeaders( res );
	if( builder ){
	    
	    if( builder.state !== "DONE" ){
	        builder.resetDestroy();
		res.end( builder.state );
	    }else
		res.end( builder.result );
	    
	}else
	    res.end( "DESTROYED" );
	
    })
    .post('/build', (req, res) => {

	let builder;
	if( req.query.PROJ_ID && projects[req.query.PROJ_ID] )
	    builder = builders[ projects[req.query.PROJ_ID] ];

        console.log("Build request: " + req.query.PROJ_ID + ", " + projects[req.query.PROJ_ID] );

        if( !builder )
	    builder = new Builder( req.query.PROJ_ID );

        builder.addFlags( req.query );

	req.on('data', function (data) {
	    if( !builder.addData( data ) )
		req.connection.destroy();
	});

	req.on('end', function () {
	    
	    builder.start();
	    sendHeaders( res );
	    res.end( builder.id.toString() );
	    
	});
	
    })
    .listen(PORT, () => console.log(`Listening on ${ PORT }`))
