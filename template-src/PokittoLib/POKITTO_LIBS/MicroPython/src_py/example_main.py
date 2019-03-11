import upygame as pygame
import framebuf
import urandom as random
import example_data as spritedata
import sprite
import gc

pygame.display.init(False)
pygame.display.set_palette_16bit(spritedata.palette);
screen = pygame.display.set_mode() # full screen

# map
tilemap = pygame.tilemap.Tilemap(16,16,spritedata.mapPixels1)
tilemap.set_tile(0xb, 16, 16, spritedata.green16);
tilemap.set_tile(0x5, 16, 16, spritedata.tree16);
tilemap.set_tile(0x4, 16, 16, spritedata.grass16);
tilemap.set_tile(0x8, 16, 16, spritedata.water16);

vx = 0;
vy = 0;
x = -200;
y = -200;
mapW = 16*16
mapH = 16*16
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


    x += vx
    if(x>0): x=0
    if(x + mapW < 110): x = 110 - mapW

    y += vy
    if(y>0): y=0
    if(y + mapH < 88): y = 88- mapH

    tilemap.draw(x, y)

    screen.blit(spritedata.girl12x15, 55, 44)

    pygame.display.flip()
