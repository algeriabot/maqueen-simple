//% weight=115 color=#8c24e0 icon="\uf085" block="Robot"
//% groups="['Movimiento', 'Luces', 'Sensores']"
namespace maqueenSimple {

    // weight=115 color=#8c24e0 icon="\uf085" block="Robot"

    //Motor selection enumeration
    export enum Motor {
        //% block="left motor"
        LeftMotor,
        //% block="right motor"
        RightMotor,
        //% block="both motors"
        AllMotor,
    };

    //Motor direction enumeration selection
    export enum Dir {
        //% block="forwards"
        Forward,
        //% block="backwards"
        Backward,
    };

    //LED light selection enumeration
    export enum MyEnumLed {
        //% block="left LED light"
        LeftLed,
        //% block="right LED light"
        RightLed,
        //% block="all LED light"
        AllLed,
    };

    //LED light switch enumeration selection
    export enum MyEnumSwitch {
        //% block="off"
        Close,
        //% block="on"
        Open,
    };

    //Line sensor selection
    export enum MyEnumLineSensor {
        //% block="L1"
        SensorL1,
        //% block="M"
        SensorM,
        //% block="R1"
        SensorR1,
        //% block="L2"
        SensorL2,
        //% block="R2"
        SensorR2,
    };
    /**
     * Well known colors for a NeoPixel strip
     */
    export enum NeoPixelColors {
        //% block=red
        Red = 0xFF0000,
        //% block=orange
        Orange = 0xFF6C00,
        //% block=yellow
        Yellow = 0xFFFF00,
        //% block=green
        Green = 0x00FF00,
        //% block=blue
        Blue = 0x0000FF,
        //% block=indigo
        Indigo = 0x4b0082,
        //% block=violet
        Violet = 0x8a2be2,
        //% block=purple
        Purple = 0xFF00FF,
        //% block=white
        White = 0xFFFFFF,
        //% block=black
        Black = 0x000000
    }

    export enum LeftRight {
        //% block="↺ left"
        Left,
        //% block="↻ right"
        Right
    }

    export enum NeoPixelEnum {
        //% block="all"
        All,
        //% block="front left"
        FrontLeft,
        //% block="front right"
        FrontRight,
        //% block="back left"
        BackLeft,
        //% block="back right"
        BackRight
    }

    const I2CADDR = 0x10;
    const ADC0_REGISTER = 0X1E;
    const ADC1_REGISTER = 0X20;
    const ADC2_REGISTER = 0X22;
    const ADC3_REGISTER = 0X24;
    const ADC4_REGISTER = 0X26;
    const LEFT_LED_REGISTER = 0X0B;
    const RIGHT_LED_REGISTER = 0X0C;
    const LEFT_MOTOR_REGISTER = 0X00;
    const RIGHT_MOTOR_REGISTER = 0X02;
    const LINE_STATE_REGISTER = 0X1D;
    const VERSION_CNT_REGISTER = 0X32;
    const VERSION_DATA_REGISTER = 0X33;

    let irstate: number;
    let neopixel_buf = pins.createBuffer(16 * 3);
    for (let i = 0; i < 16 * 3; i++) {
        neopixel_buf[i] = 0
    }
    let _brightness = 255
    let state: number;

    /**
     *  Init I2C until success
     */

    export function I2CInit(): void {
        let Version_v = 0;
        pins.i2cWriteNumber(I2CADDR, 0x32, NumberFormat.Int8LE);
        Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        while (Version_v == 0) {
            basic.showLeds(`
                # . . . #
                . # . # .
                . . # . .
                . # . # .
                # . . . #
                `, 10)
            basic.pause(500)
            basic.clearScreen()
            pins.i2cWriteNumber(0x10, 0x32, NumberFormat.Int8LE);
            Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        }
        basic.showLeds(`
                . . . . .
                . . . . #
                . . . # .
                # . # . .
                . # . . .
                `, 10)
        basic.pause(500)
        basic.clearScreen()
    }

    /**
     * Move forward for a certain amount of time.
     * @param edir Direction to move in
     * @param time How long to move forward for
     */

    //% block="move %edir for %time ms"
    //% time.min=0
    //% weight=100
    //% group="Movimiento"
    export function moveForward(edir: Dir, time: number): void {
        controlMotor(Motor.AllMotor, edir, 100);
        basic.pause(time);
        controlMotorStop(Motor.AllMotor);
    }


    /**
     * Turn in a direction for a certain amount of time.
     * @param dir Direction to move in
     * @param time How long to turn for
     */
    //% block="turn %dir for %time seconds"
    //% time.min=0.00 time.max=10.00
    //% weight=99
    //% group="Movimiento"
    export function turn(dir: LeftRight, time: number): void {
        if (dir == LeftRight.Left) {
            controlMotor(Motor.LeftMotor, Dir.Backward, 80);
            controlMotor(Motor.RightMotor, Dir.Forward, 80);
        } else if (dir == LeftRight.Right) {
            controlMotor(Motor.RightMotor, Dir.Backward, 80);
            controlMotor(Motor.LeftMotor, Dir.Forward, 80);
        }
        basic.pause(time);
        controlMotorStop(Motor.AllMotor);
    }

    // /**
    //  * Stop all motors.
    //  */
    // //% block="stop"
    // export function stop(): void {
    //     let allBuffer2 = pins.createBuffer(5);
    //     allBuffer2[0] = LEFT_MOTOR_REGISTER;
    //     allBuffer2[1] = 0;
    //     allBuffer2[2] = 0;
    //     allBuffer2[3] = 0;
    //     allBuffer2[4] = 0;
    //     pins.i2cWriteBuffer(I2CADDR, allBuffer2);
    // }

    /**
     * Set motor to a speed
     * @param emotor Motor selection 
     * @param edir   Motor direction
     * @param speed  Motor speed control (0-255)
     */

    //% block="set %emotor moving %edir speed %speed"
    //% speed.min=0 speed.max=255
    //% weight=98
    //% group="Movimiento"
    export function controlMotor(emotor: Motor, edir: Dir, speed: number): void {
        switch (emotor) {
            case Motor.LeftMotor:
                let leftBuffer = pins.createBuffer(3);
                leftBuffer[0] = LEFT_MOTOR_REGISTER;
                leftBuffer[1] = edir;
                leftBuffer[2] = speed;
                pins.i2cWriteBuffer(I2CADDR, leftBuffer);
                break;
            case Motor.RightMotor:
                let rightBuffer = pins.createBuffer(3);
                rightBuffer[0] = RIGHT_MOTOR_REGISTER;
                rightBuffer[1] = edir;
                rightBuffer[2] = speed;
                pins.i2cWriteBuffer(I2CADDR, rightBuffer);
                break;
            default:
                let allBuffer = pins.createBuffer(5);
                allBuffer[0] = LEFT_MOTOR_REGISTER;
                allBuffer[1] = edir;
                allBuffer[2] = speed;
                allBuffer[3] = edir;
                allBuffer[4] = speed;
                pins.i2cWriteBuffer(I2CADDR, allBuffer)
                break;
        }
    }

    /**
     * Set motor to a speed
     * @param emotor Motor selection
     * @param speed  Motor speed control (-255 to 255)
     

    //% block="set %emotor speed %speed"
    //% speed.min=-255 speed.max=255
    //% weight=97
    export function controlMotor2(emotor: Motor, speed: number): void {
        if (speed < 0) {
            controlMotor(emotor, Dir.Backward, Math.abs(speed));
        } else {
            controlMotor(emotor, Dir.Forward, speed);
        }
    }
    */

    /**
     * Control the motor module to stop running
     * @param emotor Motor selection enumeration
     */

    //% block="stop %emotor"
    //% weight=96
    //% group="Movimiento"
    export function controlMotorStop(emotor: Motor): void {
        switch (emotor) {
            case Motor.LeftMotor:
                let leftBuffer2 = pins.createBuffer(3);
                leftBuffer2[0] = LEFT_MOTOR_REGISTER;
                leftBuffer2[1] = 0;
                leftBuffer2[2] = 0;
                pins.i2cWriteBuffer(I2CADDR, leftBuffer2);
                break;
            case Motor.RightMotor:
                let rightBuffer2 = pins.createBuffer(3);
                rightBuffer2[0] = RIGHT_MOTOR_REGISTER;
                rightBuffer2[1] = 0;
                rightBuffer2[2] = 0;
                pins.i2cWriteBuffer(I2CADDR, rightBuffer2);
                break;
            default:
                let allBuffer22 = pins.createBuffer(5);
                allBuffer22[0] = LEFT_MOTOR_REGISTER;
                allBuffer22[1] = 0;
                allBuffer22[2] = 0;
                allBuffer22[3] = 0;
                allBuffer22[4] = 0;
                pins.i2cWriteBuffer(I2CADDR, allBuffer22)
                break;
        }
    }

    /**
     * Control left and right LED light switch module
     * @param eled LED lamp selection
     * @param eSwitch Control LED light on or off
     */

    //% block="turn %eled %eSwitch"
    //% weight=95
    //% group="Luces"
    export function controlLED(eled: MyEnumLed, eSwitch: MyEnumSwitch): void {
        switch (eled) {
            case MyEnumLed.LeftLed:
                let leftLedControlBuffer = pins.createBuffer(2);
                leftLedControlBuffer[0] = LEFT_LED_REGISTER;
                leftLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, leftLedControlBuffer);
                break;
            case MyEnumLed.RightLed:
                let rightLedControlBuffer = pins.createBuffer(2);
                rightLedControlBuffer[0] = RIGHT_LED_REGISTER;
                rightLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, rightLedControlBuffer);
                break;
            default:
                let allLedControlBuffer = pins.createBuffer(3);
                allLedControlBuffer[0] = LEFT_LED_REGISTER;
                allLedControlBuffer[1] = eSwitch;
                allLedControlBuffer[2] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, allLedControlBuffer);
                break;
        }
    }


    /** 
    * Set the three primary color:red, green, and blue
    * @param r  , eg: 100
    * @param g  , eg: 100
    * @param b  , eg: 100
    

    //*
    //% weight=60
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% block="red|%r green|%g blue|%b"
    export function rgb(r: number, g: number, b: number): number {
        return (r << 16) + (g << 8) + (b);
    }
    */

    // /**
    //  * The LED positions where you wish to begin and end
    //  * @param from  , eg: 1
    //  * @param to  , eg: 4
    //  */

    // //% weight=60
    // //% from.min=0 from.max=3
    // //% to.min=1 to.max=4
    // //% block="range from |%from with|%to leds"
    // export function ledRange(from: number, to: number): number {
    //     return ((from) << 16) + (2 << 8) + (to);
    // }

    /**
     * Set the color of the specified LEDs
     * @param index  , eg: 1
     */

    //% weight=94
    //% index.min=0 index.max=3
    //% block="show color |%rgb on |%light RGB light"
    //% group="Luces"
    export function setIndexColor(rgb: NeoPixelColors, light: NeoPixelEnum) {
        let index = 0;
        if (light == NeoPixelEnum.All) {
            showColor(rgb);
            return;
        } else {
            switch (light) {
                case NeoPixelEnum.FrontLeft: index = 0; break;
                case NeoPixelEnum.BackLeft: index = 1; break;
                case NeoPixelEnum.BackRight: index = 2; break;
                case NeoPixelEnum.FrontRight: index = 3; break;
            }
        }

        let f = index;
        let t = index;
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);

        if (index > 15) {
            if (((index >> 8) & 0xFF) == 0x02) {
                f = index >> 16;
                t = index & 0xff;
            } else {
                f = 0;
                t = -1;
            }
        }
        for (let j = f; j <= t; j++) {
            neopixel_buf[j * 3 + 0] = Math.round(g)
            neopixel_buf[j * 3 + 1] = Math.round(r)
            neopixel_buf[j * 3 + 2] = Math.round(b)
        }
        ws2812b.sendBuffer(neopixel_buf, DigitalPin.P15)

    }

    /**
     * Set the color of all RGB LEDs
     */

    export function showColor(rgb: NeoPixelColors) {
        let s = (rgb >> 16) * (_brightness / 255);
        let h = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let c = ((rgb) & 0xFF) * (_brightness / 255);
        for (let k = 0; k < 16 * 3; k++) {
            if ((k % 3) == 0)
                neopixel_buf[k] = Math.round(h)
            if ((k % 3) == 1)
                neopixel_buf[k] = Math.round(s)
            if ((k % 3) == 2)
                neopixel_buf[k] = Math.round(c)
        }
        ws2812b.sendBuffer(neopixel_buf, DigitalPin.P15)
    }

    /**
     * Set the brightness of RGB LED
     * @param brightness  , eg: 100
     */

    //% weight=93
    //% brightness.min=0 brightness.max=255
    //% block="set RGB brightness to |%brightness"
    //% group="Luces"
    export function setBrightness(brightness: number) {
        _brightness = brightness;
    }

    /**
     * Turn off all RGB LEDs
     */

    //% weight=92
    //% block="clear all RGB"
    //% group="Luces"
    export function ledBlank() {
        showColor(0)
    }

    /**
  * Acquiring ultrasonic data better
  */

    //% block="read ultrasonic distance (cm)"
    //% weight=91
    //% group="Sensores"
    export function readDistance(): number {
        let trig = DigitalPin.P13;
        let echo = DigitalPin.P14;
        let data3;
        pins.digitalWritePin(trig, 1);
        basic.pause(1);
        pins.digitalWritePin(trig, 0)
        if (pins.digitalReadPin(echo) == 0) {
            pins.digitalWritePin(trig, 0);
            pins.digitalWritePin(trig, 1);
            basic.pause(20);
            pins.digitalWritePin(trig, 0);
            data3 = pins.pulseIn(echo, PulseValue.High, 500 * 58);
        } else {
            pins.digitalWritePin(trig, 1);
            pins.digitalWritePin(trig, 0);
            basic.pause(20);
            pins.digitalWritePin(trig, 0);
            data3 = pins.pulseIn(echo, PulseValue.High, 500 * 58)
        }
        data3 = data3 / 59;
        if (data3 <= 0)
            return 0;
        if (data3 > 500)
            return 500;
        return Math.round(data3);
    }

    /**
    * Get the state of the patrol sensor
    * @param eline Select the inspection sensor enumeration
    */

    //% block="read line sensor %eline state"
    //% weight=90
    //% group="Sensores"
    export function readLineSensorState(eline: MyEnumLineSensor): number {
        pins.i2cWriteNumber(I2CADDR, LINE_STATE_REGISTER, NumberFormat.Int8LE);
        let data = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE)
        let state2;
        switch (eline) {
            case MyEnumLineSensor.SensorL1:
                state2 = (data & 0x08) == 0x08 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorM:
                state2 = (data & 0x04) == 0x04 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorR1:
                state2 = (data & 0x02) == 0x02 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorL2:
                state2 = (data & 0x10) == 0X10 ? 1 : 0;
                break;
            default:
                state2 = (data & 0x01) == 0x01 ? 1 : 0;
                break;
        }
        return state2;
    }

    // /**
    //  * RGB LEDs display rainbow colors 
    //  */

    // //% weight=50
    // //% startHue.defl=1
    // //% endHue.defl=360
    // //% startHue.min=0 startHue.max=360
    // //% endHue.min=0 endHue.max=360
    // export function ledRainbow(startHue: number, endHue: number) {
    //     startHue = startHue >> 0;
    //     endHue = endHue >> 0;
    //     const saturation = 100;
    //     const luminance = 50;
    //     let steps = 3 + 1;
    //     const direction = HueInterpolationDirection.Clockwise;

    //     //hue
    //     const h1 = startHue;
    //     const h2 = endHue;
    //     const hDistCW = ((h2 + 360) - h1) % 360;
    //     const hStepCW = Math.idiv((hDistCW * 100), steps);
    //     const hDistCCW = ((h1 + 360) - h2) % 360;
    //     const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
    //     let hStep: number;
    //     if (direction === HueInterpolationDirection.Clockwise) {
    //         hStep = hStepCW;
    //     } else if (direction === HueInterpolationDirection.CounterClockwise) {
    //         hStep = hStepCCW;
    //     } else {
    //         hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
    //     }
    //     const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

    //     //sat
    //     const s1 = saturation;
    //     const s2 = saturation;
    //     const sDist = s2 - s1;
    //     const sStep = Math.idiv(sDist, steps);
    //     const s1_100 = s1 * 100;

    //     //lum
    //     const l1 = luminance;
    //     const l2 = luminance;
    //     const lDist = l2 - l1;
    //     const lStep = Math.idiv(lDist, steps);
    //     const l1_100 = l1 * 100

    //     //interpolate
    //     if (steps === 1) {
    //         writeBuff(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
    //     } else {
    //         writeBuff(0, hsl(startHue, saturation, luminance));
    //         for (let l = 1; l < steps - 1; l++) {
    //             const m = Math.idiv((h1_100 + l * hStep), 100) + 360;
    //             const u = Math.idiv((s1_100 + l * sStep), 100);
    //             const n = Math.idiv((l1_100 + l * lStep), 100);
    //             writeBuff(0 + l, hsl(m, u, n));
    //         }
    //         writeBuff(3, hsl(endHue, saturation, luminance));
    //     }
    //     ws2812b.sendBuffer(neopixel_buf, DigitalPin.P15)
    // }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }

    function writeBuff(index: number, rgb: number) {
        let v = (rgb >> 16) * (_brightness / 255);
        let o = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let d = ((rgb) & 0xFF) * (_brightness / 255);
        neopixel_buf[index * 3 + 0] = Math.round(o)
        neopixel_buf[index * 3 + 1] = Math.round(v)
        neopixel_buf[index * 3 + 2] = Math.round(d)
    }

    function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let e = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h12 = Math.idiv(h, 60);//[0,6]
        let h22 = Math.idiv((h - h12 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h12 % 2) << 8) + h22) - 256);
        let x = (e * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h12 == 0) {
            r$ = e; g$ = x; b$ = 0;
        } else if (h12 == 1) {
            r$ = x; g$ = e; b$ = 0;
        } else if (h12 == 2) {
            r$ = 0; g$ = e; b$ = x;
        } else if (h12 == 3) {
            r$ = 0; g$ = x; b$ = e;
        } else if (h12 == 4) {
            r$ = x; g$ = 0; b$ = e;
        } else if (h12 == 5) {
            r$ = e; g$ = 0; b$ = x;
        }
        let p = Math.idiv((Math.idiv((l * 2 << 8), 100) - e), 2);
        let w = r$ + p;
        let q = g$ + p;
        let a = b$ + p;

        return (w << 16) + (q << 8) + a;
    }
}
