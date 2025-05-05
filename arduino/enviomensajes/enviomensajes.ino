#include <VirtualWire.h>

void setup()
{
    Serial.begin(9600);
    Serial.println("Listo para recibir datos :)");

    vw_setup(2000);        // Velocidad: Bits por segundo
    vw_set_rx_pin(9);      // Pin para el RF
    vw_rx_start();         // Iniciar como receptor
}

void loop()
{
    uint8_t buf[VW_MAX_MESSAGE_LEN];
    uint8_t buflen = VW_MAX_MESSAGE_LEN;

    if (vw_get_message(buf, &buflen))
    {
        String mensaje = "";
        for (int i = 0; i < buflen; i++) {
            mensaje += (char)buf[i];
        }

        Serial.println("===== Trama recibida =====");
        Serial.println(mensaje);

        // Parsear cada valor usando índices
        int hIndex = mensaje.indexOf("h:");
        int tIndex = mensaje.indexOf(",t:");
        int icIndex = mensaje.indexOf(",ic:");
        int vlIndex = mensaje.indexOf(",vl:");
        int hsIndex = mensaje.indexOf(",hs:");

        float humedad = mensaje.substring(hIndex + 2, tIndex).toFloat();
        float temperatura = mensaje.substring(tIndex + 3, icIndex).toFloat();
        float indiceCalor = mensaje.substring(icIndex + 4, vlIndex).toFloat();
        float valorLuz = mensaje.substring(vlIndex + 4, hsIndex).toFloat();
        float humedadSuelo = mensaje.substring(hsIndex + 4).toFloat();

        // Mostrar los datos
        Serial.print("Humedad: "); Serial.println(humedad);
        Serial.print("Temperatura: "); Serial.println(temperatura);
        Serial.print("Índice de Calor: "); Serial.println(indiceCalor);
        Serial.print("Luz: "); Serial.println(valorLuz);
        Serial.print("Humedad Suelo: "); Serial.println(humedadSuelo);
        
        // Enviar datos como paquete binario (4 floats = 16 bytes)
        Serial.write((uint8_t *)&humedad, sizeof(humedad));
        Serial.write((uint8_t *)&temperatura, sizeof(temperatura));
        Serial.write((uint8_t *)&indiceCalor, sizeof(indiceCalor));
        Serial.write((uint8_t *)&valorLuz, sizeof(valorLuz));
        Serial.write((uint8_t *)&humedadSuelo, sizeof(humedadSuelo));
    }
  }


