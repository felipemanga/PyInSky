
const { execFile, execSync } = require('child_process');
const fs = require('fs');

const CSOURCES = []
, CXXSOURCES = []
, FLAGS=[]
, C_FLAGS=[]
, CXX_FLAGS=[]
;

let CC='../../gcc-arm-none-eabi/bin/arm-none-eabi-gcc';
let CPP='../../gcc-arm-none-eabi/bin/arm-none-eabi-g++';
let LD='../../gcc-arm-none-eabi/bin/arm-none-eabi-gcc';
let ELF2BIN = '../../gcc-arm-none-eabi/bin/arm-none-eabi-objcopy';

let LIBRARIES = 'libmicropython.a';

let LINKER_SCRIPT = './PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/TOOLCHAIN_GCC_ARM/TARGET_LPC11U68/LPC11U68.ld';

let LD_FLAGS ='-Wl,--gc-sections -Wl,--wrap,main -Wl,--wrap,_memalign_r -Wl,-n --specs=nano.specs -mcpu=cortex-m0plus -mthumb';

let LD_SYS_LIBS ='-Wl,--start-group -lstdc++ -lsupc++ -lm -lc -lgcc -lnosys  -Wl,--end-group';


CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/TIC806x6.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/ZXSpec.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/adventurer12x16.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/donut7x10.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/dragon6x8.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/font3x3.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/font3x5.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/font5x7.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/fontC64.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/fontC64UIGfx.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/karateka8x11.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/koubit7x7.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/mini4x6.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/runes6x8.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/tight4x7.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/FONTS/tiny5x7.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palAction.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palCGA.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palDB16.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palDefault.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palGameboy.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palMagma.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palMono.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palPico.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palRainbow.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PALETTES/palZXSpec.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoBacklight.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoBattery.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoButtons.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoConsole.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoCore.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoDisk.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoDisplay.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoItoa.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoLogos.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoPalette.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_CORE/PokittoSound.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/HWButtons.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/HWLCD.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/HWSound.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/PokittoClock.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/PokittoHW.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/Pokitto_extport.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_HW/SoftwareI2C.cpp');
CSOURCES.push('PokittoLib/POKITTO_HW/clock_11u6x.c');
CSOURCES.push('PokittoLib/POKITTO_HW/dma_11u6x.c');
CXXSOURCES.push('PokittoLib/POKITTO_HW/iap.cpp');
CSOURCES.push('PokittoLib/POKITTO_HW/timer_11u6x.c');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_envfuncs.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_helpers.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_mixfuncs.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_oscfuncs.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_songfuncs.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_LIBS/Synth/Synth_wavefuncs.cpp');
CXXSOURCES.push('PokittoLib/POKITTO_XTERNALS/Arduino/delay.cpp');
CXXSOURCES.push('PokittoLib/libpff/mmc.cpp');
CXXSOURCES.push('PokittoLib/libpff/pff.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/BusIn.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/BusInOut.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/BusOut.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/CAN.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/CallChain.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Ethernet.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/FileBase.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/FileLike.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/FilePath.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/FileSystemLike.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/I2C.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/I2CSlave.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/InterruptIn.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/InterruptManager.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/LocalFileSystem.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/RawSerial.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/SPI.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/SPISlave.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Serial.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/SerialBase.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Stream.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Ticker.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Timeout.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/Timer.cpp');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/TimerEvent.cpp');
CSOURCES.push('PokittoLib/mbed-pokitto/common/assert.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/board.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/error.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/gpio.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/lp_ticker_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/mbed_interface.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/pinmap_common.c');
CXXSOURCES.push('PokittoLib/mbed-pokitto/common/retarget.cpp');
CSOURCES.push('PokittoLib/mbed-pokitto/common/rtc_time.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/semihost_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/ticker_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/us_ticker_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/common/wait_api.c');
CXXSOURCES.push('PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/TOOLCHAIN_GCC_ARM/TARGET_LPC11U68/startup_LPC11U68.cpp');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/cmsis_nvic.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/system_LPC11U6x.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/analogin_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/gpio_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/gpio_irq_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/i2c_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/pinmap.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/pwmout_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/rtc_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/serial_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/sleep.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/spi_api.c');
CSOURCES.push('PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X/us_ticker.c');
CXXSOURCES.push('main.cpp');
CXXSOURCES.push('PythonBindings.cpp');
CXXSOURCES.push('UartSerialPrint.cpp');
CSOURCES.push('frozen_mpy.c');


C_FLAGS.push(
    '-c',             
    '-Wall',             
    '-Wextra',             
    '-Wno-unused-parameter',             
    '-Wno-missing-field-initializers',             
    '-fmessage-length=0',             
    '-fno-exceptions',             
    '-fno-builtin',
    '-ffunction-sections',             
    '-fdata-sections',             
    '-funsigned-char',             
    '-MMD',             
    '-fno-delete-null-pointer-checks',             
    '-fomit-frame-pointer',             
    '-Os',             
    '-g1',             
    '-DMBED_RTOS_SINGLE_THREAD',
    '-mcpu=cortex-m0plus',
    '-mthumb'
);

CXX_FLAGS.push(
    '-std=gnu++98',
    '-fno-rtti',
    '-Wvla',
    '-c',
    '-Wall',
    '-Wextra',
    '-Wno-unused-parameter',
    '-Wno-missing-field-initializers',
    '-fmessage-length=0',
    '-fno-exceptions',
    '-fno-builtin',
    '-ffunction-sections',
    '-fdata-sections',
    '-funsigned-char',
    '-MMD',
    '-fno-delete-null-pointer-checks',
    '-fomit-frame-pointer',
    '-Os',
    '-g1',
    '-DMBED_RTOS_SINGLE_THREAD',
    '-mcpu=cortex-m0plus',
    '-mthumb'
);

C_FLAGS.push('-std=gnu99');
C_FLAGS.push('-DTARGET_LPC11U68');
C_FLAGS.push('-D__MBED__=1');
C_FLAGS.push('-DDEVICE_I2CSLAVE=1');
C_FLAGS.push('-DTARGET_LIKE_MBED');
C_FLAGS.push('-DTARGET_NXP');
C_FLAGS.push('-D__MBED_CMSIS_RTOS_CM');
C_FLAGS.push('-DDEVICE_RTC=1');
C_FLAGS.push('-DTOOLCHAIN_object');
C_FLAGS.push('-D__CMSIS_RTOS');
C_FLAGS.push('-DTOOLCHAIN_GCC');
C_FLAGS.push('-DTARGET_CORTEX_M');
C_FLAGS.push('-DTARGET_M0P');
C_FLAGS.push('-DTARGET_UVISOR_UNSUPPORTED');
C_FLAGS.push('-DMBED_BUILD_TIMESTAMP=1526086019.89');
C_FLAGS.push('-DDEVICE_SERIAL=1');
C_FLAGS.push('-DDEVICE_INTERRUPTIN=1');
C_FLAGS.push('-DTARGET_LPCTarget');
C_FLAGS.push('-DTARGET_CORTEX');
C_FLAGS.push('-DDEVICE_I2C=1');
C_FLAGS.push('-D__CORTEX_M0PLUS');
C_FLAGS.push('-DTARGET_FF_ARDUINO');
C_FLAGS.push('-DTARGET_RELEASE');
C_FLAGS.push('-DARM_MATH_CM0PLUS');
C_FLAGS.push('-DTARGET_LPC11U6X');
C_FLAGS.push('-DDEVICE_SLEEP=1');
C_FLAGS.push('-DTOOLCHAIN_GCC_ARM');
C_FLAGS.push('-DDEVICE_SPI=1');
C_FLAGS.push('-DDEVICE_ANALOGIN=1');
C_FLAGS.push('-DDEVICE_PWMOUT=1');
C_FLAGS.push('-DTARGET_LIKE_CORTEX_M0');


CXX_FLAGS.push('-std=gnu++98');
CXX_FLAGS.push('-fno-rtti');
CXX_FLAGS.push('-Wvla');
CXX_FLAGS.push('-DTARGET_LPC11U68');
CXX_FLAGS.push('-D__MBED__=1');
CXX_FLAGS.push('-DDEVICE_I2CSLAVE=1');
CXX_FLAGS.push('-DTARGET_LIKE_MBED');
CXX_FLAGS.push('-DTARGET_NXP');
CXX_FLAGS.push('-D__MBED_CMSIS_RTOS_CM');
CXX_FLAGS.push('-DDEVICE_RTC=1');
CXX_FLAGS.push('-DTOOLCHAIN_object');
CXX_FLAGS.push('-D__CMSIS_RTOS');
CXX_FLAGS.push('-DTOOLCHAIN_GCC');
CXX_FLAGS.push('-DTARGET_CORTEX_M');
CXX_FLAGS.push('-DTARGET_M0P');
CXX_FLAGS.push('-DTARGET_UVISOR_UNSUPPORTED');
CXX_FLAGS.push('-DMBED_BUILD_TIMESTAMP=1526086019.89');
CXX_FLAGS.push('-DDEVICE_SERIAL=1');
CXX_FLAGS.push('-DDEVICE_INTERRUPTIN=1');
CXX_FLAGS.push('-DTARGET_LPCTarget');
CXX_FLAGS.push('-DTARGET_CORTEX');
CXX_FLAGS.push('-DDEVICE_I2C=1');
CXX_FLAGS.push('-D__CORTEX_M0PLUS');
CXX_FLAGS.push('-DTARGET_FF_ARDUINO');
CXX_FLAGS.push('-DTARGET_RELEASE');
CXX_FLAGS.push('-DARM_MATH_CM0PLUS');
CXX_FLAGS.push('-DTARGET_LPC11U6X');
CXX_FLAGS.push('-DDEVICE_SLEEP=1');
CXX_FLAGS.push('-DTOOLCHAIN_GCC_ARM');
CXX_FLAGS.push('-DDEVICE_SPI=1');
CXX_FLAGS.push('-DDEVICE_ANALOGIN=1');
CXX_FLAGS.push('-DDEVICE_PWMOUT=1');
CXX_FLAGS.push('-DTARGET_LIKE_CORTEX_M0');

FLAGS.push('-I./.');
FLAGS.push('-I./PokittoLib');
FLAGS.push('-I./PokittoLib/POKITTO_CORE');
FLAGS.push('-I./PokittoLib/POKITTO_CORE/FONTS');
FLAGS.push('-I./PokittoLib/POKITTO_CORE/PALETTES');
FLAGS.push('-I./PokittoLib/POKITTO_HW');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS/ImageFormat');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS/Synth');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS/USBDevice');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS/USBDevice/USBDevice');
FLAGS.push('-I./PokittoLib/POKITTO_LIBS/USBDevice/USBSerial');
FLAGS.push('-I./PokittoLib/POKITTO_XTERNALS');
FLAGS.push('-I./PokittoLib/POKITTO_XTERNALS/Arduino');
FLAGS.push('-I./PokittoLib/libpff');
FLAGS.push('-I./PokittoLib/mbed-pokitto');
FLAGS.push('-I./PokittoLib/mbed-pokitto/api');
FLAGS.push('-I./PokittoLib/mbed-pokitto/common');
FLAGS.push('-I./PokittoLib/mbed-pokitto/hal');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/TOOLCHAIN_GCC_ARM');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis/TARGET_NXP/TARGET_LPC11U6X/TOOLCHAIN_GCC_ARM/TARGET_LPC11U68');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/cmsis/TOOLCHAIN_GCC');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/hal');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP');
FLAGS.push('-I./PokittoLib/mbed-pokitto/targets/hal/TARGET_NXP/TARGET_LPC11U6X');

/*
BUILD/%.o : %.c
	+@$(call MAKEDIR,$(dir $@))
	+@echo "Compile: $(notdir $<)"
	@$(CC) $(C_FLAGS) $(INCLUDE_PATHS) -o $@ $<
*/

CSOURCES.forEach( src => {
    let outFile = src.replace(/\.c$/i, '.o');
    if( fs.existsSync(outFile) )
        return;
        
    execSync([
        CC,
        C_FLAGS.join(" "),
        FLAGS.join(" "),
        "-o", outFile,
        src
    ].join(" "));
});

/*
BUILD/%.o : %.cpp
	+@$(call MAKEDIR,$(dir $@))
	+@echo "Compile: $(notdir $<)"
	@$(CPP) $(CXX_FLAGS) $(INCLUDE_PATHS) -o $@ $<
*/
CXXSOURCES.forEach( src => {
    let outFile = src.replace(/\.[^.]+$/i, '.o');
    if( src.indexOf("PokittoLib/") != -1 && fs.existsSync(outFile) )
        return;

    execSync([
        CPP,
        CXX_FLAGS.join(" "),
        FLAGS.join(" "),
        "-o", outFile,
        src
    ].join(" "));
});

/*
$(BPROJECT).elf: $(OBJECTS) $(SYS_OBJECTS) $(BPROJECT).link_script.ld 	@$(LD) $(LD_FLAGS) -T $(filter-out %.o, $^) $(LIBRARY_PATHS) --output $@ $(filter %.o, $^) $(LD_SYS_LIBS) $(LIBRARIES)
*/
execSync([
    LD,
    LD_FLAGS,
    '-T', LINKER_SCRIPT,
    '--output build.elf',
    CSOURCES.map(s => s.replace(/\.c$/i, '.o')).join(" "),
    CXXSOURCES.map(s => s.replace(/\.[^.]+$/i, '.o')).join(" "),
    LD_SYS_LIBS,
    LIBRARIES
].join(" "));

/*
$(BPROJECT).bin: $(BPROJECT).elf
	$(ELF2BIN) -O binary $< $@
	+@echo "===== bin file ready to flash: $(OBJDIR)/$@ =====" 
*/
execSync([
    ELF2BIN,
    "-O binary",
    "build.elf",
    "build.bin"
].join(" "));

/*
$(BPROJECT).hex: $(BPROJECT).elf
	$(ELF2BIN) -O ihex $< $@


# Rules
###############################################################################
# Dependencies

DEPS = $(OBJECTS:.o=.d) $(SYS_OBJECTS:.o=.d)
-include $(DEPS)
# endif

# Dependencies
###############################################################################

clean :
	$(call RM,$(OBJDIR))
*/

