/**************************************************************************/
/*!
    @file     My_settings.h
    @author   XX

    @section HOW TO USE My_settings

   My_settings can be used to set project settings inside the mbed online IDE
*/
/**************************************************************************/

#ifndef MY_SETTINGS_H
#define MY_SETTINGS_H

#define PROJ_HIRES 0 //1 = high resolution (220x176) , 0 = low resolution fast mode (110x88)

// Sound
#define PROJ_ENABLE_SOUND 1     // 0 = all sound functions disabled
#define PROJ_STREAMING_MUSIC 1  // Use streaming music (either SD or filling buffers programmaticly)
#define PROJ_AUD_FREQ 8000

#ifndef POK_SIM
#define PROJ_HIGH_RAM HIGH_RAM_MUSIC
#define PROJ_FPS 200
#else
#define PROJ_FPS 10
#endif

#define PROJ_SHOW_FPS_COUNTER
//#define PROJ_FPS 20

#define _OSCT 2

// Python specific

#define PROJ_PYTHON_REPL 0
#define MICROPY_ENABLE_GC 1  // This just means micropython is in use

#ifdef POK_SIM
#define USE_USB_SERIAL_PRINT (0)
#else
#define USE_USB_SERIAL_PRINT (0)
#endif

#define DEFAULT_FONT fontTiny

#endif
