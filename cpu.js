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

function executeThumb(instr) {
  const opcode = (instr & 0xF800) >>> 11;

  switch(opcode) {
    case 0b00100: { 
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      cpu.registers[rd] = imm8;
      console.log(`MOV r${rd}, #${imm8}`);
      break;
    }
  }