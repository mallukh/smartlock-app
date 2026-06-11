#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>
#include <ld2410.h>

// Wi-Fi Credentials
char ssid[] = "SST-1";
char pass[] = "Asdf@1234";

// Next.js Server Endpoint
const char* SERVER_URL = "https://smartlock-app.vercel.app/api/hardware/room-status";
String roomNumber = "102"; // Match database room number

// Hardware Pins
#define PIR_INPUT_PIN 13    // SR602 PIR Sensor OUT Pin
#define RADAR_RX_PIN 16     // LD2410B TX -> ESP32 RX2 (GPIO 16)
#define RADAR_TX_PIN 17     // LD2410B RX -> ESP32 TX2 (GPIO 17)

// Radar Object
ld2410 radar;

// State Machine Definitions
enum RoomState { ROOM_VACANT, ROOM_OCCUPIED };
RoomState currentSystemState = ROOM_VACANT;

// Timer and State Tracking
unsigned long lastSeenActiveTime = 0;
const unsigned long VACATE_TIMEOUT_MS = 15000; // 15 seconds for testing (e.g. 180000 / 3 mins in production)

unsigned long lastSendMillis = 0;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000; // Send heartbeat update every 10 seconds

// Saved states to detect changes for instant reporting
bool lastIsOccupied = false;
bool lastPirTriggered = false;
bool lastRadarPresence = false;
float lastMovingDistance = 0.0;
float lastStationaryDistance = 0.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("   LODGE ROOM MONITORING SYSTEM INITIALIZED  ");
  Serial.println("=============================================");

  // PIR Pin Setup
  pinMode(PIR_INPUT_PIN, INPUT);
  Serial.println("[INIT] SR602 PIR Sensor configured on GPIO 13.");

  // Radar Serial Connection (LD2410B operates strictly at 256000 baud)
  Serial2.begin(256000, SERIAL_8N1, RADAR_RX_PIN, RADAR_TX_PIN);

  Serial.print("[INIT] Connecting to LD2410B Radar... ");
  if (radar.begin(Serial2)) {
    Serial.println("SUCCESS!");
    
    // Set max range gates for moving & stationary targets to 3 (3.0 meters) and inactivity timer to 15 seconds
    Serial.print("[CONFIG] Setting max range to 3.0m (Gate 3)... ");
    if (radar.setMaxValues(3, 3, 15)) {
      Serial.println("SUCCESS!");
    } else {
      Serial.println("FAILED!");
    }
  } else {
    Serial.println("FAILED!");
    Serial.println("[ERROR] System halted. Check connections.");
    while (1);
  }

  // Connect to Wi-Fi
  Serial.print("\n[WIFI] Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WIFI] Connected successfully!");
  Serial.print("[WIFI] IP Address: ");
  Serial.println(WiFi.localIP());

  Serial.println("\n[STATUS] System running. Monitoring active.");
  Serial.println("---------------------------------------------");
  
  // Send initial state to server
  sendStateToServer();
}

void loop() {
  // Read incoming radar packets
  radar.read();

  // Read PIR sensor state
  bool pirTriggered = (digitalRead(PIR_INPUT_PIN) == HIGH);
  bool radarPresence = false;
  float movingDist = 0.0;
  float stationaryDist = 0.0;

  if (radar.isConnected()) {
    radarPresence = radar.presenceDetected();
    if (radarPresence) {
      if (radar.movingTargetDetected()) {
        movingDist = radar.movingTargetDistance(); // measure in cm
      }
      if (radar.stationaryTargetDetected()) {
        stationaryDist = radar.stationaryTargetDistance(); // measure in cm
      }
    }
  }

  // --- STATE 1: ROOM IS VACANT ---
  if (currentSystemState == ROOM_VACANT) {
    if (pirTriggered) {
      Serial.println("\n[!] PIR SENSOR TRIGGERED: Entry movement detected!");
      Serial.println("[->] Switching System State to: OCCUPIED");
      currentSystemState = ROOM_OCCUPIED;
      lastSeenActiveTime = millis();
    }
  }

  // --- STATE 2: ROOM IS OCCUPIED ---
  else if (currentSystemState == ROOM_OCCUPIED) {
    bool humanPresent = radarPresence || pirTriggered;

    if (humanPresent) {
      lastSeenActiveTime = millis(); // Reset vacation countdown timer
      
      // Print real-time sensor details to Serial Monitor
      Serial.print("[TRACKING] Presence Detected | ");
      if (pirTriggered) {
        Serial.print("PIR: Active | ");
      }
      if (radarPresence) {
        Serial.print("Radar: Active (");
        if (movingDist > 0) {
          Serial.print("Moving: ");
          Serial.print(movingDist);
          Serial.print(" cm ");
        }
        if (stationaryDist > 0) {
          Serial.print("Stationary: ");
          Serial.print(stationaryDist);
          Serial.print(" cm");
        }
        Serial.print(") | ");
      }
      Serial.println();
    } else {
      // Countdown vacation timer
      unsigned long timeElapsedWithoutTarget = millis() - lastSeenActiveTime;
      
      if (timeElapsedWithoutTarget >= VACATE_TIMEOUT_MS) {
        Serial.println("\n[!] TIMEOUT EXPIRED: No presence detected by Radar or PIR.");
        Serial.println("[->] Switching System State to: VACANT");
        currentSystemState = ROOM_VACANT;
      } else {
        unsigned long remainingSeconds = (VACATE_TIMEOUT_MS - timeElapsedWithoutTarget) / 1000;
        Serial.print("[COUNTDOWN] Standby mode. Resetting room state in: ");
        Serial.print(remainingSeconds);
        Serial.println(" seconds...");
      }
    }
  }

  // Determine if a state change warrants an immediate update
  bool isOccupied = (currentSystemState == ROOM_OCCUPIED);
  bool stateChanged = (isOccupied != lastIsOccupied) ||
                      (pirTriggered != lastPirTriggered) ||
                      (radarPresence != lastRadarPresence) ||
                      (abs(movingDist - lastMovingDistance) > 15.0) ||
                      (abs(stationaryDist - lastStationaryDistance) > 15.0);

  // Send update if state changed OR heartbeat interval elapsed
  if (stateChanged || (millis() - lastSendMillis >= HEARTBEAT_INTERVAL_MS)) {
    // Save current values
    lastIsOccupied = isOccupied;
    lastPirTriggered = pirTriggered;
    lastRadarPresence = radarPresence;
    lastMovingDistance = movingDist;
    lastStationaryDistance = stationaryDist;

    sendStateToServer();
    lastSendMillis = millis();
  }

  // Loop delay for readability
  delay(400);
}

void sendStateToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Bypass SSL certificate verification for local/custom domains
    HTTPClient http;
    http.setTimeout(8000); // 8 seconds timeout

    StaticJsonDocument<256> doc;
    doc["roomNumber"] = roomNumber;
    doc["isOccupied"] = lastIsOccupied;
    doc["pirTriggered"] = lastPirTriggered;
    doc["radarPresence"] = lastRadarPresence;
    doc["movingDistance"] = round(lastMovingDistance * 10.0) / 10.0; // send in cm (1 decimal precision)
    doc["stationaryDistance"] = round(lastStationaryDistance * 10.0) / 10.0; // send in cm (1 decimal precision)

    String payload;
    serializeJson(doc, payload);

    Serial.println("\n📡 Sending Room State: " + payload);

    int retries = 3;
    while (retries > 0) {
      http.begin(client, SERVER_URL);
      http.addHeader("Content-Type", "application/json");
      int statusCode = http.POST(payload);

      if (statusCode > 0) {
        Serial.println("📥 Response (" + String(statusCode) + "): " + http.getString() + "\n");
        http.end();
        break; // Success
      } else {
        Serial.println("❌ HTTP error: " + http.errorToString(statusCode) + " — Retrying...");
        http.end();
        retries--;
        if (retries > 0) delay(1000);
      }
    }
  } else {
    Serial.println("⚠️ Wi-Fi disconnected. Cannot send update.");
  }
}
