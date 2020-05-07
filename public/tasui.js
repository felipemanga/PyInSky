examples["TASUI"] = {
    "PokittoPythonProject.ppp":`{"name":"TASUI","flags":{"PROJ_SCREENMODE":"TASMODE","PROJ_MAX_SPRITES":"100"}}`,
    "main.py":`
# Copyright (C) 2020 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

# *** A TAS (Tiles And Sprites) UI DEMO FOR THE POKITTO MICROPYTHON ***
#
# Note: This demo uses TAS (Tiles And Sprites) in a Low resolution mode. The TAS mode does not use
#       a screen buffer at all so it gives about 1 KB more memory for Python. TAS imposes limits also
#       as you can use only tiles or sprites (i.e bitmaps) for drawing to the screen. Not any graphics
#       primitives, like lines or circles, can be used. Text can be drawn but each character is an own
#       sprite so there cannot be a lot of text.
#
#       In addition, you can use TAS UI methods to draw e.g. windows, gauges, menus and checkboxes.

import upygame as pygame
from upygame import TAS
import data

# Setup the screen buffer
pygame.display.init(False)

# PICO-8 palette
# TAS UI uses always the the colors 1-3. The color 0 is transparent for the UI.
pygame.display.set_palette_16bit([0x0000, 0x5aa9 , 0xf809 , 0xff7c, 0xa286, 0x0429, 0xbe18, 0x194a,0xfd00,  0x0706, 0xff44, 0x792a, 0x255f, 0x7392, 0xfbb4, 0xfe54]);

screen = pygame.display.set_mode() # full screen

# Initialise the tilemap.
tilemap = pygame.tilemap.Tilemap(24,24,data.mapPixels1)
tilemap.set_tile(0xc, 16, 16, data.diamond16);


# Create the control using TAS UI. The static parts need to be drawn only once, not in
# every game loop iteration.

# Draw the box and the texts.
controlX = 3
controlY = 2
TAS.drawBox(controlX-1, controlY-1, controlX+12, controlY+11)
TAS.setCursor(controlX, controlY)
TAS.printString("TAS UI test")
TAS.setCursor(controlX+2, controlY+6)
TAS.printString("Potion")
TAS.setCursor(controlX+2, controlY+7)
TAS.printString("Sword")
TAS.setCursor(controlX+2, controlY+9)
TAS.printString("Attack")
TAS.setCursor(controlX+2, controlY+10)
TAS.printString("Talk")

# The main loop
vx = 1;
vy = 1;
x = -128;
y = -128;
frameNum = 0
while True:

    # Move the tilemap.
    x += vx
    y += vy
    if x>-16: x = -128
    if y>-16: y = -128

    # Draw and update gauges.
    percent1 = abs((frameNum % 200) - 100)
    percent2 = abs(((frameNum+50) % 200) - 100)
    percent3 = abs(((frameNum+100) % 200) - 100)
    TAS.drawGauge(controlX, controlX+11, controlY+2, percent1, 100)
    TAS.drawGauge(controlX, controlX+11, controlY+3, percent2, 100)
    TAS.drawGauge(controlX, controlX+11, controlY+4, percent3, 100)

    # Checkboxes
    phase = frameNum % 50
    if phase < 25: TAS.setTile(controlX, controlY+6, TAS.CHECKED_TILE)
    else: TAS.setTile(controlX, controlY+6, TAS.UNCHECKED_TILE)
    if phase > 25: TAS.setTile(controlX, controlY+7, TAS.CHECKED_TILE)
    else: TAS.setTile(controlX, controlY+7, TAS.UNCHECKED_TILE)

    # Menu selection with arrows.
    cursorY = controlY+9
    nonCursorY = controlY+9
    if phase > 25: nonCursorY = controlY+10
    else: cursorY = controlY+10
    TAS.setTile(controlX+1, cursorY, TAS.LEFT_ARROW_TILE)
    TAS.setTile(controlX+8, cursorY, TAS.RIGHT_ARROW_TILE)
    TAS.setTile(controlX+1, nonCursorY, TAS.SPACE_TILE)
    TAS.setTile(controlX+8, nonCursorY, TAS.SPACE_TILE)

    # Draw the tilemap
    tilemap.draw(x, y)

    # Update the screen.
    pygame.display.flip()

    # Advance the frame number
    frameNum += 1
`,
    "data.py":`
# Copyright (C) 2020 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

import upygame

# *** GRAPHICS DATA

# map, 24x24
mapPixels1 = b'\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\xcc\\
'

diamond16Pixels = b'\\
\\xcc\\xcc\\xcc\\xc3\\x3c\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\x3c\\xc3\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xc3\\xcc\\xcc\\x3c\\xcc\\xcc\\
\\xcc\\xcc\\x3c\\xcc\\xcc\\xc3\\xcc\\xcc\\
\\xcc\\xc3\\xcc\\xcc\\xcc\\xcc\\x3c\\xcc\\
\\xcc\\x3c\\xcc\\xc7\\x7c\\xcc\\xc3\\xcc\\
\\xc3\\xcc\\xcc\\x7c\\xc7\\xcc\\xcc\\x3c\\
\\x3c\\xcc\\xc7\\xcc\\xcc\\x7c\\xcc\\xc3\\
\\x7c\\xcc\\xc3\\xcc\\xcc\\x3c\\xcc\\xc7\\
\\xc7\\xcc\\xcc\\x3c\\xc3\\xcc\\xcc\\x7c\\
\\xcc\\x7c\\xcc\\xc3\\x3c\\xcc\\xc7\\xcc\\
\\xcc\\xc7\\xcc\\xcc\\xcc\\xcc\\x7c\\xcc\\
\\xcc\\xcc\\x7c\\xcc\\xcc\\xc7\\xcc\\xcc\\
\\xcc\\xcc\\xc7\\xcc\\xcc\\x7c\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\x7c\\xc7\\xcc\\xcc\\xcc\\
\\xcc\\xcc\\xcc\\xc7\\x7c\\xcc\\xcc\\xcc\\
'
diamond16 = upygame.surface.Surface(16, 16, diamond16Pixels)
`
};
