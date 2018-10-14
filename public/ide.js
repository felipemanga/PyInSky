const DOM = {};
let source = {};

function createFile( name, src ){
    let sess = new ace.EditSession(src);
    source[ name ] = sess;
    
    sess.setMode("ace/mode/python");
    sess.on('change', _ => {
        mpy[name] = null;
    });
    return sess;
}

createFile("sprite.py", `
# Slightly modified Pygame sprite classes
# Author: Hannu Viitala, 2018

# Original license as follows:

##    pygame - Python Game Library
##    Copyright (C) 2000-2003, 2007  Pete Shinners
##              (C) 2004 Joe Wreschnig
##    This library is free software; you can redistribute it and/or
##    modify it under the terms of the GNU Library General Public
##    License as published by the Free Software Foundation; either
##    version 2 of the License, or (at your option) any later version.
##
##    This library is distributed in the hope that it will be useful,
##    but WITHOUT ANY WARRANTY; without even the implied warranty of
##    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
##    Library General Public License for more details.
##
##    You should have received a copy of the GNU Library General Public
##    License along with this library; if not, write to the Free
##    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
##
##    Pete Shinners
##    pete@shinners.org

import upygame as pygame

class Sprite(object):
    def __init__(self, *groups):
        self.__g = {} # The groups the sprite is in
        if groups:
            self.add(*groups)

    def add(self, *groups):
        has = self.__g.__contains__
        for group in groups:
            if hasattr(group, '_spritegroup'):
                if not has(group):
                    group.add_internal(self)
                    self.add_internal(group)
            else:
                self.add(*group)

    def remove(self, *groups):
        has = self.__g.__contains__
        for group in groups:
            if hasattr(group, '_spritegroup'):
                if has(group):
                    group.remove_internal(self)
                    self.remove_internal(group)
            else:
                self.remove(*group)

    def add_internal(self, group):
        self.__g[group] = 0

    def remove_internal(self, group):
        del self.__g[group]

    def update(self, *args):
        pass

    def kill(self):
        for c in self.__g:
            c.remove_internal(self)
        self.__g.clear()

    def groups(self):
        return list(self.__g)

    def alive(self):
        return truth(self.__g)

    def __repr__(self):
        return "<%s sprite(in %d groups)>" % (self.__class__.__name__, len(self.__g))


class AbstractGroup(object):

    # dummy val to identify sprite groups, and avoid infinite recursion
    _spritegroup = True

    def __init__(self):
        self.spritedict = {}
        self.lostsprites = []

    def sprites(self):
        return list(self.spritedict)

    def add_internal(self, sprite):
        self.spritedict[sprite] = 0

    def remove_internal(self, sprite):
        r = self.spritedict[sprite]
        if r:
            self.lostsprites.append(r)
        del self.spritedict[sprite]

    def has_internal(self, sprite):
        return sprite in self.spritedict

    def copy(self):
        return self.__class__(self.sprites())

    def __iter__(self):
        return iter(self.sprites())

    def __contains__(self, sprite):
        return self.has(sprite)

    def add(self, *sprites):
        for sprite in sprites:
            # It's possible that some sprite is also an iterator.
            # If this is the case, we should add the sprite itself,
            # and not the iterator object.
            if isinstance(sprite, Sprite):
                if not self.has_internal(sprite):
                    self.add_internal(sprite)
                    sprite.add_internal(self)
            else:
                try:
                    # See if sprite is an iterator, like a list or sprite
                    # group.
                    self.add(*sprite)
                except (TypeError, AttributeError):
                    # Not iterable. This is probably a sprite that is not an
                    # instance of the Sprite class or is not an instance of a
                    # subclass of the Sprite class. Alternately, it could be an
                    # old-style sprite group.
                    if hasattr(sprite, '_spritegroup'):
                        for spr in sprite.sprites():
                            if not self.has_internal(spr):
                                self.add_internal(spr)
                                spr.add_internal(self)
                    elif not self.has_internal(sprite):
                        self.add_internal(sprite)
                        sprite.add_internal(self)

    def remove(self, *sprites):

        for sprite in sprites:
            if isinstance(sprite, Sprite):
                if self.has_internal(sprite):
                    self.remove_internal(sprite)
                    sprite.remove_internal(self)
            else:
                try:
                    self.remove(*sprite)
                except (TypeError, AttributeError):
                    if hasattr(sprite, '_spritegroup'):
                        for spr in sprite.sprites():
                            if self.has_internal(spr):
                                self.remove_internal(spr)
                                spr.remove_internal(self)
                    elif self.has_internal(sprite):
                        self.remove_internal(sprite)
                        sprite.remove_internal(self)

    def has(self, *sprites):
        return_value = False

        for sprite in sprites:
            if isinstance(sprite, Sprite):
                # Check for Sprite instance's membership in this group
                if self.has_internal(sprite):
                    return_value = True
                else:
                    return False
            else:
                try:
                    if self.has(*sprite):
                        return_value = True
                    else:
                        return False
                except (TypeError, AttributeError):
                    if hasattr(sprite, '_spritegroup'):
                        for spr in sprite.sprites():
                            if self.has_internal(spr):
                                return_value = True
                            else:
                                return False
                    else:
                        if self.has_internal(sprite):
                            return_value = True
                        else:
                            return False

        return return_value

    def update(self, *args):
        for s in self.sprites():
            s.update(*args)

    def draw(self, surface):
        sprites = self.sprites()
        surface_blit = surface.blit
        for spr in sprites:
            self.spritedict[spr] = surface_blit(spr.image, spr.rect.x, spr.rect.y)
        self.lostsprites = []

    def clear(self, surface, bgd):
        if callable(bgd):
            for r in self.lostsprites:
                bgd(surface, r)
            for r in self.spritedict.values():
                if r:
                    bgd(surface, r)
        else:
            surface_blit = surface.blit
            for r in self.lostsprites:
                surface_blit(bgd, r, r)
            for r in self.spritedict.values():
                if r:
                    surface_blit(bgd, r, r)

    def empty(self):
        for s in self.sprites():
            self.remove_internal(s)
            s.remove_internal(self)

    def __nonzero__(self):
        return truth(self.sprites())

    def __len__(self):
        return len(self.sprites())

    def __repr__(self):
        return "<%s(%d sprites)>" % (self.__class__.__name__, len(self))


class Group(AbstractGroup):
    def __init__(self, *sprites):
        AbstractGroup.__init__(self)
        self.add(*sprites)

#RenderPlain = Group
#RenderClear = Group

def spritecollideany(sprite, group, collided=None):
    if collided:
        for s in group:
            if collided(sprite, s):
                return s
    else:
        # Special case old behaviour for speed.
        spritecollide = sprite.rect.colliderect
        for s in group:
            if spritecollide(s.rect):
                return s
    return None


`);

createFile("example_data.py", `import upygame as pygame

# pokitto picture
w2 = 16
h2 = 16
pokittoPixels = [
0x00,0x03,0x33,0x33,0x33,0x33,0x33,0x00,
0x00,0x32,0x22,0x22,0x22,0x22,0x32,0x00,
0x00,0x32,0x33,0x33,0x33,0x33,0x22,0x00,
0x00,0x32,0x31,0x11,0x11,0x11,0x22,0x00,
0x00,0x32,0x31,0x13,0x11,0x31,0x22,0x00,
0x02,0x32,0x31,0x11,0x11,0x11,0x22,0x23,
0x03,0x32,0x31,0x13,0x33,0x11,0x22,0x30,
0x00,0x32,0x31,0x11,0x11,0x11,0x22,0x00,
0x00,0x32,0x22,0x22,0x22,0x22,0x22,0x00,
0x00,0x32,0x23,0x22,0x22,0x23,0x32,0x00,
0x00,0x32,0x33,0x32,0x23,0x33,0x32,0x00,
0x00,0x32,0x23,0x22,0x23,0x32,0x22,0x00,
0x00,0x32,0x22,0x23,0x32,0x22,0x22,0x00,
0x00,0x32,0x22,0x22,0x22,0x22,0x32,0x00,
0x00,0x33,0x33,0x33,0x33,0x33,0x33,0x00,
0x00,0x32,0x00,0x00,0x00,0x00,0x32,0x00,
]
pokittoBuf = bytearray(pokittoPixels)
pokittoSurf = pygame.surface.Surface(w2, h2, pokittoBuf)

# Frogitto picture frames
frogitto_w = 8
frogitto_h = 8
frogittoPixels_f1 = [
0x00,0x00,0x00,0x00,
0x00,0xFC,0xCF,0x00,
0x70,0xCC,0xC7,0x07,
0x77,0xCE,0xE7,0x77,
0x00,0xCE,0xC7,0x00,
0x0C,0xC7,0x77,0x70,
0x0C,0x00,0x00,0x70,
0x00,0x00,0x00,0x00,
]
frogittoBuf_f1 = bytearray(frogittoPixels_f1)
frogittoSurf_f1 = pygame.surface.Surface(frogitto_w, frogitto_h, frogittoBuf_f1)
frogittoPixels_f2 = [
0x70,0x0C,0xC0,0x07,
0x07,0xCC,0xC7,0x70,
0x00,0xCE,0xE7,0x00,
0x00,0xCE,0xC7,0x00,
0x00,0xC7,0x77,0x00,
0x00,0xC0,0x07,0x00,
0x00,0x0C,0x70,0x00,
0x00,0x0C,0x70,0x00,

]
frogittoBuf_f2 = bytearray(frogittoPixels_f2)
frogittoSurf_f2 = pygame.surface.Surface(frogitto_w, frogitto_h, frogittoBuf_f2)
frogittoPixels_f3 = [
0x00,0x00,0x00,0x00,
0x70,0xFC,0xCF,0x07,
0x07,0xCC,0xC7,0x70,
0x00,0xCE,0xE7,0x00,
0x00,0xCE,0xC7,0x00,
0x0C,0xC7,0x77,0x70,
0x0C,0x00,0x00,0x70,
0x00,0x00,0x00,0x00,
]
frogittoBuf_f3 = bytearray(frogittoPixels_f3)
frogittoSurf_f3 = pygame.surface.Surface(frogitto_w, frogitto_h, frogittoBuf_f3)

# Blue car sprite frames
w = 16
h = 8
bluecarPixels_f1 = [
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x09,0x55,0x55,0x55,0x00,0x00,
0x00,0x05,0x59,0x55,0x55,0x55,0xD0,0x00,
0xE5,0x55,0x55,0xFF,0x9F,0xFD,0x55,0x00,
0x55,0x99,0x9F,0xFD,0x9F,0xDD,0x99,0x00,
0xE9,0x55,0x99,0x99,0x99,0x55,0x99,0x00,
0x95,0xBD,0x59,0x99,0x95,0xBD,0x50,0x00,
0x00,0xDB,0x00,0x00,0x00,0xDB,0x00,0x00,
]
bluecarBuf_f1 = bytearray(bluecarPixels_f1)
bluecarSurf_f1 = pygame.surface.Surface(w, h, bluecarBuf_f1)
bluecarPixels_f2 = [
0x00,0x00,0x09,0x55,0x55,0x55,0x00,0x00,
0x00,0x05,0x59,0x55,0x55,0x55,0xD0,0x00,
0xE5,0x55,0x55,0xFF,0x9F,0xFD,0x55,0x00,
0x55,0x99,0x9F,0xFD,0x9F,0xDD,0x99,0x00,
0xE9,0x55,0x99,0x99,0x99,0x55,0x99,0x00,
0x95,0x11,0x59,0x99,0x95,0x11,0x50,0x00,
0x00,0xDB,0x00,0x00,0x00,0xDB,0x00,0x00,
0x00,0xBD,0x00,0x00,0x00,0xBD,0x00,0x00,
]
bluecarBuf_f2 = bytearray(bluecarPixels_f2)
bluecarSurf_f2 = pygame.surface.Surface(w, h, bluecarBuf_f2)

# Red car sprite frames
w = 16
h = 8
redcarPixels_f1 = [
0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x00,0x84,0x44,0x44,0x40,0x00,0x00,
0x00,0x44,0x84,0x44,0x44,0x44,0x00,0x00,
0xE4,0x44,0x4F,0xF8,0xFF,0xD8,0x20,0x00,
0x44,0x88,0x8F,0xD8,0xFD,0xD8,0x20,0x00,
0xE8,0x44,0x88,0x88,0x84,0x48,0x20,0x00,
0x44,0xBD,0x44,0x44,0x4B,0xD4,0x00,0x00,
0x02,0xDB,0x20,0x00,0x2D,0xB2,0x00,0x00,
]
redcarBuf_f1 = bytearray(redcarPixels_f1)
redcarSurf_f1 = pygame.surface.Surface(w, h, redcarBuf_f1)
redcarPixels_f2 = [
0x00,0x00,0x84,0x44,0x44,0x40,0x00,0x00,
0x00,0x44,0x84,0x44,0x44,0x44,0x00,0x00,
0xE4,0x44,0x4F,0xF8,0xFF,0xD8,0x00,0x00,
0x44,0x88,0x8F,0xD8,0xFD,0xD8,0x20,0x00,
0xE8,0x44,0x88,0x88,0x84,0x48,0x20,0x00,
0x84,0x22,0x44,0x44,0x42,0x24,0x20,0x00,
0x02,0xDB,0x20,0x00,0x2D,0xB2,0x00,0x00,
0x00,0xBD,0x00,0x00,0x0B,0xD0,0x00,0x00,
]
redcarBuf_f2 = bytearray(redcarPixels_f2)
redcarSurf_f2 = pygame.surface.Surface(w, h, redcarBuf_f2)

`);

createFile("main.py", `import upygame as pygame
import framebuf
import urandom as random
import example_data as spritedata
import sprite
import gc

pygame.display.init()
pygame.display.set_palette_16bit([
    0, 6438, 18917, 10825, 47398, 688, 41764, 17475,
    58225, 13598, 60486, 40179, 42596, 46845, 63245, 65535
]);

screen = pygame.display.set_mode() # full screen

print('display ready')

class GameObject(sprite.Sprite):
    def __init__(self, surfaces, frameOffsets):
        sprite.Sprite.__init__(self)
        self.frames = surfaces
        self.frameOffsets = frameOffsets
        self.currentFrameNum = 0;
        self.image = self.frames[self.currentFrameNum]  # current image
        self.animDur = 3;
        self.animDurCounter = self.animDur;
        self.vx = 0
        self.vy = 0
        self.rect = self.frames[0].get_rect()

    def setvel(self, vx, vy):
        self.vx = vx
        self.vy = vy

    def update(self):

        # Advance frame if animation is set
        if self.animDur > 0:

            # if animation duration has elapsed, advance frame
            if self.animDurCounter == 0:
                self.currentFrameNum += 1
                if self.currentFrameNum >= len(self.frames):
                    self.currentFrameNum = 0

                #
                self.animDurCounter = self.animDur

                # Set current image
                self.image = self.frames[self.currentFrameNum]
                self.rect.x += self.frameOffsets[self.currentFrameNum][0]
                self.rect.y += self.frameOffsets[self.currentFrameNum][1]
            else:
                self.animDurCounter -= 1

        # Advance position
        self.rect.x += self.vx
        self.rect.y += self.vy

#
all_sprites = sprite.Group()
all_frogittos = sprite.Group()
all_cars = sprite.Group()

# Create frogitto sprites
for i in range(1):
    frogittoGob = GameObject(
        [spritedata.frogittoSurf_f1, spritedata.frogittoSurf_f2, spritedata.frogittoSurf_f3],
        [[0,0],[0,0],[0,0]])

    # out of screen
    frogittoGob.rect.x = 50
    frogittoGob.rect.y = 70

    frogittoGob.animDur = 2;

    all_sprites.add(frogittoGob)
    all_frogittos.add(frogittoGob)

# Create blue and red car sprites
for i in range(10):
    carGob = GameObject(
        [spritedata.bluecarSurf_f1, spritedata.bluecarSurf_f2],
        [[0,0],[0,0]])

    # out of screen
    carGob.rect.x = -100
    carGob.rect.y = -100

    all_sprites.add(carGob)
    all_cars.add(carGob)

    carGob = GameObject(
        [spritedata.redcarSurf_f1, spritedata.redcarSurf_f2],
        [[0,0],[0,0]])

    # out of screen
    carGob.rect.x = -100
    carGob.rect.y = -100

    all_sprites.add(carGob)
    all_cars.add(carGob)

print('all_frogittos len=', len(all_frogittos))

vx = 0;
vy = 0;
frameNum = 0;
lastY = 0
while True:

    #print('frameNum=',frameNum)vx

    hit = sprite.spritecollideany(frogittoGob, all_cars)
    #print ('hit',hit.rect)
    #print ('frogitto',frogittoGob.rect)
    if hit != None:
        frogittoGob.rect.x = 50
        frogittoGob.rect.y = 70

    eventtype = pygame.event.poll()
    if eventtype != pygame.NOEVENT:
        if eventtype.type == pygame.KEYDOWN:
            if eventtype.key == pygame.K_RIGHT:
                vx = 1
            if eventtype.key == pygame.K_LEFT:
                vx = -1
            if eventtype.key == pygame.K_UP:
                vy = -1
            if eventtype.key == pygame.K_DOWN:
                vy = 1
        if eventtype.type == pygame.KEYUP:
            if eventtype.key == pygame.K_RIGHT:
                vx = 0
            if eventtype.key == pygame.K_LEFT:
                vx = 0
            if eventtype.key == pygame.K_UP:
                vy = 0
            if eventtype.key == pygame.K_DOWN:
                vy = 0

    frogittoGob.setvel(vx,vy);


    # Launch new frogitto after n frames
#    if (frameNum % 20) == 0:
#        # Get first free frogitto
#        for s in all_frogittos:
#            if s.y < -8:
#                s.x = 40 + random.getrandbits(4)
#                s.y = 88
#                s.currentFrameNum = 0
#
#                break

    # Launch new car after n frames
    if (frameNum % 13) == 0:
        # Get first free car and set the starting position
        for s in all_cars:
            if s.rect.x < -16:
                s.rect.x = 110
                y = 10 + random.getrandbits(8) * 60 // 256
                if abs(y - lastY) < 7:
                    if y < lastY:
                        y -= 7
                    else:
                        y += 7
                s.rect.y = y
                lastY = y
                s.setvel(-1,0)
                s.currentFrameNum = 0

                break

    all_sprites.update()
    all_sprites.draw(screen)

    pygame.display.flip()

    frameNum += 1
    if frameNum > 1000000:
        frameNum = 0;
`);

editor.setSession( source["main.py"] );


let mpy = {};

let busy = false;

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
            a.style.color = 'white';
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
        
        FS.writeFile( name, source[name].getValue() );
        
        Module.callMain(["-o", "out.mpy", "-s", name, name]);
        
        let bin = FS.readFile( "out.mpy", {encoding:"binary"} );
        
        if( bin ){
            let str = "";
            for( let i=0; i<bin.length; ++i )
                str += String.fromCharCode(bin[i]);
            mpy[name] = str;
        }else{
            abort();
        }
        
    }

    function abort(){
        isAborted = true;
    }

}


const events = {

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
    
})();

updateFileList();
