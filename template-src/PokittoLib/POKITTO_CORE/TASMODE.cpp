#include "Pokitto.h"

#if PROJ_SCREENMODE == TASMODE

#include <MemOps>
#ifndef POK_SIM
#include "HWLCD.h"
#else
#include "../POKITTO_SIM/SimLCD.h"
#endif // POK_SIM

using namespace Pokitto;

void write_command_16(uint16_t data);
void write_data_16(uint16_t data);

struct Sprite;

using draw_t = void (*)(uint8_t *line, Sprite &sprite, int y);
using Tilemap = uint8_t const * const *;
static constexpr int screenWidth = PROJ_LCDWIDTH;
static constexpr int screenHeight = PROJ_LCDHEIGHT;
constexpr uint32_t tileW = POK_TILE_W;
constexpr uint32_t tileH = POK_TILE_H;
constexpr uint32_t mapW = screenWidth / tileW + 2;
constexpr uint32_t mapH = screenHeight / tileH + 2;
const uint8_t *tilemap[mapH * mapW];
uint32_t cameraX;
uint32_t cameraY;

struct Sprite {
    int16_t x, y;
    const void *data;
    draw_t draw;
    uint8_t maxY;
    uint8_t b1, b2, b3;
};

void blit1BPP(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);
    int w = s.b2;
    const uint8_t *src = data + (y * w >> 3);
    if(s.x < 0){
        src -= s.x >> 3;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth+8){
        w = (screenWidth+8) - s.x;
    }

    if(w&7) w += 8;
    w >>= 3;
#ifndef POK_SIM
    pixelExpand(line, src, w, s.b1, 8);
#else
    auto recolor = s.b1;
    while(w--){
        unsigned int b = *src++;
        if(b&1) line[7] = recolor; b >>= 1;
        if(b&1) line[6] = recolor; b >>= 1;
        if(b&1) line[5] = recolor; b >>= 1;
        if(b&1) line[4] = recolor; b >>= 1;
        if(b&1) line[3] = recolor; b >>= 1;
        if(b&1) line[2] = recolor; b >>= 1;
        if(b&1) line[1] = recolor; b >>= 1;
        if(b&1) line[0] = recolor;
        line += 8;
    }
#endif
}

void blit(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);
    int w = s.b2;
    const uint8_t *src = data + y * w;
    if(s.x < 0){
        src -= s.x;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth){
        w = screenWidth - s.x;
    }
    /* */
    pixelCopy(line, src, w, s.b1);
    /*/
    while(w--){
        if(*src)
            *line = *src;
        line++;
        src++;
    }
    /* */
}


void blitMirror1BPP(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);
    int w = s.b2;
    const uint8_t *src = data + (y * w >> 3);
    if(s.x < 0){
        src -= s.x >> 3;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth+8){
        w = (screenWidth+8) - s.x;
    }

    line += w - 8;
    w >>= 3;
#ifndef POK_SIM
    pixelExpand(line, src, w, s.b1, -8);
#else
    auto recolor = s.b1;
    while(w--){
        unsigned int b = *src++;
        if(b&1) line[0] = recolor; b >>= 1;
        if(b&1) line[1] = recolor; b >>= 1;
        if(b&1) line[2] = recolor; b >>= 1;
        if(b&1) line[3] = recolor; b >>= 1;
        if(b&1) line[4] = recolor; b >>= 1;
        if(b&1) line[5] = recolor; b >>= 1;
        if(b&1) line[6] = recolor; b >>= 1;
        if(b&1) line[7] = recolor;
        line -= 8;
    }
#endif
}

void blitMirror(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);

    int w = s.b2;
    const uint8_t *src = data + y * w + w - 1;
    if(s.x < 0){
        w += s.x;
        src += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth){
        w = screenWidth - s.x;
    }
    /* */
    pixelCopyMirror(line, src - w + 1, w, s.b1);
    /*/
    while(w--){
        if(*src)
            *line = *src;
        line++;
        src--;
    }
    /* */
}


void blitFlip1BPP(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);
    int w = s.b2;
    int h = s.maxY - s.y;

    const uint8_t *src = data + ((h - 1 - y) * w >> 3);
    if(s.x < 0){
        src -= s.x >> 3;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth+8){
        w = (screenWidth+8) - s.x;
    }

    if(w&7) w += 8;
    w >>= 3;
#ifndef POK_SIM
    pixelExpand(line, src, w, s.b1, 8);
#else
    auto recolor = s.b1;
    while(w--){
        unsigned int b = *src++;
        if(b&1) line[7] = recolor; b >>= 1;
        if(b&1) line[6] = recolor; b >>= 1;
        if(b&1) line[5] = recolor; b >>= 1;
        if(b&1) line[4] = recolor; b >>= 1;
        if(b&1) line[3] = recolor; b >>= 1;
        if(b&1) line[2] = recolor; b >>= 1;
        if(b&1) line[1] = recolor; b >>= 1;
        if(b&1) line[0] = recolor;
        line += 8;
    }
#endif
}

void blitFlip(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);

    int w = s.b2;
    int h = s.maxY - s.y;
    const uint8_t *src = data + (h - 1 - y) * w;
    if(s.x < 0){
        src -= s.x;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth){
        w = screenWidth - s.x;
    }
    pixelCopy(line, src, w, s.b1);
    /*
    while(w--){
        if(*src)
            *line = *src;
        line++;
        src++;
    }
    */
}

void blitFlipMirror1BPP(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);
    int w = s.b2;
    int h = s.maxY - s.y;
    const uint8_t *src = data + ((h - 1 - y) * w >> 3);
    if(s.x < 0){
        src -= s.x >> 3;
        w += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth+8){
        w = (screenWidth+8) - s.x;
    }

    line += w - 8;
    w >>= 3;
#ifndef POK_SIM
    pixelExpand(line, src, w, s.b1, -8);
#else
    auto recolor = s.b1;
    while(w--){
        unsigned int b = *src++;
        if(b&1) line[0] = recolor; b >>= 1;
        if(b&1) line[1] = recolor; b >>= 1;
        if(b&1) line[2] = recolor; b >>= 1;
        if(b&1) line[3] = recolor; b >>= 1;
        if(b&1) line[4] = recolor; b >>= 1;
        if(b&1) line[5] = recolor; b >>= 1;
        if(b&1) line[6] = recolor; b >>= 1;
        if(b&1) line[7] = recolor;
        line -= 8;
    }
#endif
}

void blitFlipMirror(uint8_t *line, Sprite &s, int y){
    auto data = static_cast<const uint8_t*>(s.data);

    int w = s.b2;
    int h = s.maxY - s.y;
    const uint8_t *src = data + (h - 1 - y) * w + w - 1;
    if(s.x < 0){
        w += s.x;
        src += s.x;
    }else if(s.x > 0){
        line += s.x;
    }
    if(s.x + w >= screenWidth){
        w = screenWidth - s.x;
    }
    /* */
    pixelCopyMirror(line, src - w + 1, w, s.b1);
    /*/
    while(w--){
        if(*src)
            *line = *src;
        line++;
        src--;
    }
    /* */
}

Sprite spriteBuffer[PROJ_MAX_SPRITES];
uint32_t spriteBufferPos = 0;

void addSprite(const Sprite& s){
    if(spriteBufferPos >= PROJ_MAX_SPRITES) spriteBufferPos = 0;
    spriteBuffer[spriteBufferPos] = s;
    auto& sb = spriteBuffer[spriteBufferPos];
    int32_t maxY = sb.maxY;
    maxY += sb.y;
    if(maxY < 0) return;
    if(maxY > screenHeight) maxY = screenHeight;
    sb.maxY = maxY;
    spriteBufferPos++;
}

void pixelCopySolid4BPP(uint8_t *line, const uint8_t *src, uint32_t w, uint32_t sx){
    while(w--){
        auto b = (sx&1)?
            src[sx>>1]&0xF:
            src[sx>>1]>>4;
        if(b) *line = b;
        line++;
        sx++;
    }
}

void Display::shiftTilemap(int x, int y){
    if(x<0) x = 0;
    if(x>=tileW) x=tileW-1;
    if(y<0) y = 0;
    if(y>=tileH) y=tileH-1;

    cameraX = x % tileW;
    cameraY = y % tileH;
}

void Display::drawColumn(int x, int sy, int ey){
    if(x < 0 || x >= screenWidth) return;
    if(sy < 0) sy = 0;
    if(ey > screenHeight) ey = screenHeight;
    if(ey <= sy) return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   line[s.x] = s.b1;
               };
    addSprite(Sprite{x, sy, nullptr, f, ey - sy, Display::color});
}

void Display::drawRow(int sx, int ex, int y){
    if(y < 0 || y >= screenHeight) return;
    if(sx < 0) sx = 0;
    if(ex > screenWidth) ex = screenWidth;
    if(ex <= sx) return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   int c = s.b1;
                   int w = s.b2;
                   line += s.x;
                   while(w--){
                       *line++ = c;
                   }
               };
    addSprite(Sprite{sx, y, nullptr, f, 1, Display::color, ex - sx});
}

void Display::drawRectangle(int x, int y, int w, int h) {
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto c = s.b1;
                   int w = s.b2;
                   int sx = 0;
                   if(s.x < 0){
                       sx = -s.x;
                       w += s.x;
                   }else if(s.x >= 0){
                       line += s.x;
                       line[0] = c;
                   }
                   if(s.x + w >= screenWidth){
                       w = screenWidth - s.x;
                   }else{
                       line[w-1] = c;
                   }
                   if(y == 0 || y == s.b3){
                       while(w--){
                           *line++ = c;
                       }
                   }
               };

    addSprite(Sprite{x, y, nullptr, f, h, Display::color, w, h-1});
}

void Display::fillRectangle(int x, int y, int w, int h) {
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;
    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto c = s.b1;
                   int w = s.b2;
                   int sx = 0;
                   if(s.x < 0){
                       sx = -s.x;
                       w += s.x;
                   }else if(s.x > 0){
                       line += s.x;
                   }
                   if(s.x + w >= screenWidth){
                       w = screenWidth - s.x;
                   }
                   while(w--){
                       *line++ = c;
                   }
               };

    addSprite(Sprite{x, y, nullptr, f, h, Display::color, w});
}

int Display::bufferChar(int16_t x, int16_t y, uint16_t index){
    const uint8_t* bitmap = font;
    uint8_t w = *bitmap;
    uint8_t h = *(bitmap + 1);

    uint8_t hbytes = ((h>>3) + ((h != 8) && (h != 16)));

    // add an offset to the pointer (fonts !)
    bitmap = bitmap + 4 + index * (w * hbytes + 1);
    uint32_t numBytes = *bitmap++; //first byte of char is the width in bytes

    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return numBytes + adjustCharStep;

    draw_t f;
    if( fontSize != 2 ){
        fontSize = 1;
        f = [](uint8_t *line, Sprite &s, int y){
                int h = s.maxY - s.y;
                auto bitmap = static_cast<const uint8_t *>(s.data);
                int x = s.x;
                uint8_t fg = s.b3;
                uint8_t bg = s.b2;
                int numBytes = s.b1;
                if( s.b1 + x > screenWidth )
                    numBytes = screenWidth - x;

                uint8_t hbytes = ((h>>3) + ((h != 8) && (h != 16))) == 2;
                for (int i = 0; i < numBytes; i++) {
                    uint32_t bitcolumn = *bitmap++;
                    if (hbytes)
                        bitcolumn |= (*bitmap++)<<8;
                    uint8_t c = bitcolumn & (1<<y) ? bg : fg;
                    if( c != Display::invisiblecolor )
                        line[x+i] = c;
                }
            };
    } else {
        f = [](uint8_t *line, Sprite &s, int y){
                int h = (s.maxY - s.y)>>1;
                y >>= 1;
                auto bitmap = static_cast<const uint8_t *>(s.data);
                int x = s.x;
                uint8_t fg = s.b3;
                uint8_t bg = s.b2;
                int numBytes = s.b1;
                if( (s.b1<<1) + x > screenWidth )
                    numBytes = (screenWidth - x) >> 1;

                uint8_t hbytes = ((h>>3) + ((h != 8) && (h != 16))) == 2;

                for (int i = 0; i < numBytes; i++) {
                    uint32_t bitcolumn = *bitmap++;
                    if (hbytes)
                        bitcolumn |= (*bitmap++)<<8;
                    uint8_t c = bitcolumn & (1<<y) ? bg : fg;
                    if( c != Display::invisiblecolor ){
                        line[x+(i<<1)] = c;
                        line[x+(i<<1)+1] = c;
                    }
                }
            };
        h *= 2;
    }

    addSprite(Sprite{
            x, y,
            bitmap, f,
            h, numBytes,
            Display::color, Display::bgcolor
        });

    return numBytes*fontSize+adjustCharStep;
}

void Display::drawBitmapData2BPP(int x, int y, int w, int h, const uint8_t* bitmap){
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto w = s.b2;
                   auto src = static_cast<const uint8_t*>(s.data) + y * (w>>2);
                   int sx = 0;
                   if(s.x < 0){
                       sx = -s.x;
                       w += s.x;
                   }else if(s.x > 0){
                       line += s.x;
                   }
                   if(s.x + w >= screenWidth){
                       w = screenWidth - s.x;
                   }
                   while(w--){
                       auto b = (src[sx>>2] >> ((sx&3)<<1)) & 0x3;
                       if(b) *line = b;
                       line++;
                       sx++;
                   }
               };

    addSprite(Sprite{x, y, bitmap, f, h, 0, w});
}

void Display::drawBitmapDataXFlipped2BPP(int x, int y, int w, int h, const uint8_t* bitmap){
}

void Display::drawBitmapDataXFlipped8BPP(int x, int y, int w, int h, const uint8_t* bitmap){
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0) return;
    addSprite(Sprite{x, y, bitmap, blitMirror, h, 0, w});
}

void Display::drawBitmapDataYFlipped(int16_t x, int16_t y, int16_t w, int16_t h, const uint8_t* bitmap) {
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto h = s.maxY - s.y;
                   auto w = s.b2;
                   auto src = static_cast<const uint8_t*>(s.data) + (h - 1 - y) * (w>>1);
                   int sx = 0;
                   if(s.x < 0){
                       sx = -s.x;
                       w += s.x;
                   }else if(s.x > 0){
                       line += s.x;
                   }
                   if(s.x + w >= screenWidth){
                       w = screenWidth - s.x;
                   }
                   while(w--){
                       auto b = (sx&1)?
                           src[sx>>1]&0xF:
                           src[sx>>1]>>4;
                       if(b) *line = b;
                       line++;
                       sx++;
                   }
               };

    addSprite(Sprite{x, y, bitmap, f, h, 0, w});
}

void Display::drawBitmapDataXFlipped4BPP(int x, int y, int w, int h, const uint8_t* bitmap){
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto w = s.b2;
                   auto src = static_cast<const uint8_t*>(s.data) + y * (w>>1) + (w>>1);
                   if(s.x < 0){
                       w += s.x;
                   }else if(s.x > 0){
                       line += s.x;
                   }
                   if(s.x + w >= screenWidth){
                       src -= (screenWidth - (s.x + w)) >> 1;
                       w = screenWidth - s.x;
                   }
                   int sx = -1;
                   while(w--){
                       auto b = (sx&1)?
                           src[sx>>1]&0xF:
                           src[sx>>1]>>4;
                       if(b) *line = b;
                       line++;
                       sx--;
                   }
               };

    addSprite(Sprite{x, y, bitmap, f, h, 0, w});
}

void Display::drawBitmapData4BPP(int x, int y, int w, int h, const uint8_t* bitmap){
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0)
        return;

    draw_t f = [](uint8_t *line, Sprite &s, int y){
                   auto w = s.b2;
                   auto src = static_cast<const uint8_t*>(s.data) + y * (w>>1);
                   int sx = 0;
                   if(s.x < 0){
                       sx = -s.x;
                       w += s.x;
                   }else if(s.x > 0){
                       line += s.x;
                   }
                   if(s.x + w >= screenWidth){
                       w = screenWidth - s.x;
                   }
                   while(w--){
                       auto b = (sx&1)?
                           src[sx>>1]&0xF:
                           src[sx>>1]>>4;
                       if(b) *line = b;
                       line++;
                       sx++;
                   }
               };

    addSprite(Sprite{x, y, bitmap, f, h, 0, w});
}

void Display::drawBitmapData8BPP(int x, int y, int w, int h, const uint8_t* bitmap) {
    if(y >= screenHeight || y + h < 0 || x >= screenWidth || x + w < 0) return;
    addSprite(Sprite{x, y, bitmap, blit, h, 0, w});
}

void Display::drawColorTile(uint32_t x, uint32_t y, uint8_t color){
    if(x >= mapW || y >= mapH)
        return;
    uint32_t color32 = color;
    tilemap[y*mapW + x] = reinterpret_cast<const uint8_t*>(color32);
}


void Display::drawTile(uint32_t x, uint32_t y, const uint8_t *data){
    if(x >= mapW || y >= mapH)
        return;
    tilemap[y*mapW + x] = data;
}

void Display::drawSprite(int x, int y, const uint8_t *data, bool flipped, bool mirrored, uint8_t recolor){
    drawSpriteBitmap(x, y, data[0], data[1], data + 2, flipped, mirrored, recolor);
}

void Display::drawSpriteBitmap(int x, int y, int width, int height, const uint8_t *data, bool flipped, bool mirrored, uint8_t recolor){
    if(y >= screenHeight || y + height < 0 || x >= screenWidth || x + width < 0) return;
    draw_t mode;

    if(Display::m_colordepth == 1){
        mode = flipped ?
         (mirrored ? blitFlipMirror1BPP : blitFlip1BPP):
         (mirrored ? blitMirror1BPP : blit1BPP);
    }else{
        mode = flipped ?
            (mirrored ? blitFlipMirror : blitFlip):
            (mirrored ? blitMirror     : blit);
    }

    addSprite(Sprite{x, y, data, mode, height, recolor, width});
}

void drawSprites(int16_t y, uint8_t *line, int max){
    if(!max) return;
    for(uint32_t i=0; i<spriteBufferPos; ++i){
        auto& s = spriteBuffer[i];
        if( s.y > y ) continue;

        int smaxY = s.maxY;
        if( smaxY <= y ){
            /* makes no difference? * /
            for(uint32_t j=i+1; j<spriteBufferPos; ++j){
                spriteBuffer[j-1] = spriteBuffer[j];
            }
            --i;
            --spriteBufferPos;
            /* */
            continue;
        }

        s.draw(line, s, y - s.y);
        if(!--max) break;
    }
}

// STUBS - To-Do: implement these?
void Display::drawPixel(int16_t,int16_t){}
void Display::drawPixel(int16_t x,int16_t y, uint8_t col){}
void Display::drawPixelRaw(int16_t x,int16_t y, uint8_t col){}
void Display::drawPixelNOP(int16_t x,int16_t y, uint8_t col){}
uint8_t Display::getPixel(int16_t,int16_t){ return 0; }
void Display::drawLine(int16_t,int16_t,int16_t,int16_t){}
void Display::drawCircle(int16_t x0, int16_t y0, int16_t r){}
void Display::drawCircleHelper(int16_t x0, int16_t y0, int16_t r, uint16_t cornername){}
void Display::fillCircle(int16_t x0, int16_t y0, int16_t r){}
void Display::fillCircleHelper(int16_t x0, int16_t y0, int16_t r, uint16_t cornername, int16_t delta){}
void Display::drawTriangle(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2){}
void Display::drawRoundRect(int16_t x0, int16_t y0, int16_t w, int16_t h, int16_t radius){}
void Display::fillRoundRect(int16_t x0, int16_t y0, int16_t w, int16_t h, int16_t radius){}

namespace TAS {
    void DitherFiller(std::uint8_t* line, std::uint32_t y, bool skip){
        if(skip)
            return;
        MemOps::set(line + (y&1), Display::bgcolor, (screenWidth>>1) - (y&1), 2);
    }
}

namespace TAS {
    void ColorFiller(std::uint8_t* line, std::uint32_t y, bool skip){
        if(skip)
            return;
        MemOps::set(line, Display::bgcolor, screenWidth);
    }
}

namespace TAS {
    uint8_t spritesPerLine[screenHeight];
    void SpriteFiller(std::uint8_t* line, std::uint32_t y, bool skip){
        if(y == 0){
            for(int i=0; i<screenHeight; ++i)
                spritesPerLine[i] = 0;

            for(uint32_t i=0; i<spriteBufferPos; ++i){
                auto& s = spriteBuffer[i];
                for(int y=std::max(0, static_cast<int>(s.y)), my=std::min(screenHeight, static_cast<int>(s.maxY)); y<my; ++y){
                    spritesPerLine[y]++;
                }
            }
        }

        if(!skip)
            drawSprites(y, line, spritesPerLine[y]);

        if(y == screenHeight-1)
            spriteBufferPos = 0;
    }
}

namespace TAS {
    static Tilemap  tileWindow;
    static uint32_t tileY;
    static uint32_t tileIndex;

    void BGTileFiller(std::uint8_t* line, std::uint32_t y, bool skip){
        if(y == 0){
            tileWindow = tilemap;
            tileY = tileH - cameraY;
            tileIndex = cameraY * tileW;
        }

        if(!tileY--){
            tileIndex = 0;
            tileY = tileH - 1;
            tileWindow += mapW;
        }

        if(skip)
            return;

        uint32_t tileX = cameraX;
        uint32_t tile = 0;
        if (Display::m_colordepth == 8) {
            for(uint32_t i=0; i<screenWidth;){
                int iter = std::min(tileW - tileX, screenWidth - i);
                auto tileColor = reinterpret_cast<uintptr_t>(tileWindow[tile]);
                if( tileColor < 256 ){
                    MemOps::set(line+i, tileColor, iter);
                }else{
                    auto tileData = tileWindow[tile] + tileX + tileIndex;
                    pixelCopySolid(line+i, tileData, iter);
                }
                i += iter;
                tileX = 0;
                tile++;
            }
        }else if(Display::m_colordepth == 4){
            for(uint32_t i=0; i<screenWidth;){
                int iter = std::min(tileW - tileX, screenWidth - i);
                auto tileColor = reinterpret_cast<uintptr_t>(tileWindow[tile]);
                if( tileColor < 256 ){
                    MemOps::set(line+i, tileColor, iter);
                }else{
                    auto tileData = tileWindow[tile] + (tileIndex>>1);
                    pixelCopySolid4BPP(line+i, tileData, iter, tileX);
                }
                i += iter;
                tileX = 0;
                tile++;
            }
        }

        tileIndex += tileW;
    }
}

namespace Pokitto {

void lcdRefreshTASMode(const uint16_t* palette){
    uint8_t lineBuffer[screenWidth + 16];
    uint8_t *line = lineBuffer + 8;
    auto mask = Display::TASMask;
    bool disabled = mask & 1;
    uint32_t maskY = 8;

    constexpr int lineFillerCount = sizeof(Display::lineFillers) / sizeof(Display::lineFillers[0]);
    int fillerCount = 0;
    TAS::LineFiller fillers[lineFillerCount];
    for(int i=0; i<lineFillerCount; i++){
        auto filler = Display::lineFillers[i];
        if(!filler || filler == TAS::NOPFiller)
            continue;
        fillers[fillerCount++] = filler;
    }

    for(uint32_t y=0; y<screenHeight; ++y ){
        #ifdef POK_SIM

        if(screenHeight == 88){
            Pokitto::setDRAMptr(0,y*2); //needs to be called explicitly for pokitto_sim (no real controller!)
        }
        else{
            Pokitto::setDRAMptr(0,y); //needs to be called explicitly for pokitto_sim (no real controller!)
        }
        #if PROJ_LCDHEIGHT == 88 // Low Res
        #else
        #endif

        #endif // POK_SIM
        if(!--maskY){
            maskY = 9;
            mask >>= 1;
            if( !(mask & 1) && disabled ){
                #ifndef POK_SIM
                write_command(0x20);  // Horizontal DRAM Address
                write_data(y);
                write_command(0x21);  // Vertical DRAM Address
                write_data(0);  // 0
                write_command(0x22); // write data to DRAM
                CLR_CS_SET_CD_RD_WR;
                SET_MASK_P2;
                #else

                if(screenHeight == 88){
                    Pokitto::setDRAMptr(0,y*2); //needs to be called explicitly for pokitto_sim (no real controller!)
                }
                else{
                    Pokitto::setDRAMptr(0,y); //needs to be called explicitly for pokitto_sim (no real controller!)
                }

                #endif // POK_SIM
            }
            disabled = mask & 1;
        }

        for( int i=0; i<fillerCount; ++i ){
            fillers[i]( line, y, disabled );
        }

        if(disabled)
            continue;

       if(screenWidth == 220){
            flushLine(palette, line);
        }else if(screenWidth == 110){
            flushLine2X(palette, line);
        }

        if(screenHeight == 88){
            if(screenWidth == 220){
                flushLine(palette, line);
            }else if(screenWidth == 110){
                #ifdef POK_SIM
                Pokitto::setDRAMptr(0,y*2 + 1);
                #endif
                flushLine2X(palette, line);
            }
        }
    }
}
}

#endif
