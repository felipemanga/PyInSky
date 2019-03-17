"use strict";
let audioContext;

class LibAudio {

    constructor(){

        if( !audioContext )
            audioContext = new AudioContext();

    }

    downSample( data, bpp, rate ){
        let ok, nok;
        let p = new Promise((_ok, _nok) => {
            ok = _ok;
            nok = _nok;
        });

        if( data instanceof ArrayBuffer ){
            audioContext.decodeAudioData(data)
                .then( buffer => {
                    return this.downSample(buffer, bpp, rate);
                }).then( data => {
                    ok( data );
                }).catch( nok );
            return p;
        }

        let ctx = new OfflineAudioContext( 1,
            rate * data.duration,
            rate
        );

        let src = ctx.createBufferSource();
        src.buffer = data;
        src.connect( ctx.destination );
        src.start();
        ctx.startRendering()
            .then(buffer=>ok( [...buffer.getChannelData(0)]
                              .map( x => (x*0.5+0.5)*(~0>>>1) >> (31 - bpp) )
                            ))
            .catch(ex => nok(ex));

        return p;
    }

};
