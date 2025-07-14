let canvas = document.getElementById('screen');
let ctx = canvas.getContext('2d');
let imageData = ctx.createImageData(160, 144);

let memory = new Uint8Array(0x10000);

document.getElementById('romInput').addEventListener('change', handleROMLoad);

function handleROMLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    const romData = new Uint8Array(reader.result);
    loadROM(romData);
    drawBlankScreen(); 
  };
  reader.readAsArrayBuffer(file);
}

function drawBlankScreen() {
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i + 0] = 0xE0; 
    imageData.data[i + 1] = 0xF8;
    imageData.data[i + 2] = 0xD0;
    imageData.data[i + 3] = 0xFF;
  }
  ctx.putImageData(imageData, 0, 0);
}