let cpuInternal = {
  registers: new Uint32Array(16), 
  cpsr: 0x00000000 
};

function resetCPU() {
  cpuInternal.registers.fill(0);
  cpuInternal.cpsr = 0x00000000;
}

function isThumbMode() {
  return (cpuInternal.cpsr & (1 << 5)) !== 0;
}

function fetchThumb16() {
  const pc = cpuInternal.registers[15];
  const romOffset = pc - 0x08000000;

  if (romOffset < 0 || romOffset + 1 >= window.rom.length) {
    console.warn(`PC 0x${pc.toString(16)} out of ROM bounds`);
    return 0xFFFF;
  }

  return memory.read16(pc);
}

function fetchARM32(pc) {
  const romOffset = pc - 0x08000000;

  if (romOffset < 0 || romOffset + 3 >= window.rom.length) {
    console.warn(`PC 0x${pc.toString(16)} out of ROM bounds`);
    return 0xFFFFFFFF;
  }

  return memory.read32(pc);
}

function executeThumb(opcode) {
  const regs = cpuInternal.registers;

  if ((opcode & 0xF800) === 0x1800) {
    const rd = opcode & 0x7;
    const rs = (opcode >> 3) & 0x7;
    const rn = (opcode >> 6) & 0x7;
    regs[rd] = (regs[rs] + regs[rn]) >>> 0;
    console.log(`ADD r${rd}, r${rs}, r${rn}`);
  }

  else if ((opcode & 0xFF00) === 0xB500) {
    regs[13] = (regs[13] - 4) >>> 0;
    memory.write32(regs[13], regs[14]);
    console.log(`PUSH {lr}`);
  }

  else if ((opcode & 0xFF00) === 0xBD00) {
    regs[15] = memory.read32(regs[13]);
    regs[13] = (regs[13] + 4) >>> 0;
    console.log(`POP {pc}`);
    return false; 
  }

  else if ((opcode & 0xF800) === 0x3000) {
    const rd = (opcode >> 8) & 0x7;
    const imm = opcode & 0xFF;
    regs[rd] = (regs[rd] + imm) >>> 0;
    console.log(`ADD r${rd}, #${imm}`);
  }

  else if ((opcode & 0xFF87) === 0x4687) {
    const rd = (opcode >> 0) & 0x7;
    const rs = (opcode >> 3) & 0xF;
    regs[rd] = regs[rs];
    console.log(`MOV r${rd}, r${rs}`);
  }

  else {
    console.warn(`Unhandled Thumb opcode: 0x${opcode.toString(16)}`);
  }

  return true;
}

function executeARM(instr) {
  const regs = cpuInternal.registers;
  const cond = (instr >>> 28) & 0xF;

  if (cond !== 0xE) {
    console.warn(`Unhandled ARM condition: 0x${cond.toString(16)}`);
    return true;
  }

  if ((instr & 0x0FE00010) === 0x01A00000) {
    const rd = (instr >>> 12) & 0xF;
    const rm = instr & 0xF;
    regs[rd] = regs[rm];
    console.log(`ARM: MOV r${rd}, r${rm}`);
  }

  else if ((instr & 0x0FE00000) === 0x00800000) {
    const rd = (instr >>> 12) & 0xF;
    const rn = (instr >>> 16) & 0xF;
    const rm = instr & 0xF;
    regs[rd] = (regs[rn] + regs[rm]) >>> 0;
    console.log(`ARM: ADD r${rd}, r${rn}, r${rm}`);
  }

  else if ((instr & 0x0F000000) === 0x0A000000) {
    const imm24 = instr & 0xFFFFFF;
    const offset = ((imm24 << 8) >> 6); 
    regs[15] = (regs[15] + offset + 4) >>> 0;
    console.log(`ARM: B ${offset}`);
    return false; 
  }

  else {
    console.warn(`Unhandled ARM instr: 0x${instr.toString(16)}`);
  }

  return true;
}

function stepCPU() {
  const pc = cpuInternal.registers[15];

  if (isThumbMode()) {
    const instr = fetchThumb16();
    const ok = executeThumb(instr);
    if (ok) cpuInternal.registers[15] += 2;
    return ok;
  } else {
    const instr = fetchARM32(pc);
    const ok = executeARM(instr);
    if (ok) cpuInternal.registers[15] += 4;
    return ok;
  }
}

function getCPUState() {
  return {
    registers: Array.from(cpuInternal.registers),
    cpsr: cpuInternal.cpsr
  };
}

export { resetCPU, stepCPU, getCPUState };
