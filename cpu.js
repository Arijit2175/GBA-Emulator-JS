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

