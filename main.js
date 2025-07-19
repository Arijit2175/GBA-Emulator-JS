import { CPU } from './cpu/cpu.js';
import { memory } from './memory/memory.js';
import { rom, loadROM, getGameTitle } from './rom/rom.js';

let canvas = document.getElementById('screen');
let ctx = canvas.getContext('2d');
let imageData = ctx.createImageData(240, 160);

window.rom = new Uint8Array(32 * 1024 * 1024); 
let romSize = 0;

let cpu = new CPU();

document.getElementById('romInput').addEventListener('change', handleROMLoad);

function handleROMLoad(event) {
  const file = event.target.files[0];
  if (!file || !file.name.endsWith(".gba")) {
    alert("Please select a valid .gba ROM file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const romData = new Uint8Array(reader.result);
    loadROM(romData);
    drawPlaceholderScreen();

    console.log("ROM start byte:", memory.read8(0x08000000).toString(16));

    cpu.reset();
    cpu.run(20); 

    console.log("r0:", cpu.registers[0]);
    console.log("PC:", cpu.registers[15].toString(16));
  };

  reader.readAsArrayBuffer(file);
}

function drawPlaceholderScreen() {
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = 173;  
    imageData.data[i + 1] = 216;  
    imageData.data[i + 2] = 230;  
    imageData.data[i + 3] = 255;  
  }
  ctx.putImageData(imageData, 0, 0);
}
