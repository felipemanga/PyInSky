examples[`Python the Snake`] = {
    "main.py":`# Python the snake - demo

import upygame as upg

# Setup the screen.
screen = upg.display.set_mode()

upg.display.set_palette_16bit([
31203, 65535, 2016, 31, 0, 2016, 2016, 31, 0, 63488, 2016, 31, 1600, 1024, 2016, 0
])

# The ball picture
ballPixels = b'\\
\\x00\\x00\\x00\\x00\\xcc\\xdd\\xdd\\xdd\\x00\\x00\\x00\\x00\\
\\x00\\x00\\x00\\xcc\\xcc\\xcc\\xcd\\xdd\\xdd\\x00\\x00\\x00\\
\\x00\\x00\\x55\\x55\\xc5\\xcc\\xcc\\xcd\\xdd\\xd0\\x00\\x00\\
\\x00\\x05\\x55\\x55\\x55\\x5c\\xcc\\xdc\\xdd\\xdd\\xd0\\x00\\
\\x00\\x55\\x55\\x55\\x55\\xc5\\xcc\\xcc\\xcd\\xdd\\xdd\\x00\\
\\x00\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xdc\\xdd\\xdd\\x00\\
\\x05\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xcc\\xcd\\xdd\\xd0\\
\\x05\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xdd\\xdd\\xd0\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xdd\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xcd\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xcc\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xcd\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xcc\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xcd\\xdd\\xdd\\
\\x55\\x55\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xdd\\xdd\\xdd\\
\\x05\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xcd\\xdd\\xd0\\
\\x05\\x55\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xdd\\xdd\\xd0\\
\\x00\\x55\\x55\\x55\\x55\\x55\\x5c\\xcc\\xcc\\xcd\\xdd\\xd0\\
\\x00\\x55\\x55\\x55\\x55\\x55\\xcc\\xcc\\xdc\\xdd\\xdd\\x00\\
\\x00\\x55\\x55\\x55\\xf5\\xc5\\x5c\\xfc\\xcd\\xdd\\xdd\\x00\\
\\x00\\x05\\x55\\x55\\x5f\\xff\\xff\\xdc\\xdd\\xdd\\xd0\\x00\\
\\x00\\x00\\x55\\x5c\\x5c\\xc9\\xcc\\xcd\\xdd\\xdd\\x00\\x00\\
\\x00\\x00\\x0c\\xcc\\xcc\\xc9\\xcd\\xdd\\xdd\\x00\\x00\\x00\\
\\x00\\x00\\x00\\x00\\xcc\\x9d\\x9d\\xdd\\x00\\x00\\x00\\x00\\
'
hero_sf = upg.surface.Surface(24, 24, ballPixels)

# The eye picture 1
eyePixels1 = b'\\
\\x00\\x11\\x11\\x00\\
\\x01\\x11\\x11\\x10\\
\\x11\\x11\\x1f\\x11\\
\\x11\\x11\\xf1\\xf1\\
\\x11\\x11\\xff\\xf1\\
\\x11\\x11\\x1f\\x11\\
\\x01\\x11\\x11\\x10\\
\\x00\\x11\\x11\\x00\\
'
eye_sf1 = upg.surface.Surface(8, 8, eyePixels1)

# The eye picture 2
eyePixels2 = b'\\
\\x00\\x11\\x11\\x00\\
\\x01\\x11\\x11\\x10\\
\\x11\\xf1\\x11\\x11\\
\\x1f\\x1f\\x11\\x11\\
\\x1f\\xff\\x11\\x11\\
\\x11\\xf1\\x11\\x11\\
\\x01\\x11\\x11\\x10\\
\\x00\\x11\\x11\\x00\\
'
eye_sf2 = upg.surface.Surface(8, 8, eyePixels2)

# The grass picture.
grassPixels = b'\\
\\x0c\\x00\\
\\xc0\\xc0\\
'
grass_sf = upg.surface.Surface(4, 2, grassPixels)

# Init variables.
centerBmPosX = const(55-12)
bottomBmPosY = const(88-24)
ballList = [centerBmPosX] * 16
startIndex = 0
x=centerBmPosX
vx = 0
frameNum = 0

# The main loop. 
while True:

    # Read a key event.
    eventtype = upg.event.poll()
    if eventtype != upg.NOEVENT:
        if eventtype.type== upg.KEYDOWN:
            if eventtype.key == upg.K_RIGHT:
                vx = 4
            if eventtype.key == upg.K_LEFT:
                vx = -4
        if eventtype.type == upg.KEYUP:
            if eventtype.key == upg.K_RIGHT:
                vx = 0
            if eventtype.key == upg.K_LEFT:
                vx = 0

    # Advance ball list start drawing index.
    startIndex -= 1
    if(startIndex < 0):
            startIndex = len(ballList)-1
    
    # Move the current bottom ball.
    x += vx
    ballList[startIndex] = x 

    # Draw the worm and the grass
    index = startIndex
    for y2 in range(0,bottomBmPosY, 4):
        
        # Draw grass in certain places.
        if(index == 4):
            screen.blit(grass_sf, 5 , y2+10)
        elif(index == 8):
            screen.blit(grass_sf, 100 , y2+10)
        elif(index == 12):
            screen.blit(grass_sf, 20 , y2+10)
        elif(index == 15):
            screen.blit(grass_sf, 70 , y2+10)

        # Draw one ball
        index -= 1
        if(index < 0):
            index = len(ballList)-1
        x2 = ballList[index]
        screen.blit(hero_sf, x2, y2)
        
    # Draw the eyes.
    if(frameNum & 63 == 63):
        pass  # Do not draw, blink.
    elif(vx > 0):
        # Look right.
        screen.blit(eye_sf1, x + 3 , bottomBmPosY + 5)
        screen.blit(eye_sf1, x + 13 , bottomBmPosY + 5)
    else:
        # Look left.
        screen.blit(eye_sf2, x + 3 , bottomBmPosY + 5)
        screen.blit(eye_sf2, x + 13 , bottomBmPosY + 5)
    
    # Update the display
    upg.display.flip()
    
    # Increase the frame number.
    frameNum += 1
    
`
};
