examples.Tilemap = {
    "main.py": `# Copyright (C) 2019 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

# *** A TILEMAP DEMO FOR THE POKITTO MICROPYTHON ***

import upygame as pygame
import data

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
    pygame.display.flip()`,

    "data.py": `# Graphics by Lanea Zimmerman
# https://opengameart.org/content/tiny-16-basic
# Licensed under CC-BY 3.0, https://creativecommons.org/licenses/by/3.0/

import upygame

# map, 16x16
mapPixels1 = b'\\
\\x88\\x88\\x88\\x88\\x88\\x88\\x88\\x88\\
\\x88\\x88\\x88\\x88\\x88\\x88\\x88\\x88\\
\\x44\\xbb\\xbb\\xb8\\x8b\\xbb\\x55\\xbb\\
\\x44\\x5b\\xbb\\xb8\\x8b\\xb5\\x55\\x5b\\
\\x44\\x4b\\xbb\\xb8\\x8b\\xb5\\x55\\x5b\\
\\x44\\x4b\\xb4\\xbb\\x88\\xbb\\x55\\xbb\\
\\x44\\x4b\\x44\\x4b\\xb8\\x8b\\xbb\\xbb\\
\\x44\\x44\\x45\\x44\\xbb\\x88\\x88\\x88\\
\\x44\\x4b\\x44\\x4b\\xbb\\xbb\\xbb\\x4b\\
\\x44\\x44\\xb4\\xbb\\xbb\\xbb\\xb4\\x54\\
\\x44\\x44\\xbb\\xbb\\xbb\\x44\\xbb\\x4b\\
\\x44\\x44\\x4b\\xbb\\xb4\\x44\\x4b\\xbb\\
\\x44\\x54\\x4b\\xbb\\xb4\\x44\\x4b\\xbb\\
\\x44\\x44\\x44\\xb5\\xbb\\xb4\\xbb\\xbb\\
\\x44\\x44\\x44\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\x44\\x44\\x44\\x4b\\xbb\\xbb\\xbb\\xbb\\
'

green16Pixels = b'\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
'
green16 = upygame.surface.Surface(16, 16, green16Pixels)
tree16Pixels = b'\\
\\xbb\\xbb\\xb4\\x44\\x44\\x4b\\xbb\\xbb\\
\\xbb\\xb4\\x44\\x4b\\x4b\\x44\\x4b\\xbb\\
\\xbb\\x44\\x4b\\xbb\\xbb\\xb4\\x44\\xbb\\
\\xbb\\x11\\x44\\xbb\\xbb\\x44\\x41\\xbb\\
\\xb1\\x14\\x4b\\x4b\\xb4\\xb4\\x44\\x1b\\
\\xb1\\x41\\x44\\x4b\\x44\\x44\\x11\\x1b\\
\\xb1\\x14\\x41\\x44\\x44\\x14\\x41\\x1b\\
\\xb4\\x11\\x14\\x41\\x44\\x41\\x41\\x4b\\
\\xb1\\x44\\x14\\x11\\x41\\x11\\x11\\x1b\\
\\xbb\\x11\\x11\\x41\\x11\\x41\\x41\\xbb\\
\\xbb\\xb1\\x11\\x41\\x11\\x14\\x1b\\xbb\\
\\xbb\\xb7\\x77\\x11\\x51\\x77\\x77\\xbb\\
\\xbb\\x77\\x77\\x15\\x51\\x77\\x77\\x7b\\
\\xbb\\x77\\x71\\x55\\x51\\x17\\x77\\x7b\\
\\xbb\\xb7\\x77\\x51\\x55\\x77\\x77\\xbb\\
\\xbb\\xbb\\x77\\x77\\x77\\x77\\xbb\\xbb\\
'
tree16 = upygame.surface.Surface(16, 16, tree16Pixels)

grass16Pixels = b'\\
\\xbb\\xb4\\xbb\\xb4\\x4b\\xbb\\xbb\\xbb\\
\\x4b\\xb4\\xbb\\xbb\\xbb\\x4b\\xbb\\xbb\\
\\xb4\\xb4\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\x4b\\xbb\\xb4\\xb4\\
\\xbb\\x4b\\xbb\\xbb\\x4b\\x4b\\xb4\\xbb\\
\\x4b\\x4b\\xb4\\xbb\\x44\\x4b\\xbb\\xbb\\
\\xb4\\x44\\x4b\\xbb\\x44\\xbb\\xbb\\xbb\\
\\xb4\\x4b\\x4b\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xb4\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xbb\\xbb\\xb4\\xb4\\xbb\\
\\xbb\\xb4\\xbb\\xbb\\xb4\\xb4\\x4b\\xbb\\
\\xbb\\xb4\\xb4\\x4b\\xbb\\x44\\x4b\\xbb\\
\\xbb\\xb4\\x44\\xbb\\xbb\\xbb\\xbb\\xbb\\
\\xbb\\x4b\\xb4\\xbb\\xb4\\xbb\\xbb\\xbb\\
\\xbb\\xbb\\xbb\\xb4\\xb4\\xb4\\xbb\\xbb\\
'
grass16 = upygame.surface.Surface(16, 16, grass16Pixels)


water16Pixels = b'\\
\\x8c\\x88\\x88\\x8c\\x88\\x8c\\x88\\x88\\
\\xff\\xc8\\x88\\x88\\x88\\x88\\xc8\\x8c\\
\\x88\\x88\\xcc\\x88\\x88\\x88\\x8c\\xc8\\
\\x88\\x88\\x8f\\x88\\x88\\x88\\x8c\\x88\\
\\x88\\x88\\x8f\\x88\\x88\\x88\\xc8\\x88\\
\\x88\\x8c\\xcc\\xc8\\x88\\x8c\\xf8\\x88\\
\\x88\\xf8\\x88\\x88\\xcc\\x88\\xc8\\x88\\
\\x8c\\xc8\\x88\\x88\\xc8\\x88\\x8c\\x88\\
\\x88\\x8c\\x88\\x88\\x88\\x88\\x88\\xcc\\
\\x88\\x88\\xc8\\x8c\\x88\\x88\\x88\\xf8\\
\\x88\\x88\\xcc\\xc8\\x88\\x88\\x88\\xc8\\
\\xc8\\x88\\x88\\xc8\\x88\\x88\\x88\\x8c\\
\\x8c\\xc8\\x88\\x88\\xc8\\x88\\xc8\\x88\\
\\x8c\\x88\\x88\\x88\\x8c\\xff\\x88\\x88\\
\\x88\\x88\\x88\\x88\\x88\\xc8\\x88\\x88\\
\\x8c\\x88\\x88\\x88\\xfc\\xcc\\x88\\x88\\
'
water16 = upygame.surface.Surface(16, 16, water16Pixels)

girl12x15Pixels = b'\\
\\x00\\x01\\x11\\x11\\x10\\x00\\
\\x00\\x15\\x99\\x99\\x51\\x00\\
\\x01\\x59\\x59\\xe1\\x55\\x10\\
\\x01\\xe5\\xee\\x11\\x95\\x10\\
\\x19\\x59\\x11\\x19\\x19\\x51\\
\\x15\\x51\\x1e\\xe1\\x91\\x51\\
\\x15\\x1e\\x1f\\xf1\\xe1\\x51\\
\\x15\\x15\\xdd\\xdd\\x51\\x51\\
\\x11\\x18\\x59\\x95\\x81\\x11\\
\\x01\\x82\\xf8\\x8f\\x28\\x10\\
\\x01\\xd1\\x2f\\xf2\\x1d\\x10\\
\\x00\\x12\\x8f\\xf8\\x21\\x00\\
\\x00\\x18\\x8c\\xc8\\x81\\x00\\
\\x07\\x11\\xcc\\xcc\\x11\\x70\\
\\x07\\x77\\x11\\x11\\x77\\x70\\
'
girl12x15 = upygame.surface.Surface(12, 15, girl12x15Pixels)`
};
