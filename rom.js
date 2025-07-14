function loadROM(romData) {
  for (let i = 0; i < romData.length && i < 0x8000; i++) {
    memory[i] = romData[i];
  }
  console.log("ROM loaded! Size: " + romData.length + " bytes");
}
