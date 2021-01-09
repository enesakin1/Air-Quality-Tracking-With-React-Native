#define BLYNK_PRINT Serial
#include <ESP8266WiFi.h>
#include <FirebaseArduino.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include "ThingSpeak.h"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

String serverAdress = "THINGHTTP FOR PUSH NOTIFICATION";
String host = "api.thingspeak.com";
const int httpPort = 80; 

#define inputPin A0
#define ledPin D7
#define buzzerPin D8
#define FIREBASE_HOST ""
#define FIREBASE_AUTH ""
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define writeAPIKey "THINGSPEAK API KEY"

unsigned long channelID = THINGSPEAK CHANNEL ID;
unsigned int field_no = THINGSPEAK FIELD NO;
int sira = 1;
int hassasiyet = 0;
bool kacak = false;
bool ledOnce = true;
int bestValue = 0;
int worstValue = 0;
bool readable = false;
bool notificationSent = false;

WiFiClient client;

void setup()
{
    Serial.begin(9600);

    pinMode(inputPin, INPUT);
    pinMode(ledPin, OUTPUT);
    pinMode(buzzerPin, OUTPUT);
    digitalWrite(ledPin, LOW);
    digitalWrite(buzzerPin, LOW);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.println("Connecting");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(500);
    }
    Serial.println("");
    Serial.print("connected ");
    Serial.println(WiFi.localIP());
    timeClient.begin();
    timeClient.setTimeOffset(10800);
    Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
    bestValue = Firebase.getInt("/bestvalue/value");
    worstValue = Firebase.getInt("/worstvalue/value");
    Firebase.setInt("control", 0);
    Firebase.setInt("gasleak", 0);
    ThingSpeak.begin(client);
    delay(5000);
}
void loop()
{
    float sensorValue = analogRead(inputPin);
    int gecirgenlik = 100 - round(((float)sensorValue / 1023) * 100);
    while (sensorValue > 800)
    {
        sensorValue = analogRead(inputPin);
        hassasiyet = Firebase.getInt("sensivity");
        if (sensorValue > hassasiyet)
        {
            kacak = true;
            Firebase.setInt("gasleak", 1);

            if(!notificationSent)
            {
              notificationSent = true;
              client.connect(host, httpPort);
              client.print(String("GET ") + serverAdress + " HTTP/1.1\r\n" + "Host: " + host + "\r\n" + "Connection: close\r\n\r\n");
              client.stop();
            }

            if (Firebase.getInt("led") == 1)
            {
                digitalWrite(ledPin, HIGH);
            }

            if (Firebase.getInt("buzzer") == 1)
            {
                digitalWrite(buzzerPin, HIGH);
            }
            delay(5000);
        }
    }
    if (!kacak)
    {
        timeClient.update();

        if (gecirgenlik > bestValue)
        {
            Firebase.setInt("bestvalue/value", gecirgenlik);
            bestValue = gecirgenlik;
            unsigned long epochTime = timeClient.getEpochTime();
            struct tm *ptm = gmtime((time_t *)&epochTime);
            int monthDay = ptm->tm_mday;
            int currentMonth = ptm->tm_mon + 1;
            int currentYear = ptm->tm_year + 1900;
            String currentDate = String(monthDay) + "/" + String(currentMonth) + "/" + String(currentYear);
            Firebase.setString("bestvalue/date", currentDate);
        }
        if (gecirgenlik < worstValue)
        {
            Firebase.setInt("worstvalue/value", gecirgenlik);
            worstValue = gecirgenlik;
            unsigned long epochTime = timeClient.getEpochTime();
            struct tm *ptm = gmtime((time_t *)&epochTime);
            int monthDay = ptm->tm_mday;
            int currentMonth = ptm->tm_mon + 1;
            int currentYear = ptm->tm_year + 1900;
            String currentDate = String(monthDay) + "/" + String(currentMonth) + "/" + String(currentYear);
            Firebase.setString("worstvalue/date", currentDate);
        }

        if (!readable)
        {
            Firebase.setInt("olculendeger/" + String(sira), gecirgenlik);

            String formattedTime = timeClient.getFormattedTime();
            Firebase.setString("hours/" + String(sira), formattedTime);
            if (sira == 5)
            {
                sira = 1;
                readable = true;
                Firebase.setInt("control", 1);
            }
            else
            {
                sira++;
            }
        }
        else
        {
          for(int i = 2; i < 6; i++)
          {
            Firebase.setInt("olculendeger/" + String((i - 1)), Firebase.getInt("olculendeger/" + String(i)));
          }
          for(int i = 2; i < 6; i++)
          {
            Firebase.setString("hours/" + String((i - 1)), Firebase.getString("hours/" + String(i)));
          }
          String formattedTime = timeClient.getFormattedTime();
          Firebase.setString("hours/5", formattedTime);
          Firebase.setInt("olculendeger/5", gecirgenlik);
          Firebase.setString("hours/5", formattedTime);
        }

        ThingSpeak.writeField(channelID, field_no, gecirgenlik, writeAPIKey);
        Serial.println(gecirgenlik);
        delay(2000);
    }

    else
    {
        Firebase.setInt("gasleak", 0);
        digitalWrite(buzzerPin, LOW);
        digitalWrite(ledPin, LOW);
        kacak = false;
        ledOnce = true;
        notificationSent = false;
        delay(5000);
    }
}
