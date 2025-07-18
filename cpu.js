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
  const romOffset = pc - 0x08000000;

  if (romOffset < 0 || romOffset >= window.rom.length - 1) {
    console.warn(`PC 0x${pc.toString(16)} out of ROM bounds`);
    return 0xFFFF;
  }

  const instr = memory.read16(pc);
  cpuInternal.registers[15] += 2;
  return instr;
}

function executeThumb(instr) {
  const op = instr & 0xF800;

  if (op === 0x2000) {
    const rd = (instr >> 8) & 0x7;
    const imm = instr & 0xFF;
    cpuInternal.registers[rd] = imm;
    console.log(`MOV r${rd}, #${imm}`);
  }

  else if ((instr & 0xF800) === 0x2800) {
    const rd = (instr >> 8) & 7;
    const imm = instr & 0xFF;
    const res = cpuInternal.registers[rd] - imm;
    cpuInternal.cpsr = (res === 0) ? 0x40000000 : 0;
    console.log(`CMP r${rd}, #${imm} → Z=${cpuInternal.cpsr >>> 30}`);
  }

  else if ((instr & 0xF800) === 0x3000) {
    const rd = (instr >> 8) & 7;
    const imm = instr & 0xFF;
    cpuInternal.registers[rd] += imm;
    console.log(`ADD r${rd}, #${imm}`);
  }

  else if ((instr & 0xF800) === 0x4800) {
    const rd = (instr >> 8) & 0x7;
    const imm = (instr & 0xFF) << 2;
    const addr = (cpuInternal.registers[15] & ~2) + imm;
    const value = memory.read32(addr);
    cpuInternal.registers[rd] = value;
    console.log(`LDR r${rd}, [PC + ${imm}] → 0x${value.toString(16)}`);
  }

  else if ((instr & 0xF000) === 0x6000 || (instr & 0xF000) === 0x6800) {
    const isLoad = (instr & 0xF800) === 0x6800;
    const imm5 = (instr >> 6) & 0x1F;
    const rb = (instr >> 3) & 0x7;
    const rd = instr & 0x7;
    const addr = cpuInternal.registers[rb] + (imm5 << 2);

    if (isLoad) {
      cpuInternal.registers[rd] = memory.read32(addr);
      console.log(`LDR r${rd}, [r${rb}, #${imm5 << 2}]`);
    } else {
      memory.write32(addr, cpuInternal.registers[rd]);
      console.log(`STR r${rd}, [r${rb}, #${imm5 << 2}]`);
    }
  }

  else if ((instr & 0xFFC0) === 0x4700) {
    const rm = instr & 0x7;
    const dest = cpuInternal.registers[rm];
    cpuInternal.registers[15] = dest & ~1;
    console.log(`BX r${rm} → 0x${dest.toString(16)}`);
  }

  else if ((instr & 0xF000) === 0xD000) {
    const cond = (instr >> 8) & 0xF;
    const imm = instr & 0xFF;
    const offset = ((imm << 24) >> 23); 
    const z = (cpuInternal.cpsr >>> 30) & 1;
    let take = false;

    if (cond === 0xE) take = true;
    else if (cond === 0x0 && z) take = true;
    else if (cond === 0x1 && !z) take = true;

    if (take) {
      cpuInternal.registers[15] += offset;
      console.log(`B${cond.toString(16)} taken → offset ${offset}`);
    } else {
      console.log(`B${cond.toString(16)} not taken`);
    }
  }

  else if ((instr & 0xF800) === 0xE000) {
    const imm11 = instr & 0x7FF;
    const offset = ((imm11 << 21) >> 20); 
    cpuInternal.registers[15] += offset;
    console.log(`B ${offset}`);
  }

  else {
    console.warn(`Unhandled Thumb instr: 0x${instr.toString(16)}`);
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
