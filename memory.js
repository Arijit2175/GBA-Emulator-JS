
function readByte(addr) {
  return memory[addr];
}

function writeByte(addr, val) {
  memory[addr] = val;
}
