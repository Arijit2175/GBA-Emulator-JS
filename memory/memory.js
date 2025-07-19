const BIOS = new Uint8Array(0x4000);
const WRAM = new Uint8Array(0x40000);
const IRAM = new Uint8Array(0x8000);
const VRAM = new Uint8Array(0x18000);
const IOREG = new Uint8Array(0x400);
const PRAM = new Uint8Array(0x400);
const OAM  = new Uint8Array(0x400);

function read8(addr) {
  addr = addr >>> 0;
  if (addr < 0x00004000) return BIOS[addr];
  if (addr >= 0x02000000 && addr < 0x02040000) return WRAM[addr - 0x02000000];
  if (addr >= 0x03000000 && addr < 0x03008000) return IRAM[addr - 0x03000000];
  if (addr >= 0x04000000 && addr < 0x04000400) return IOREG[addr - 0x04000000];
  if (addr >= 0x05000000 && addr < 0x05000400) return PRAM[addr - 0x05000000];
  if (addr >= 0x06000000 && addr < 0x06018000) return VRAM[addr - 0x06000000];
  if (addr >= 0x07000000 && addr < 0x07000400) return OAM[addr - 0x07000000];
  if (addr >= 0x08000000 && addr < 0x0A000000) return window.rom?.[addr - 0x08000000] ?? 0;
  return 0;
}

function write8(addr, val) {
  addr = addr >>> 0;
  val &= 0xFF;
  if (addr >= 0x02000000 && addr < 0x02040000) WRAM[addr - 0x02000000] = val;
  else if (addr >= 0x03000000 && addr < 0x03008000) IRAM[addr - 0x03000000] = val;
  else if (addr >= 0x04000000 && addr < 0x04000400) IOREG[addr - 0x04000000] = val;
  else if (addr >= 0x05000000 && addr < 0x05000400) PRAM[addr - 0x05000000] = val;
  else if (addr >= 0x06000000 && addr < 0x06018000) VRAM[addr - 0x06000000] = val;
  else if (addr >= 0x07000000 && addr < 0x07000400) OAM[addr - 0x07000000] = val;
}

function read16(addr) {
  return read8(addr) | (read8(addr + 1) << 8);
}
function write16(addr, val) {
  write8(addr, val & 0xFF);
  write8(addr + 1, (val >> 8) & 0xFF);
}
function read32(addr) {
  return read8(addr) |
         (read8(addr + 1) << 8) |
         (read8(addr + 2) << 16) |
         (read8(addr + 3) << 24);
}
function write32(addr, val) {
  write8(addr, val & 0xFF);
  write8(addr + 1, (val >> 8) & 0xFF);
  write8(addr + 2, (val >> 16) & 0xFF);
  write8(addr + 3, (val >> 24) & 0xFF);
}

window.memory = {
  read8, read16, read32,
  write8, write16, write32
};
