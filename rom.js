function loadROM(romData) {
  romSize = Math.min(romData.length, rom.length);
  for (let i = 0; i < romSize; i++) {
    rom[i] = romData[i];
  }

  console.log(`✅ ROM loaded! Size: ${romSize} bytes`);
  console.log(`📛 Game Title: ${getGameTitle(rom)}`);
}

function getGameTitle(rom) {
  let title = "";
  for (let i = 0xA0; i <= 0xAB; i++) {
    if (rom[i] === 0) break;
    title += String.fromCharCode(rom[i]);
  }
  return title.trim();
}
