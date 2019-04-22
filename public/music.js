examples["Music"] = {
    "main.mpy":`# Copyright (C) 2019 Hannu Viitala
#
# The source code in this file is released under the MIT license.
# Go to http://opensource.org/licenses/MIT for the full license details.
#

# *** A MUSIC STREAMING FROM SD EXAMPLE FOR THE POKITTO MICROPYTHON ***

# Put these files in your Pokitto's SD card:
# https://pyinsky.herokuapp.com/intro44.snd
# https://pyinsky.herokuapp.com/scary.snd

import upygame as pygame
import umachine as machine

# Setup the screen buffer
pygame.display.init(True)
pygame.display.set_palette_16bit([
	4195,16678,12717,19017,13092,33382,53801,29580,23545,54245,33972,27973,28185,54611,57003,57210
]);
screen = pygame.display.set_mode()

# Initialize sound
g_sound = pygame.mixer.Sound()
g_sound.play_from_sd("intro44.snd")

# The main loop
soundNum = 1
while True:

    # Read keys
    eventtype = pygame.event.poll()
    if eventtype != pygame.NOEVENT and eventtype.type == pygame.KEYDOWN:
        if eventtype.key == pygame.BUT_A:
            soundNum = 1
            g_sound.play_from_sd("intro44.snd")
        if eventtype.key == pygame.BUT_B:
            soundNum = 2
            g_sound.play_from_sd("scary.snd")

    # Draw texts.
    if(soundNum == 1):
        machine.draw_text(10,20,"intro44.snd",6)
    elif(soundNum == 2):
        machine.draw_text(10,20,"scary.snd",9)
    machine.draw_text(0,0,"Press A or B", 15)
    machine.draw_text(0,45,"Note: Music can be", 15)
    machine.draw_text(0,55,"heard only on HW!", 15)
    machine.draw_text(0,65,"The music files", 15)
    machine.draw_text(0,75,"must exist on SD", 15)

    # Update display
    pygame.display.flip()
`
};
