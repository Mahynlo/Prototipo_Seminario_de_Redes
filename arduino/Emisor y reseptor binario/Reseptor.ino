#include <VirtualWire.h>

void setup() {
  Serial.begin(9600);
  vw_setup(2000);
  vw_set_rx_pin(9);
  vw_rx_start();
}

void loop() {
  uint8_t buf[VW_MAX_MESSAGE_LEN];
  uint8_t buflen = VW_MAX_MESSAGE_LEN;

  if (vw_get_message(buf, &buflen)) {
    if (buflen == 20) {
      // Enviar directamente el buffer binario al puerto serial
      Serial.write(buf, buflen);
    }
  }
}
