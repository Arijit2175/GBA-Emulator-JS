
function readROM(addr) {
  if (addr >= 0x08000000 && addr < 0x0A000000) {
    return rom[addr - 0x08000000];
  }
  return 0;
}
