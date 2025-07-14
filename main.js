let canvas = document.getElementById('screen');
let ctx = canvas.getContext('2d');
let imageData = ctx.createImageData(160, 144);

let memory = new Uint8Array(0x10000);

document.getElementById('romInput').addEventListener('change', handleROMLoad);

