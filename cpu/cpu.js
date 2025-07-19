import { memory } from '../memory/memory.js';

class CPU {
  constructor() {
    this.registers = new Uint32Array(16);
    this.cpsr = 0x00000000;
    this.reset();
  }

  reset() {
    this.registers.fill(0);
    this.registers[13] = 0x03007F00; 
    this.registers[15] = 0x08000000; 
    this.cpsr = 0x00000020; 
  }

  isThumbMode() {
    return (this.cpsr & (1 << 5)) !== 0;
  }

  fetchThumb16() {
    const pc = this.registers[15];
    const romOffset = pc - 0x08000000;
    if (romOffset < 0 || romOffset + 1 >= window.rom.length) {
      console.warn(`PC 0x${pc.toString(16)} out of ROM bounds`);
      return 0xFFFF;
    }
    return memory.read16(pc);
  }

  fetchARM32(pc) {
    const romOffset = pc - 0x08000000;
    if (romOffset < 0 || romOffset + 3 >= window.rom.length) {
      console.warn(`PC 0x${pc.toString(16)} out of ROM bounds`);
      return 0xFFFFFFFF;
    }
    return memory.read32(pc);
  }

  executeThumb(opcode) {
  const regs = this.registers;

  if (opcode === 0x0000) {
    console.log("🔹 NOP");
    return;
  }

  if ((opcode & 0xF800) === 0x1800) {
    const rd = opcode & 0x7;
    const rs = (opcode >> 3) & 0x7;
    const rn = (opcode >> 6) & 0x7;
    regs[rd] = (regs[rs] + regs[rn]) >>> 0;
    console.log(`ADD r${rd}, r${rs}, r${rn}`);
  }

  else if ((opcode & 0xF800) === 0x3000) {
    const rd = (opcode >> 8) & 0x7;
    const imm = opcode & 0xFF;
    regs[rd] = (regs[rd] + imm) >>> 0;
    console.log(`ADD r${rd}, #${imm}`);
  }

  else if ((opcode & 0xF800) === 0x2000) {
    const rd = (opcode >> 8) & 0x7;
    const imm = opcode & 0xFF;
    regs[rd] = imm;
    console.log(`MOV r${rd}, #${imm}`);
  }

  else if ((opcode & 0xF800) === 0x2800) {
    const rn = (opcode >> 8) & 0x7;
    const imm = opcode & 0xFF;
    const result = (regs[rn] - imm) >>> 0;
    console.log(`CMP r${rn}, #${imm} => ${result}`);
  }

  else if ((opcode & 0xFFC0) === 0x4600) {
    const rd = ((opcode >> 0) & 0x7) | ((opcode >> 4) & 0x8);
    const rs = ((opcode >> 3) & 0xF);
    regs[rd] = regs[rs];
    console.log(`MOV r${rd}, r${rs}`);
  }

  else if ((opcode & 0xFF87) === 0x4700) {
    const rs = (opcode >> 3) & 0xF;
    const target = regs[rs];
    regs[15] = target & ~1;
    this.cpsr = (target & 1) ? (this.cpsr | (1 << 5)) : (this.cpsr & ~(1 << 5));
    console.log(`BX r${rs} => ${target.toString(16)} | Mode: ${this.isThumbMode() ? "Thumb" : "ARM"}`);
    return false;
  }

  else if ((opcode & 0xF800) === 0xE000) {
    const offset11 = opcode & 0x7FF;
    const signedOffset = ((offset11 << 21) >> 20); 
    regs[15] = (regs[15] + signedOffset + 2) >>> 0;
    console.log(`B ${signedOffset >= 0 ? "+" : ""}${signedOffset} => PC=0x${regs[15].toString(16)}`);
    return false;
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

  else if ((opcode & 0xF800) === 0x6800) {
    const rt = opcode & 0x7;
    const rn = (opcode >> 3) & 0x7;
    const offset = (opcode >> 6) & 0x1F;
    const addr = (regs[rn] + (offset << 2)) >>> 0;
    regs[rt] = memory.read32(addr);
    console.log(`LDR r${rt}, [r${rn}, #${offset << 2}] => r${rt} = 0x${regs[rt].toString(16)}`);
  }

  else if ((opcode & 0xF800) === 0x6000) {
    const rt = opcode & 0x7;
    const rn = (opcode >> 3) & 0x7;
    const offset = (opcode >> 6) & 0x1F;
    const addr = (regs[rn] + (offset << 2)) >>> 0;
    memory.write32(addr, regs[rt]);
    console.log(`STR r${rt}, [r${rn}, #${offset << 2}] => [0x${addr.toString(16)}] = 0x${regs[rt].toString(16)}`);
  }

  else {
  console.warn(`⚠️ Unhandled Thumb opcode: 0x${opcode.toString(16)} at PC=0x${regs[15].toString(16)}`);
  this.halted = true;
}


  return true;
}

  executeARM(instr) {
    const regs = this.registers;
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

  step() {
    const pc = this.registers[15];

    if (this.isThumbMode()) {
      const instr = this.fetchThumb16();
      const ok = this.executeThumb(instr);
      if (ok) this.registers[15] += 2;
      return ok;
    } else {
      const instr = this.fetchARM32(pc);
      const ok = this.executeARM(instr);
      if (ok) this.registers[15] += 4;
      return ok;
    }
  }

  run() {
  this.halted = false;
  const maxCycles = 10000;  

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    if (this.halted) {
      console.warn(`⚠️ Execution halted at cycle ${cycle}`);
      break;
    }

    try {
      const continueExecution = this.step();
      if (!continueExecution) break;
    } catch (e) {
      console.error(`❌ Execution error at cycle ${cycle}:`, e.message);
      break;
    }
  }

  console.log("✅ CPU finished running", maxCycles, "cycles");
  console.log("PC:", this.registers[15].toString(16));
  console.log("r0:", this.registers[0]);
}


  getState() {
    return {
      registers: Array.from(this.registers),
      cpsr: this.cpsr
    };
  }
}

export { CPU };
