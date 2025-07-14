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

