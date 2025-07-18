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

  if (pc >= memory.buffer.byteLength - 1) {
    console.warn(`PC 0x${pc.toString(16)} out of bounds`);
    return 0xFFFF;
  }

  const instr = memory.read16(pc);
  cpuInternal.registers[15] += 2;
  return instr;
}

function executeThumb(instr) {
  if (instr === 0xFFFF) {
    console.warn("Encountered invalid Thumb instruction 0xFFFF → HALT");
    return false; 
  }

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
      const imm5 = (instr >> 6) & 0x1F;
      const rb = (instr >> 3) & 0x7;
      const rd = instr & 0x7;
      const addr = cpuInternal.registers[rb] + (imm5 << 2);

      if (opcode & 1) {
        cpuInternal.registers[rd] = memory.read32(addr);
        console.log(`LDR r${rd}, [r${rb}, #${imm5 << 2}] → 0x${cpuInternal.registers[rd].toString(16)}`);
      } else {
        memory.write32(addr, cpuInternal.registers[rd]);
        console.log(`STR r${rd}, [r${rb}, #${imm5 << 2}] ← 0x${cpuInternal.registers[rd].toString(16)}`);
      }
      break;
    }

    default:
      console.warn(`Unhandled Thumb instruction: 0x${instr.toString(16)}`);
  }

  return true;
}

function stepCPU() {
  const instr = fetchThumb16();
  return executeThumb(instr);
}

function runCPU(cycles = 100) {
  for (let i = 0; i < cycles; i++) {
    const ok = stepCPU();
    if (!ok) {
      console.warn(`Execution halted at cycle ${i}`);
      break;
    }
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
