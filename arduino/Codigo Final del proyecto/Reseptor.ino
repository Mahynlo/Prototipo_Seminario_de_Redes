#include <VirtualWire.h>
#include <stdint.h> // Para int16_t

//*********[!!!!!!!! Nota Importante]********** */
//Notas importantes no usar Serial.println en el reseptor debido a que se confunde con los datos binarios

void setup() {
  Serial.begin(9600);
  vw_setup(2000);        // Bits por segundo
  vw_set_rx_pin(9);      // Pin de datos del receptor RF
  vw_rx_start();         // Inicia el receptor
}

void loop() {
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;

  if (vw_get_message(buf, &buflen)) {
    if (buflen == 18) {  // Confirmamos que el mensaje es de 18 bytes
      Serial.write(buf, buflen);

      
      /*float humedad, temperatura, indiceCalor;
      int16_t luz, humedadSuelo, error;

      int idx = 0;
      memcpy(&humedad,       &buf[idx], sizeof(float)); idx += sizeof(float);
      memcpy(&temperatura,   &buf[idx], sizeof(float)); idx += sizeof(float);
      memcpy(&indiceCalor,   &buf[idx], sizeof(float)); idx += sizeof(float);
      memcpy(&luz,           &buf[idx], sizeof(int16_t)); idx += sizeof(int16_t);
      memcpy(&humedadSuelo,  &buf[idx], sizeof(int16_t)); idx += sizeof(int16_t);
      memcpy(&error,         &buf[idx], sizeof(int16_t)); idx += sizeof(int16_t);

      // Mostrar por el monitor serial
      Serial.println("======= Datos recibidos (binario) =======");
      Serial.print("H: "); Serial.println(humedad);
      Serial.print("T: "); Serial.println(temperatura);
      Serial.print("IC: "); Serial.println(indiceCalor);
      Serial.print("Luz: "); Serial.println(luz);
      Serial.print("Suelo: "); Serial.println(humedadSuelo);
      Serial.print("Error: "); Serial.println(error);
      Serial.println();*/
    }
  }
}