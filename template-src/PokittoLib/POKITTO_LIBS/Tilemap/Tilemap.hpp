#pragma once

#ifndef MAX_TILE_COUNT
#define MAX_TILE_COUNT 16
#endif

#include "Pokitto.h"

#include <cstdint>

void SDL_RenderCopySolid( const uint8_t *data, uint32_t width, uint32_t height, int32_t x, int32_t y );

class Tilemap {

    int32_t blit( uint32_t id, int32_t /*OUT*/&x, int32_t y ){
        Tile &tile = tiles[id];
        if( !tile.data )
            return 0;

        if(
            x < Pokitto::Display::width &&
            y < Pokitto::Display::height &&
            (x + tile.width >= 0) &&
            (y + tile.height >= 0)
            ){
            #if POK_SCREENMODE != MODE_FAST_16COLOR
            Pokitto::Display::drawBitmapData(
            x, y,
            tile.width, tile.height,
            tile.data
            );
            #else
            SDL_RenderCopySolid(
            tile.data,
            tile.width, tile.height,
            x, y
            );
            #endif
        }

        x += tile.width;
        return tile.height;
    }

public:

    struct Tile {
        const uint8_t *data;
        std::uint8_t width;
        std::uint8_t height;
        void set( uint8_t width, uint8_t height, const uint8_t *data ){
            this->data = data;
            this->height = height;
            this->width = width;
        }
    } tiles[ MAX_TILE_COUNT ];

    const uint8_t *map;
    std::size_t width;
    std::size_t height;

    Tilemap(){
        map = nullptr;
        for( std::uint32_t i=0; i<MAX_TILE_COUNT; ++i )
            tiles[i].data = 0;
    }

    void set( size_t width, size_t height, const uint8_t *map ){
        this->width = width;
        this->height = height;
        this->map = map;
    }

    void draw( std::int32_t x, std::int32_t y ){

        if( !map ) return;

        int32_t cx = x, cy = y;
        for( uint32_t ty = 0; ty<height; ty++ ){
            cx = x;

            // Note: Each 8-bit map item contains 2 tiles.
            uint32_t h = 0;
            for( uint32_t tx = 0; tx<width; tx += 2 ){
                uint32_t id = map[ (ty*width + tx)>>1 ];

                h = blit( id >> 4, /*OUT*/cx, cy );
                if( cx < Pokitto::Display::width )
                    h = blit( id & 0xF, /*OUT*/cx, cy );

                if( cx >= Pokitto::Display::width )
                    break;
            }

            cy += h;

        }
    }
};
