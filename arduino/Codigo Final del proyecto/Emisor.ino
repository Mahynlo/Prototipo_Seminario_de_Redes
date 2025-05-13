#include <DHT.h>
#include <VirtualWire.h>
#include <stdint.h> // Para usar int16_t

#define DHTPIN 2
#define PHOTORES A0
#define DHTTYPE DHT11
#define SOIL A1
#define TX_PIN 9
#define BUZZER_PIN 8
#define LED_VERDE 6
#define LED_ROJO 7

const unsigned long INTERVALO_LECTURA = 5000;

DHT dht(DHTPIN, DHTTYPE);
unsigned long ultimaLectura = 0;

void setup() {
  Serial.begin(9600);
  dht.begin();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);

  Serial.println("Comenzando transmisión (binaria)");

  vw_setup(2000);
  vw_set_tx_pin(TX_PIN);
}

void notificarError(const char* mensaje, int tono) {
  Serial.println(mensaje);
  tone(BUZZER_PIN, tono);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, HIGH);
  delay(1000);
  noTone(BUZZER_PIN);
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimaLectura >= INTERVALO_LECTURA) {
    ultimaLectura = ahora;

    float humedad = dht.readHumidity();
    float temperatura = dht.readTemperature();
    float indiceCalor = dht.computeHeatIndex(temperatura, humedad, false);
    int16_t valorLuz = analogRead(PHOTORES);     // 0–1023
    int16_t humedadSuelo = analogRead(SOIL);     // 0–1023
    int16_t error = 0;

    if (isnan(humedad) || isnan(temperatura)) {
      notificarError("Error en la lectura del sensor DHT", 1000);
      error = 1;
    } else if (valorLuz < 5) {
      notificarError("Error en la lectura del fotoresistor", 1500);
      error = 2;
    } else if (humedadSuelo < 5 || humedadSuelo > 1030) {
      notificarError("Error en la lectura del sensor de humedad de suelo", 2000);
      error = 3;
    } else {
      digitalWrite(LED_VERDE, HIGH);
      digitalWrite(LED_ROJO, LOW);
    }

    // Preparar buffer binario de 18 bytes: 3 floats (12 bytes) + 3 int16_t (6 bytes)
    uint8_t buffer[18];
    int idx = 0;

    memcpy(&buffer[idx], &humedad, sizeof(float));        idx += sizeof(float);
    memcpy(&buffer[idx], &temperatura, sizeof(float));    idx += sizeof(float);
    memcpy(&buffer[idx], &indiceCalor, sizeof(float));    idx += sizeof(float);
    memcpy(&buffer[idx], &valorLuz, sizeof(int16_t));     idx += sizeof(int16_t);
    memcpy(&buffer[idx], &humedadSuelo, sizeof(int16_t)); idx += sizeof(int16_t);
    memcpy(&buffer[idx], &error, sizeof(int16_t));        idx += sizeof(int16_t);

    vw_send(buffer, sizeof(buffer));
    vw_wait_tx(); // Esperar a que se complete la transmisión

    Serial.println("======= Datos enviados (binario) =======");
    Serial.print("H: "); Serial.println(humedad);
    Serial.print("T: "); Serial.println(temperatura);
    Serial.print("IC: "); Serial.println(indiceCalor);
    Serial.print("Luz: "); Serial.println(valorLuz);
    Serial.print("Suelo: "); Serial.println(humedadSuelo);
    Serial.print("Error: "); Serial.println(error);

    delay(200); // Pequeño delay para evitar transmisiones seguidas
  }
}