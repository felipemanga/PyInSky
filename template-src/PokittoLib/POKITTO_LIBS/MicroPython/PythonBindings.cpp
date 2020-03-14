/**************************************************************************/
/*!
    @file     PythonBindings.cpp
    @author   Hannu Viitala

    @section LICENSE

    Software License Agreement (BSD License)

    Copyright (c) 2017, Hannu Viitala
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:
    1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
    2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
    3. Neither the name of the copyright holders nor the
    names of its contributors may be used to endorse or promote products
    derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS ''AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/**************************************************************************/

#include "PokittoCore.h"
#include "PokittoDisplay.h"
#include "Tilemap.hpp"
#include "PokittoCookie.h"
#include "PythonBindings.h"
#include "time.h"

using namespace Pokitto;

#if MICROPY_ENABLE_GC==1  // This means micropython is used

// Ring buffer size
#define EVENT_RING_BUFFER_SIZE 10

// Ring buffer Local data
EventRingBufferItem eventRingBuffer[EVENT_RING_BUFFER_SIZE];
int rbNextFreeItemIndex = 0;
int rbOldestItemIndex = -1; // empty

// Add item to the end of ring buffer
bool Pok_addToRingBuffer(uint8_t type, uint8_t key) {

    if(rbNextFreeItemIndex == rbOldestItemIndex) {
        //POK_TRACE("!!HV buffer full. CANNOT ADD! ***\r\n");
        return false; // The ring buffer is full. Do nothing.
    }

    // Store the item and the new index.
    eventRingBuffer[rbNextFreeItemIndex].key = key;
    eventRingBuffer[rbNextFreeItemIndex].type = type;

    // if was empty, update
    if(rbOldestItemIndex == -1) {
        rbOldestItemIndex = rbNextFreeItemIndex;
        //POK_TRACE("!!HV added first item ***\r\n");
    }

     // Advance index
    if(++rbNextFreeItemIndex >= EVENT_RING_BUFFER_SIZE)
        rbNextFreeItemIndex = 0; // continue from the start of array

    //!!HV
    //char test[64];
    int size = rbNextFreeItemIndex-rbOldestItemIndex;
    if(size<0)
        size += EVENT_RING_BUFFER_SIZE;
    //sprintf(test, "!!HV: Added to buffer. size = %d\r\n", size);
    //POK_TRACE(test);

    return true;
}

// Remove item from the start of ring buffer
bool Pok_readAndRemoveFromRingBuffer(EventRingBufferItem* itemOut){

    if(rbOldestItemIndex == -1) {
        //POK_TRACE("!!HV buffer is empty. cannot read. ***\n");
        return false; // The ring buffer is empty. Do nothing.
    }

    // Read oldest item.
    *itemOut = eventRingBuffer[rbOldestItemIndex];

    // Advance oldest index
    if(++rbOldestItemIndex >= EVENT_RING_BUFFER_SIZE)
        rbOldestItemIndex = 0; // continue from the start of array

    if(rbOldestItemIndex == rbNextFreeItemIndex) {
        rbOldestItemIndex = -1; // buffer is empty now
        //POK_TRACE("!!HV buffer is empty now ***\r\n");
    }

    //!!HV
    //char test[64];
    int size = rbNextFreeItemIndex-rbOldestItemIndex;
    if(size<0)
        size += EVENT_RING_BUFFER_SIZE;
    //sprintf(test, "!!HV: Removed from buffer. size = %d\r\n", size);
    //POK_TRACE(test);

    return true;
}

void Pok_Display_init( bool mustClearScreen )
{
    Display::persistence = !mustClearScreen;
}

uint8_t Pok_Display_getNumberOfColors() {

    return Display::getNumberOfColors();
}

uint16_t Pok_Display_getWidth() {

    return Display::getWidth();
}

uint16_t Pok_Display_getHeight() {

    return Display::getHeight();
}

void Pok_Display_setForegroundColor(int16_t color_) {
    Display::color = (uint8_t)color_;
}

void Pok_Display_setBackgroundColor(int16_t color) {
    Display::bgcolor = (uint8_t)color;
}

void Pok_Display_setInvisibleColor(int16_t color) {
    Display::invisiblecolor = (uint8_t)color;
}

void Pok_Display_drawPixel(int16_t x,int16_t y) {
    Display::drawPixel(x,y);
}

void Pok_Display_drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1) {
    Display::drawLine(x0, y0, x1, y1);
}

void Pok_Display_drawRectangle(int16_t x0, int16_t y0, int16_t w, int16_t h) {
    Display::drawRectangle(x0, y0, w, h);
}

void Pok_Display_fillRectangle(int16_t x, int16_t y, int16_t w, int16_t h) {
    Display::fillRectangle(x, y, w, h);
}

void Pok_Display_drawCircle(int16_t x0, int16_t y0, int16_t r) {
    Display::drawCircle(x0, y0, r);
}

void Pok_Display_fillCircle(int16_t x0, int16_t y0, int16_t r) {
    Display::fillCircle(x0, y0, r);
}

void Pok_Display_write(const uint8_t *buffer, uint8_t size) {

    Display::write(buffer, size);
}

void Pok_Display_print(uint8_t x, uint8_t y, const char str[], uint8_t color) {

    if( color != -1)
        Display::color = color;
    Display::print( x, y, str );
}

void Pok_Display_blitFrameBuffer(int16_t x, int16_t y, int16_t w, int16_t h, bool flipH, bool flipV, int16_t invisiblecol_, const uint8_t *buffer) {
    if( invisiblecol_ != -1)
        Display::invisiblecolor = (uint8_t)invisiblecol_;

    if(flipH)
        Display::drawBitmapDataXFlipped(x, y, w, h, buffer );
    else if(flipV)
        Display::drawBitmapDataYFlipped(x, y, w, h, buffer );
    else
        Display::drawBitmapData(x, y, w, h, buffer );
}

void Pok_Display_setSprite(uint8_t index, int16_t x, int16_t y, int16_t w, int16_t h, int16_t invisiblecol_, uint8_t *buffer, uint16_t* palette16x16bit, bool doResetDirtyRect) {
}

void Pok_Display_setSpritePos(uint8_t index, int16_t x, int16_t y) {
}

uint16_t POK_game_display_RGBto565(uint8_t r, uint8_t g, uint8_t b) {
    return Display::RGBto565(r, g, b);
}

void POK_game_display_setPalette(uint16_t* paletteArray, int16_t len) {
    for( int i = 0; i < len; i++ )
        Display::palette[i] = paletteArray[i];
}

void Pok_Display_setClipRect(int16_t x, int16_t y, int16_t w, int16_t h) {
}

// Draw the screen surface immediately to the display. Do not care about fps limits. Do not run event loops etc.
void Pok_Display_update(bool useDirectMode, uint8_t x, uint8_t y, uint8_t w, uint8_t h)
{
    Display::update(useDirectMode);
}

// Run the event loops, audio loops etc. Draws the screen when the fps limit is reached and returns true.
bool Pok_Core_update(bool useDirectMode, uint8_t x, uint8_t y, uint8_t w, uint8_t h )
{

    bool ret = Core::update(useDirectMode);
    //printf("update, %d ms\n", Core::getTime()-s);
    return ret;
}



bool Pok_Core_isRunning() {

    return Core::isRunning();
}

bool Pok_Core_buttons_repeat(uint8_t button, uint8_t period) {

    return Core::buttons.repeat(button, period);
}

bool Pok_Core_buttons_held(uint8_t button, uint8_t period) {

    return Core::buttons.held(button, period);
}

bool Pok_Core_buttons_released(uint8_t button) {

    return Core::buttons.released(button);
}

// *** Sound functions

void Pok_Sound_Reset() {

    #if POK_STREAMING_MUSIC > 0

    // Init buffers to an empty value: 128.
    #if POK_HIGH_RAM == HIGH_RAM_MUSIC
    memset(buffers[0], 128, BUFFER_SIZE);
    memset(buffers[1], 128, BUFFER_SIZE);
    memset(buffers[2], 128, BUFFER_SIZE);
    memset(buffers[3], 128, BUFFER_SIZE);
    #else
    memset(&(buffers[0]), 128, BUFFER_SIZE);
    memset(&(buffers[1]), 128, BUFFER_SIZE);
    memset(&(buffers[2]), 128, BUFFER_SIZE);
    memset(&(buffers[3]), 128, BUFFER_SIZE);
    #endif

    // Set global variables
    currentBuffer = 0;
    currentPtr = buffers[currentBuffer];
    endPtr = currentPtr + BUFFER_SIZE;

    //pokPlayStream(); // activate stream
    //Sound::ampEnable(true);
    //Pokitto::Sound::playMusicStream();

    /*
    //!!HV
    for(uint32_t bufferIndex=0; bufferIndex<4; bufferIndex++) {
        printf("\n*** buffer num : %d\n", bufferIndex);
        for(uint32_t t=0; t<BUFFER_SIZE; t++) {
            if(t%64 == 0) printf("\n");
            printf("%u,", buffers[bufferIndex][t]);
        }
    }
    */
    #endif
}

void Pok_Sound_PlayMusicFromSD(char* filePath) {
    #if POK_STREAMING_MUSIC > 0
    Pokitto::Sound::pauseMusicStream();
    fileClose(); // Close the file always just in case the same file is loaded again.
    int ok = Pokitto::Sound::playMusicStream(filePath);
    if(ok)
        Pokitto::Sound::playMusicStream();
    else
    {
        Pokitto::Sound::pauseMusicStream();
        Pok_Sound_Reset();
    }
    #endif
}

uint8_t Pok_Sound_GetCurrentBufferIndex() {    //

    #if POK_STREAMING_MUSIC > 0
    return currentBuffer;
    #else
    return 0;
    #endif
}

uint32_t Pok_Sound_GetCurrentBufferPos() {    //

    #if POK_STREAMING_MUSIC > 0
    return (currentPtr - &(buffers[currentBuffer][0])) / sizeof(buffers[currentBuffer][0]);
    #else
    return 0;
    #endif
}

uint32_t Pok_Sound_GetBufferSize() {    //

    #if POK_STREAMING_MUSIC > 0
    return BUFFER_SIZE;
    #else
    return 0;
    #endif
}

void Pok_Sound_FillBuffer(void* buf, uint16_t len, uint8_t soundBufferIndex, uint16_t soundBufferPos) {

    #if POK_STREAMING_MUSIC > 0
    //
//    if(soundBufferPos<512)
//        printf("%d::%u\n", soundBufferPos, *(unsigned char*)buf);
//    else
//        printf("%d::%u\n", soundBufferPos, *(unsigned char*)buf);

    memcpy(&(buffers[soundBufferIndex][soundBufferPos]), buf, len);
    #endif
}

void Pok_Sound_Play() {
    #if POK_STREAMING_MUSIC > 0
    //streamvol = 3;
    Pokitto::Sound::playMusicStream();
    #endif
}

void Pok_Sound_Pause() {
    #if POK_STREAMING_MUSIC > 0
    //streamvol = 0;
    Pokitto::Sound::pauseMusicStream();
   #endif
}

void Pok_Sound_playSFX(void *sfxdata, uint32_t length, bool is4bitSample) {
    #if POK_STREAMING_MUSIC > 0
    if(is4bitSample)
        Pokitto::Sound::playSFX4bit( (const uint8_t*)sfxdata, length );
    else
        Pokitto::Sound::playSFX( (const uint8_t*)sfxdata, length );
    #endif
}

void Pok_Sound_playSFX(const uint8_t *sfxdata, uint32_t length) {
    #if POK_STREAMING_MUSIC > 0
    Pokitto::Sound::playSFX( sfxdata, length );
    #endif
}

void Pok_Wait(uint32_t dur_ms) {
#ifdef POK_SIM
    Simulator::wait_ms(dur_ms);
#else
    wait_ms(dur_ms);
#endif // POK_SIM
}

uint32_t Pok_Time_ms()
{
    return Core::getTime();
}

// Tilemap functions.

void* Pok_ConstructMap()
{
    return new Tilemap();
}

void Pok_DestroyMap( void* _this )
{
    delete(((Tilemap*)_this));
}

void Pok_SetMap( void* _this, size_t width, size_t height, const uint8_t *map )
{
    if( _this == NULL ) return;
   ((Tilemap*)_this)->set( width, height, map );
}

void Pok_DrawMap( void* _this, int32_t x, int32_t y )
{
    if( _this == NULL ) return;
    ((Tilemap*)_this)->draw( x, y );
}

void Pok_SetTile( void* _this, uint8_t index, uint8_t width, uint8_t height, const uint8_t *data)
{
    if( _this == NULL ) return;
    index &= 0xf; // Limit between 0 and 15.
    ((Tilemap*)_this)->setTile(index, width, height, data );
}

uint8_t Pok_GetTileId( void* _this, int32_t x, int32_t y, uint8_t tileSize ) {
    if( _this == NULL ) return 0;
    uint8_t id = ((Tilemap*)_this)->GetTileId( x, y, tileSize );
    return id;
}

void Pok_GetTileIds( void* _this, int32_t tlx, int32_t tly, int32_t brx, int32_t bry,uint8_t tileSize,
                        /*OUT*/ uint8_t* tileIdTl, uint8_t* tileIdTr, uint8_t* tileIdBl, uint8_t* tileIdBr ) {
    if( _this == NULL ) return;
    ((Tilemap*)_this)->GetTileIds( tlx, tly, brx, bry, tileSize,
                    /*OUT*/ *tileIdTl, *tileIdTr, *tileIdBl, *tileIdBr );
 }

//*** EEPROM reading and writing ***

void* Pok_CreateCookie(char* name, uint8_t* cookieBufPtr, uint32_t cookieBufLen)
{
    Pokitto::Cookie* mycookiePtr = new Pokitto::Cookie;
    
    //initialize cookie
    if(mycookiePtr )mycookiePtr->beginWithData(name, cookieBufLen, (char*)cookieBufPtr); 

    return (void*)mycookiePtr;
}

void Pok_DeleteCookie(void* mycookiePtr )
{
    delete((Pokitto::Cookie*)mycookiePtr);
}

void Pok_LoadCookie(void* mycookiePtr)
{
    ((Pokitto::Cookie*)mycookiePtr)->loadCookie();
}

void Pok_SaveCookie(void* mycookiePtr)
{
    // Save cookie if this is the best time
    ((Pokitto::Cookie*)mycookiePtr)->saveCookie();
}

// For compatibility in linking

struct tm * localtime_cpp(const time_t * timer)
{
    return(localtime(timer));
}

time_t time_cpp(time_t* timer){
    return(time(timer));
}


#endif // MICROPY_ENABLE_GC
