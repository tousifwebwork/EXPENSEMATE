


function verificationCode() {
  const chars = "Q7MZK2P9X4L8V1R6T0Y3N5W7H2F9C8J4B6D1S0A5G3K8U2E7P9X1M4Z6Q0L3V5R8T2Y7N1W9F4C6J0B3D8H5S2A7G1K9U4E6P0X3M8Z5Q2L7V1R9T4Y6N0W3H8F2C5J7B1D9S4A6G0K3U8E2";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = {verificationCode};