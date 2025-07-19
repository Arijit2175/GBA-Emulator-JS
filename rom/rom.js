export const rom = new Uint8Array(32 * 1024 * 1024); 

export function loadROM(romData) {
  const romSize = Math.min(romData.length, rom.length);
  for (let i = 0; i < romSize; i++) {
    rom[i] = romData[i];
  }

  console.log(`✅ ROM loaded! Size: ${romSize} bytes`);
  console.log(`📛 Game Title: ${getGameTitle(rom)}`);
}

export function getGameTitle(romBuffer) {
  let title = "";
  for (let i = 0xA0; i <= 0xAB; i++) {
    if (romBuffer[i] === 0) break;
    title += String.fromCharCode(romBuffer[i]);
  }
  return title.trim();
}
