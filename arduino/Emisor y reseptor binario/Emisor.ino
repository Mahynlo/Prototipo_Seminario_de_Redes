#include <DHT.h>
#include <VirtualWire.h>

#define DHTPIN 2           // Pin del sensor DHT11
#define PHOTORES A0        // Fotoresistor
#define DHTTYPE DHT11
#define SOIL A1            // Sensor de humedad de suelo
#define TX_PIN 9           // Pin del módulo RF 433 MHz

const unsigned long INTERVALO_LECTURA = 5000;

DHT dht(DHTPIN, DHTTYPE);
unsigned long ultimaLectura = 0;

void setup() {
  Serial.begin(9600);  
  dht.begin();

  Serial.println("Comenzando transmisión en binario :)");

  vw_setup(2000);
  vw_set_tx_pin(TX_PIN);
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimaLectura >= INTERVALO_LECTURA) {
    ultimaLectura = ahora;

    float humedad = dht.readHumidity(); 
    float temperatura = dht.readTemperature();
    float indiceCalor = dht.computeHeatIndex(temperatura, humedad, false);
    float valorLuz = analogRead(PHOTORES);     // Lo convertimos a float también
    float humedadSuelo = analogRead(SOIL);     // Lo convertimos a float también

    if (isnan(humedad) || isnan(temperatura)) {
      Serial.println("Error en la lectura del sensor DHT");
      return;
    } else if (isnan(humedadSuelo)) {
      Serial.println("Error en la lectura del sensor de humedad de suelo");
      return;
    }

    // Empaquetar los datos en binario
    uint8_t buffer[20];  // 5 * 4 bytes
    memcpy(buffer,      &humedad,       4);
    memcpy(buffer + 4,  &temperatura,   4);
    memcpy(buffer + 8,  &indiceCalor,   4);
    memcpy(buffer + 12, &valorLuz,      4);
    memcpy(buffer + 16, &humedadSuelo,  4);

    // Enviar
    vw_send(buffer, sizeof(buffer));
    vw_wait_tx();

    // Mostrar también en el monitor serial
    Serial.println("========== DATOS ENVIADOS (BINARIO) ==========");
    Serial.print("Humedad: "); Serial.println(humedad);
    Serial.print("Temperatura: "); Serial.println(temperatura);
    Serial.print("Índice de Calor: "); Serial.println(indiceCalor);
    Serial.print("Luz: "); Serial.println(valorLuz);
    Serial.print("Humedad Suelo: "); Serial.println(humedadSuelo);
  }
}