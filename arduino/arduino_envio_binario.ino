#include <DHT.h>

#define DHTPIN 2 // Pin del sensor DHT11
#define PHOTORES A0 // Pin del fotoresistor
#define DHTTYPE DHT11
const unsigned long INTERVALO_LECTURA = 5000;

DHT dht(DHTPIN, DHTTYPE);
unsigned long ultimaLectura = 0;

void setup() {
  Serial.begin(9600);  
  dht.begin();
}

void loop() {
  unsigned long ahora = millis(); // Obtener el tiempo actual

  if (ahora - ultimaLectura >= INTERVALO_LECTURA) {
    ultimaLectura = ahora; // Actualizar el tiempo de la última lectura

    // Leer los valores del sensor DHT11 y el fotoresistor
    float humedad = dht.readHumidity(); 
    float temperatura = dht.readTemperature();
    float valorLuz = analogRead(PHOTORES);
    float indiceCalor = dht.computeHeatIndex(temperatura, humedad, false);

    if (isnan(humedad) || isnan(temperatura)) {
      Serial.println("Error en la lectura del sensor");
      return;
    }

    // Enviar datos como paquete binario (4 floats = 16 bytes)
    Serial.write((uint8_t *)&humedad, sizeof(humedad));
    Serial.write((uint8_t *)&temperatura, sizeof(temperatura));
    Serial.write((uint8_t *)&indiceCalor, sizeof(indiceCalor));
    Serial.write((uint8_t *)&valorLuz, sizeof(valorLuz));
  }
}