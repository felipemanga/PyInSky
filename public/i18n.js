(function(){
    let languages = {
        "it-IT":true,
        "fi-FI":true,
        "pt-BR":true,
        "pt-PT":true,
        "de-DE":true,
        "it":"it-IT",
        "fi":"fi-FI",
        "pt":"pt-BR",
        "de":"de-DE"
    };

    let language = {};

    function setLanguage(lang){
        let data = languages[lang];

        if( typeof data == "string" ){
            lang = data;
            data = languages[lang];
        }

        if( data === undefined ){
            console.warn("Unsupported language: " + lang);
            const langCode = (lang+"").split("-")[0];
            if( langCode != lang ){
                setLanguage(langCode);
                return;
            }
            languages[lang] = {};
        }

        if( data === true ){
            languages[lang] = fetch(lang + ".json")
                .then(rsp=>rsp.text())
                .then(txt=>{
                    languages[lang] = JSON.parse(txt);
                    setLanguage(lang);
                });
            return;
        }

        if( data instanceof Promise || data === language )
            return;

        language = data;
        T(document.body);
    }

    window.setLanguage = setLanguage;

    function ST(str){
        if( language instanceof Promise ){
            return language.then(_=>ST(str));
        }

        return new Promise((ok, nok)=>{
            for( let key in language ){
                let pair = language[key];
                if( typeof pair == "string" ){
                    pair = language[key] = {
                        exp: new RegExp(key),
                        replace: pair.replace(/&#([0-9a-f]+);/g, (m, code)=>{
                            return String.fromCharCode(parseInt(code));
                        })
                    };
                }

                let result = str.replace(pair.exp, pair.replace);
                if( result != str ){
                    str = result;
                    break;
                }
            }
            ok(str);
        });
    }

    function T(el){

        if( !el ) return;

        if( el.childNodes ){
            for( let i=0; i<el.childNodes.length; ++i )
                T(el.childNodes[i]);
        }

        if( el.nodeType != el.TEXT_NODE || el.textContent.trim().length == 0 )
            return;

        if( el.srcText === undefined )
            el.srcText = el.textContent;

        ST(el.srcText)
            .then(s=>el.textContent = s);
    }

    window.T = T;
    window.setLanguage(navigator.language);

})();
