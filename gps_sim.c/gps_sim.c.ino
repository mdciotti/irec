/*
  Arduino GPS Scripted Simulator
  Released into the public domain
  James M. Eli
  3/12/2012
   
  Note: No checksum calculation for the NMEA sentences (checksum output is XX). 
      If you need to do this, it’s very simple as it’s just a Hex representation of the XOR of 
      all characters in the sentence between (not including) the $ and the * character.
      //XOR the received data
      checksum ^= gprmc[i];
  
  Sentence format:
    $GPRMC,184331.200,V,45.59462,N,122.692900,W,68.39,63.60,80212,,,A*xx
  Specific GPS data is extracted from dataflash:
                  2     45.594620  122.692900   068.39063.60
    245.594620122.692900068.39063.60 (32 chars)
*/
#include <stdint.h>
#include <EEPROM.h>

#define UPDATE_RATE_HZ 5

// EEPROM page size (bytes)
#define PAGE_SIZE 512
#define BYTES_PER_LINE 32
#define MAX_LINES 32

char sec[2];
char lat[10];
char lng[11];
char hdg[7], *phdg;
char spd[7], *pspd;

volatile uint8_t t4 = 10;
volatile uint8_t t3 = 30;
volatile uint8_t t2 = 0;
volatile uint8_t t1 = 0;

uint32_t lines = 0;
char gprmc[96];
char chk;

// Read data from EEPROM
void read_data_eeprom(void)
{
    uint8_t i = lines * BYTES_PER_LINE;
    
    // time
    EEPROM.get(i+0, sec);
    sec[1] = '\0';
    // latitude
    EEPROM.get(i+1, lat);
    lat[9] = '\0';
    // longitude
    EEPROM.get(i+11, lng);
    lng[10] = '\0';
    // heading
    EEPROM.get(i+21, hdg);
    hdg[6] = '\0';
    // speed
    EEPROM.get(i+27, spd);
    spd[6] = '\0';
    
    // lines of data read
    if (++lines >= MAX_LINES) {
        lines = 0;
    }
    
    // remove leading zeros
    pspd = spd;
    phdg = hdg;
    while (*pspd && *pspd == '0') 
        pspd++;
    while (*phdg && *phdg == '0') 
        phdg++;
}

// 10010110
// 10000101
// 00010010

void compute_checksum()
{
    chk = 0;
    char *c = gprmc;
    while (*c != '\0') {
        chk ^= *c;
        ++c;
    }
}

void transmit_data()
{
    //$GPRMC,184331.200,A,4856.3930,N,12247.4841,W,0.07,0.00,080112,,,A*71
    sprintf(gprmc,"GPRMC,%2.2u%2.2u%2.2u.%1s00,A,%9s,N,%10s,W,%s,%s,080112,,,S", t4, t3, t2, sec, lat, lng, pspd, phdg);
    compute_checksum();
    sprintf(gprmc,"$GPRMC,%2.2u%2.2u%2.2u.%1s00,A,%9s,N,%10s,W,%s,%s,080112,,,S*%02X", t4, t3, t2, sec, lat, lng, pspd, phdg, chk);
    Serial.println(gprmc);
}

void tick() {
    t1++;
    if (t1 > (UPDATE_RATE_HZ - 1)) {
        t1 = 0;
        t2++;
    } 
    if (t2 > 59) {
        t2 = 0;
        t3++;
    } 
    if (t3 > 59) {
        t3 = 0;
        t4++;
    }
    if (t4 > 23)
        t4 = 0;

    read_data_eeprom();
    transmit_data();
}

/**
 * This sets the data in the EEPROM.
 * Note: it should only be run once every time you make a change to the data.
 * The EEPROM is preserved even when power is removed.
 */
void set_fake_data()
{
    EEPROM.put(0, "045.593980122.690800292.10084.22\
245.593980122.690800292.15084.97\
445.594090122.691100291.01092.06\
645.594120122.691200291.11087.55\
845.594120122.691400290.66086.93\
045.594160122.691400290.80087.32\
245.594180122.691500290.87088.52\
445.594230122.691600290.80089.22\
645.594260122.691600290.97089.33\
845.594260122.691700291.00089.61\
045.594300122.691900291.17090.19\
245.594330122.692000291.05090.54\
445.594330122.692200291.30091.07\
645.594370122.692200291.31091.81\
845.594400122.692200291.34092.36\
045.594440122.692500291.39093.13\
245.594470122.692500291.36093.46\
445.594470122.692500291.32093.98\
645.594470122.692700291.63094.25\
845.594520122.692700291.55094.90\
045.594530122.692700291.62095.70\
245.594590122.692900291.37095.85\
445.594600122.693000291.60096.31\
645.594600122.693100291.37096.69\
845.594650122.693300291.34097.10\
045.594670122.693300291.40097.46\
245.594730122.693400291.35098.05\
445.594740122.693500291.25098.51\
645.594800122.693700291.10098.84\
845.594810122.693800291.23099.47\
045.594810122.693800291.32099.96\
245.594870122.693900291.38100.34");
}

//Timer timer(1000 / UPDATE_RATE_HZ, tick);

void setup()
{
//     set_fake_data();
     delay(1000);
    Serial.begin(9600);
//    timer.start();
//    tick();
}

void loop()
{
    tick();
    delay(1000 / UPDATE_RATE_HZ);
}

