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
    case 0b00110: { 
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      cpu.registers[rd] += imm8;
      console.log(`ADD r${rd}, #${imm8}`);
      break;
    }
    case 0b00101: { 
      const rd = (instr >> 8) & 0x7;
      const imm8 = instr & 0xFF;
      const result = cpu.registers[rd] - imm8;
      cpu.cpsr = (result === 0 ? 0x40000000 : 0); 
      console.log(`CMP r${rd}, #${imm8} → Z=${(cpu.cpsr >>> 30) & 1}`);
      break;
    }
    case 0b11010: { 
      const offset11 = instr & 0x7FF;
      const offset = ((offset11 << 21) >> 20); 
      cpu.registers[15] += offset;
      console.log(`B ${offset}`);
      break;
    }
    default:
      console.warn(`Unhandled Thumb instruction: 0x${instr.toString(16)}`);
  }
}

function stepCPU() {
  const instr = fetchThumb16();
  executeThumb(instr);
}

