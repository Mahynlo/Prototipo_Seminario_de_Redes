#include <DHT.h>

// --- Configuraciones ---
#define DHTPIN 2            // Pin donde está conectado el DHT11
#define PHOTORES 1          //Pin de la fotoresistencia
#define DHTTYPE DHT11       // Tipo de sensor
const unsigned long INTERVALO_LECTURA = 5000; // 1 segundos

// --- Inicialización del sensor ---
DHT dht(DHTPIN, DHTTYPE);
unsigned long ultimaLectura = 0;

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimaLectura >= INTERVALO_LECTURA) {
    ultimaLectura = ahora;
    //Lectura del sensor DHT
    leerSensorDHT();

    //Lectura Fotoresistencia
    lecturaPhotores();

  }
}

float lecturaPhotores(){
  float valorLuz;

  valorLuz = analogRead(PHOTORES);
  Serial.println("---- Lectura de Fotoresistencia ----");
  Serial.print("Luminosidad: ");
  Serial.println(valorLuz);
  
  //return valorLuz;

}

float leerSensorDHT() {
  float humedad = dht.readHumidity();
  float tempC = dht.readTemperature(); // Solo Celsius

  if (isnan(humedad) || isnan(tempC)) {
    Serial.println("Error obteniendo los datos del sensor DHT11");
    return;
  }

  float indiceCalorC = dht.computeHeatIndex(tempC, humedad, false); // false = Celsius

  Serial.println("----- Lectura de Sensor DHT11 -----");
  Serial.print("Humedad: ");
  Serial.print(humedad);
  Serial.println(" %");

  Serial.print("Temperatura: ");
  Serial.print(tempC);
  Serial.println(" °C");

  Serial.print("Índice de Calor: ");
  Serial.print(indiceCalorC);
  Serial.println(" °C");
  //Serial.println("-----------------------------------");
}
