const cpuInternal = {
  registers: new Uint32Array(16),
  cpsr: 0
};

function cpuReset() {
  cpuInternal.registers.fill(0);
  cpuInternal.registers[13] = 0x03007F00;
  cpuInternal.registers[15] = 0x08000000; 
  cpuInternal.cpsr = 0x00000030; 
}

function fetchThumb16() {
  const pc = cpuInternal.registers[15];
  const instr = memory.read16(pc);
  cpuInternal.registers[15] += 2;
  return instr;
}

function executeThumb(instr) {
  const opcode = (instr & 0xF800) >>> 11;

  switch (opcode) {
    case 0b00100: {
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      cpuInternal.registers[rd] = imm8;
      console.log(`MOV r${rd}, #${imm8}`);
      break;
    }
    case 0b00110: {
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      cpuInternal.registers[rd] += imm8;
      console.log(`ADD r${rd}, #${imm8}`);
      break;
    }
    case 0b00101: {
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      const result = cpuInternal.registers[rd] - imm8;
      cpuInternal.cpsr = (result === 0 ? 0x40000000 : 0);
      console.log(`CMP r${rd}, #${imm8} → Z=${(cpuInternal.cpsr >>> 30) & 1}`);
      break;
    }
    case 0b11010: {
      const offset11 = instr & 0x7FF;
      const offset = ((offset11 << 21) >> 20);
      cpuInternal.registers[15] += offset;
      console.log(`B ${offset}`);
      break;
    }
    case 0b01100:
    case 0b01101: {
      
    }
    default:
      console.warn(`Unhandled Thumb instruction: 0x${instr.toString(16)}`);
  }
}

function stepCPU() {
  const instr = fetchThumb16();
  executeThumb(instr);
}

function runCPU(cycles = 100) {
  for (let i = 0; i < cycles; i++) {
    stepCPU();
  }
}

window.cpu = {
  registers: cpuInternal.registers,
  cpsr: () => cpuInternal.cpsr,
  reset: cpuReset,
  step: stepCPU,
  run: runCPU
};

console.log("✅ cpu.js loaded and cpu exported");
