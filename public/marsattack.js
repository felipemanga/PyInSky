examples["Mars Attack"] = {
    "main.py":`import upygame as pygame
import urandom as random
import sprite
import marsattack_data as gamedata
import gc
import umachine as pok
#import math # not currently supported for HW build

pygame.display.init()
screen = pygame.display.set_mode() # full screen
screenRect = screen.get_rect()
screenW = screenRect.width
screenH = screenRect.height

#create and set palette
pal =[ (0,0,0),(255,255,255),(0,255,0),(24,24,177)]
pygame.display.set_palette(pal);

print('display ready')

class GameObject(sprite.Sprite):
    def __init__(self, surfaces, frameOffsets):
        sprite.Sprite.__init__(self)
        self.frames = surfaces
        self.frameOffsets = frameOffsets
        self.currentFrameNum = 0;
        self.image = self.frames[self.currentFrameNum]  # current image
        self.animDur = 0;
        self.animDurCounter = self.animDur;
        self.vx = 0
        self.vy = 0
        self.rect = self.frames[0].get_rect()
        self.numClones = 0

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

# Group
class RockPileGroup(sprite.Group):

    # Init
    def __init__(self, *sprites):
        sprite.Group.__init__(self, sprites)
        #self.refreshRate = refreshRate

    # Draw
    def draw(self, surface):

        sprites = self.sprites()
        surface_blit = surface.blit

        # draw sprite and pile of clones
        for spr in sprites:

            # draw on on refresh intervals
            self.spritedict[spr] = surface_blit(spr.image, spr.rect.x, spr.rect.y)
            for cl in range(spr.numClones):
                surface_blit(spr.image, spr.rect.x, spr.rect.y + (cl*spr.rect.height))
        self.lostsprites = []


#
all_sprites = sprite.Group()
all_rockpiles = RockPileGroup()

#Create ship
shipGob = GameObject([gamedata.shipSurf], [[0,0]])
shipGob.rect.x = 50
shipGob.rect.y = 70
shipGob.animDur = 2;
all_sprites.add(shipGob)

# Create rockpile sprites
numPiles = (screenW - (8*2)) // (gamedata.rockSurf_f0.get_rect().width-2+5)
for i in range(numPiles):
    gob = GameObject([gamedata.rockSurf_f0],[[0,0]])

    # out of screen
    gob.rect.x = 8 + i*(gob.rect.width+4)
    gob.numClones = random.getrandbits(3) + 2
    gob.rect.y = screenH - 5 - gob.numClones*gob.rect.height
    gob.animDur = 1

    all_sprites.add(gob)
    all_rockpiles.add(gob)

vx = 0;
vy = 0;
frameNum = 0
while True:

    #print('frameNum=',frameNum)vx

    # read keys
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
    shipGob.setvel(vx,vy);

    # update all gobs
    all_sprites.update()

    # draw rockpiles
    all_rockpiles.draw(screen)

    # draw ship
    screen.blit(shipGob.image, shipGob.rect.x, shipGob.rect.y)

    pygame.display.flip()

    frameNum += 1
    if frameNum > 1000000:
        frameNum = 0;

`,
    "marsattack_data.py": `import upygame as pygame

def ConvStrTo4bitPixelArray(w, h, strArray, numArray):
    #print("strArray=", strArray)
    for y in range(h):
        for x in range(w//2):
            #print("y=",y," x=", x*2)
            pixStr = "0x" + strArray[y*w + (x*2)] + strArray[y*w + (x*2) + 1]
            pix = int(pixStr, 16)
            numArray.append(pix)

def ConvStrTo2bitPixelArray(w, h, strArray, numArray):
    #print("strArray=", strArray)
    for y in range(h):
        for x in range(w//4):
            # make a byte
            #print("y=",y," x=", x*4)
            c0 = int(strArray[y*w + (x*4)])
            c1 = int(strArray[y*w + (x*4) + 1])
            c2 = int(strArray[y*w + (x*4) + 2])
            c3 = int(strArray[y*w + (x*4) + 3])
            #print("c0=", bin(c0),"c1=", bin(c1),"c2=", bin(c2),"c3=", bin(c3))
            bytepixels = (c0 << 6) + (c1 << 4) + (c2 << 2) + c3
            #print("bytepixels=",bin(bytepixels))
            numArray.append(bytepixels)

# Sine data
#create sine array
fpFactor = 256;
pseudoPi = 128;
#for pseudoRad in range(3*2*pseudoPi/2):  # store array of 3/2*pi elements to contain full sin and cos circle
#    rad = pseudoRad * math.pi / pseudoPi
#    fpSin = int(round(math.sin(rad)*fpFactor))
#    fpSinCosArray.append(fpSin)
#    #print("pseudoRad=",pseudoRad,"rad=",rad,"fpSin=",fpSin)
#    print(",",fpSin,end='')

fpSinCosArray = [
    0, 6, 13, 19, 25, 31, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98, 104, 109, 115, 121, 126, 132, 137, 142,
    147, 152, 157, 162, 167, 172, 177, 181, 185, 190, 194, 198, 202, 206, 209, 213, 216, 220, 223, 226, 229,
    231, 234, 237, 239, 241, 243, 245, 247, 248, 250, 251, 252, 253, 254, 255, 255, 256, 256, 256, 256, 256,
    255, 255, 254, 253, 252, 251, 250, 248, 247, 245, 243, 241, 239, 237, 234, 231, 229, 226, 223, 220, 216,
    213, 209, 206, 202, 198, 194, 190, 185, 181, 177, 172, 167, 162, 157, 152, 147, 142, 137, 132, 126, 121,
    115, 109, 104, 98, 92, 86, 80, 74, 68, 62, 56, 50, 44, 38, 31, 25, 19, 13, 6, 0, -6, -13, -19, -25, -31,
    -38, -44, -50, -56, -62, -68, -74, -80, -86, -92, -98, -104, -109, -115, -121, -126, -132, -137, -142,
    -147, -152, -157, -162, -167, -172, -177, -181, -185, -190, -194, -198, -202, -206, -209, -213, -216,
    -220, -223, -226, -229, -231, -234, -237, -239, -241, -243, -245, -247, -248, -250, -251, -252, -253,
    -254, -255, -255, -256, -256, -256, -256, -256, -255, -255, -254, -253, -252, -251, -250, -248, -247,
    -245, -243, -241, -239, -237, -234, -231, -229, -226, -223, -220, -216, -213, -209, -206, -202, -198,
    -194, -190, -185, -181, -177, -172, -167, -162, -157, -152, -147, -142, -137, -132, -126, -121, -115,
    -109, -104, -98, -92, -86, -80, -74, -68, -62, -56, -50, -44, -38, -31, -25, -19, -13, -6, 0, 6, 13, 19,
    25, 31, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98, 104, 109, 115, 121, 126, 132, 137, 142, 147, 152, 157,
    162, 167, 172, 177, 181, 185, 190, 194, 198, 202, 206, 209, 213, 216, 220, 223, 226, 229, 231, 234, 237,
    239, 241, 243, 245, 247, 248, 250, 251, 252, 253, 254, 255, 255, 256, 256, 256, 256, 256, 255, 255, 254,
    253, 252, 251, 250, 248, 247, 245, 243, 241, 239, 237, 234, 231, 229, 226, 223, 220, 216, 213, 209, 206,
    202, 198, 194, 190, 185, 181, 177, 172, 167, 162, 157, 152, 147, 142, 137, 132, 126, 121, 115, 109, 104,
    98, 92, 86, 80, 74, 68, 62, 56, 50, 44, 38, 31, 25, 19, 13, 6
]

# Rock picture
w = 16
h = 14
pixelsStr = \
"3300000000003300" \
"3300000000003300" \
"3330000000033300" \
"3303000000303300" \
"3300300003003300" \
"3300030030003300" \
"3300003300003300" \
"3300003300003300" \
"3300030030003300" \
"3300300003003300" \
"3303000000303300" \
"3330000000033300" \
"3300000000003300" \
"3300000000003300"
rockPixels_f0 = []
ConvStrTo2bitPixelArray(w, h, pixelsStr, rockPixels_f0)
rockSurf_f0 = pygame.surface.Surface(w, h, bytearray(rockPixels_f0))

# Ship picture frames
w = 32
h = 16
pixelsStr = \
"11100000000000000000000000000000" \
"11110000000000000000000000000000" \
"11111000000000000000000000000000" \
"01111100000000000000000000000000" \
"01111110000000000000000000000000" \
"01111111000000000000000000000000" \
"00111111100000000000000000000000" \
"00111111110000000000000000000000" \
"00011111111111111111111111000000" \
"00011111111111111111111111100000" \
"00101111111111111111111111111000" \
"00111111111111111111111111111110" \
"00111111111113333333331111111331" \
"00111111113333333333333111111311" \
"00100111111111111111111111111110" \
"00000000011000000000000000110000"
shipPixels = []
ConvStrTo2bitPixelArray(w, h, pixelsStr, shipPixels)
shipSurf = pygame.surface.Surface(w, h, bytearray(shipPixels))

`,
    "sprite.py":`# Slightly modified Pygame sprite classes
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

`
};
