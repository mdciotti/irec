/*============================ EG LABS ===================================

 Demonstration on how to use GPS and XBEE with an arduino board

 The circuit:
 LCD:
 * LCD RS pin to digital pin 12
 * LCD Enable pin to digital pin 11
 * LCD D4 pin to digital pin 7
 * LCD D5 pin to digital pin 6
 * LCD D6 pin to digital pin 5
 * LCD D7 pin to digital pin 4
 * LCD R/W pin to ground
 * 10K resistor:
 * ends to +5V and ground
 * wiper to LCD pin 3
 * LED anode attached to digital output 9
 * LED cathode attached to ground through a 1K resistor

 XBEE:
 RX PIN OF XBEE TO TX0 PIN OF ARDUINO
 TX PIN OF XBEE TO RX1 PIN OF ARDUINO
 SHORT THE GROUND PINS OF ARDUINO, XBEE AND GPS

============================== EG LABS ===================================*/

#include <LiquidCrystal.h>

// initialize the library with the numbers of the interface pins
LiquidCrystal lcd(12, 11, 7, 6, 5, 4);

// give the pin a name:
int led = 9;
// incoming serial byte
int inByte = 0;         

int longitude[15];
int latitude[15];

int i;

void setup()
{
  // set up the lcd's number of columns and rows: 
  lcd.begin(16, 2);
  lcd.print("ENGINEERS GARAGE");
  lcd.setCursor(0, 1);
  lcd.print("  GPS  +  XBEE ");

  // initialize the led pin as an output.
  pinMode(led, OUTPUT);  
}

void loop()
{ 
    Serial.begin(4800);
    delay(100);

    // Searching for "GG"
    do
    {
        do
        {
            while (!Serial.available());    
        } while ('G' != Serial.read());

        while (!Serial.available());
    } while ('G' != Serial.read());

    // Seeking latitude coordinate
    do
    {
        while (!Serial.available());    
    } while (',' != Serial.read());

    do
    {
        while (!Serial.available());    
    } while (',' != Serial.read());

    // Reading the latitude coordinate
    i = 0;
    do
    {
        while (!Serial.available()); 
        inByte = Serial.read();
        latitude[i] = inByte;
        i++;
    } while (',' != inByte);

    // Seeking longitude coordinate
    do
    {
        while (!Serial.available());    
    } while (',' != Serial.read());

    // Reading the longitude coordinate
    i = 0;
    do
    {
        while (!Serial.available()); 
        inByte = Serial.read();
        longitude[i] = inByte;
        i++;
    } while (',' != inByte);

    // Setup to write to XBee
    delay(500);
    digitalWrite(led, HIGH);       
    Serial.begin(9600);
    delay(100);

    // Send the initial data once
    Serial.print('\n');
    Serial.print("GEOGRAPHICAL COORDINATES");
    Serial.print("\n");

    Serial.print("N: ");
    for (i = 0; latitude[i] != '\0'; i++)
      Serial.write(latitude[i]);

    Serial.print("E: ");    
    for (i = 0; longitude[i] != '\0'; i++)
      Serial.write(longitude[i]);

    Serial.println();

    delay(500);
    digitalWrite(led, LOW);       
}
