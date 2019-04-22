examples["Graphics Primitives"] = {
    "main.py":`import upygame as pygame

# Setup the screen
pygame.display.init(False) # Do not clear the screen buffer after update
pygame.display.set_palette_16bit([
    0xce38, 0x001f, 0x0000, 0x9cd3, 0xecd4, 0xf800, 41764, 17475,
    58225, 13598, 60486, 40179, 42596, 46845, 63245, 65535
]);
screen = pygame.display.set_mode() # full screen

# Constants
SCREENW = const(110)
SCREENH = const(88)
SCREEN_CENTER_W = const(55)
SCREEN_CENTER_H = const(44)
MIN_RADIUS = const(5)
MAX_RADIUS = const(40)

# The list of primitives to draw
elementList = [
    [SCREEN_CENTER_W,SCREEN_CENTER_H,40,0],
    [SCREEN_CENTER_W,SCREEN_CENTER_H,30,4],
    [SCREEN_CENTER_W,SCREEN_CENTER_H,20,8],
    [SCREEN_CENTER_W,SCREEN_CENTER_H,10,12],
]

# Initialize variables
phase=0
maxPhase = 5
frameNum = 0;

# The main loop
while True:

    # Fill the whole screen with blue. 
    pygame.draw.rect(pygame.Rect(0,0,SCREENW,SCREENH), True, 1)

    # Draw the primitives depending on the current phase
    for i in range(len(elementList)):
        e = elementList[i]
        radius = e[2] + 1
        if(radius<=MAX_RADIUS):
            if(phase==0):
                # Filled circles
                pygame.draw.circle(e[0], e[1], radius, True, e[3])
            elif(phase==1):
                # Circles
                pygame.draw.circle(e[0], e[1], radius, False, e[3])
            elif(phase==2):
                # Filled rectangles
                pygame.draw.rect(pygame.Rect(e[0]-radius, e[1]-radius, 2*radius, 2*radius), True, e[3])
            elif(phase==3):
                # Rectangles
                pygame.draw.rect(pygame.Rect(e[0]-radius, e[1]-radius, 2*radius, 2*radius), False, e[3])
            elif(phase==4):
                # Lines
                pygame.draw.line(e[0]-radius, e[1]-(radius//2), e[0]+radius, e[1]-(radius//2), e[3])
                pygame.draw.line(e[0]-radius, e[1]+(radius//2), e[0]+radius, e[1]+(radius//2), e[3])
                pygame.draw.line(e[0]-(radius//2), e[1]-radius, e[0]-(radius//2), e[1]+radius, e[3])
                pygame.draw.line(e[0]+(radius//2), e[1]-radius, e[0]+(radius//2), e[1]+radius, e[3])
            elif(phase==5):
                # Pixels
                pygame.draw.pixel(e[0]-radius, e[1]-(radius//2), e[3])
                pygame.draw.pixel(e[0]+radius, e[1]-(radius//2), e[3])
                pygame.draw.pixel(e[0]-radius, e[1]+(radius//2), e[3])
                pygame.draw.pixel(e[0]+radius, e[1]+(radius//2), e[3])
                pygame.draw.pixel(e[0]-(radius//2), e[1]-radius, e[3])
                pygame.draw.pixel(e[0]-(radius//2), e[1]+radius, e[3])
                pygame.draw.pixel(e[0]+(radius//2), e[1]-radius, e[3])
                pygame.draw.pixel(e[0]+(radius//2), e[1]+radius, e[3])
        e[2] = radius

    # Remove the first element if the radius is too big, and add a new element to the end
    first = elementList[0]
    if(first[2]>MAX_RADIUS):
        elementList.append([SCREEN_CENTER_W,SCREEN_CENTER_H,MIN_RADIUS,first[3]])
        del(elementList[0])

    # Draw the screen buffer to the screen
    pygame.display.flip()

    # Advance the primitive drawing phase
    if(frameNum%80 == 0):
        phase+=1
        if(phase>maxPhase): phase = 0

    # Advance the frame number
    frameNum += 1
`
};
