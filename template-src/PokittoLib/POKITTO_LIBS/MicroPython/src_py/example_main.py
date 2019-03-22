# Copyright (C) 2019 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

# *** A TILEMAP DEMO FOR THE POKITTO MICROPYTHON ***

import upygame as pygame
import example_data as data

# Setup the screen buffer
pygame.display.init(False)
pygame.display.set_palette_16bit([
	4195,16678,12717,19017,13092,33382,53801,29580,23545,54245,33972,27973,28185,54611,57003,57210
]);
screen = pygame.display.set_mode() # full screen

# Initialise the mp.
tilemap = pygame.tilemap.Tilemap(16,16,data.mapPixels1)
tilemap.set_tile(0xb, 16, 16, data.green16);
tilemap.set_tile(0x5, 16, 16, data.tree16);
tilemap.set_tile(0x4, 16, 16, data.grass16);
tilemap.set_tile(0x8, 16, 16, data.water16);

# Sound
g_sound = pygame.mixer.Sound()
g_sound.reset()
g_sound.play()

#g_sound.play_from_sd("/sd/audio.wav")
#g_sound.play_from_sd("beat.wav")
#g_sound.play_from_sd("test3.raw")
#g_sound.play_from_sd("/sd/test3.raw")

# The main loop
vx = 0;
vy = 0;
x = -200;
y = -200;
mapW = 16*16 # 16 tiles of 16 pixels
mapH = 16*16 # 16 tiles of 16 pixels
while True:

    # Read keys
    eventtype = pygame.event.poll()
    if eventtype != pygame.NOEVENT:
        if eventtype.type == pygame.KEYDOWN:
            if eventtype.key == pygame.K_RIGHT: vx = -1
            if eventtype.key == pygame.K_LEFT:  vx = 1
            if eventtype.key == pygame.K_UP:    vy = 1
            if eventtype.key == pygame.K_DOWN:  vy = -1
            if eventtype.key == pygame.BUT_A:
                g_sound.play_sfx(data.sound1, len(data.sound1), False)
            if eventtype.key == pygame.BUT_B:
                g_sound.play_sfx(data.sound2, len(data.sound2), True)
        if eventtype.type == pygame.KEYUP:
            if eventtype.key == pygame.K_RIGHT: vx = 0
            if eventtype.key == pygame.K_LEFT:  vx = 0
            if eventtype.key == pygame.K_UP:    vy = 0
            if eventtype.key == pygame.K_DOWN:  vy = 0

    # Move
    x += vx
    if(x>0): x=0
    if(x + mapW < 110): x = 110 - mapW
    y += vy
    if(y>0): y=0
    if(y + mapH < 88): y = 88- mapH

    # Draw
    tilemap.draw(x, y)
    screen.blit(data.girl12x15, 55, 44)
    pygame.display.flip()
