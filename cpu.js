const cpu = {
    registers: new Uint32Array(16),
    cpsr: 0
}

function cpuReset() {
  cpu.registers.fill(0);
  cpu.registers[13] = 0x03007F00; 
  cpu.registers[15] = 0x08000000; 
  cpu.cpsr = 0x00000030;          
}

function fetchThumb16() {
  const pc = cpu.registers[15];
  const instr = memory.read16(pc);
  cpu.registers[15] += 2;
  return instr;
}

