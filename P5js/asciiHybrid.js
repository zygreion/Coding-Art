const chars = 'Ñ@#W$9876543210?!abc;:+=-,._                    ';
let savedFrameTime = 0;
let isStopped = false;
let counter = 0;
let init_vw, init_vh, init_ow;

// Customization
let walk = false;
let cameraMode = true;
let colorize = false;

function preload() {
  video = createVideo('P5js/bird.mp4', initialize);
}

function setup() {
  noCanvas();
}

function draw() {
  if (!video.loadedmetadata) return;
  video.loadPixels();
  let samePixels = 0;
  
  let isSavingTime = false
  if (second() % 2 === 0 && savedFrameTime !== second()) {
    savedFrameTime = second();
    isSavingTime = true;
  }
  
  let asciiImage = '';
  for (let y = 0; y < video.height; y++) {
    for (let x = 
         (cameraMode) ? 0 : video.width-1; 
         (cameraMode) ? x < video.width : x >= 0; 
         (cameraMode) ? x++ : x--) {
      const pixIndex = (x + y * video.width) * 4;
      const r = video.pixels[pixIndex];
      const g = video.pixels[pixIndex+1];
      const b = video.pixels[pixIndex+2];
      
      if (savedFrame.pixels[pixIndex] === r &&
          savedFrame.pixels[pixIndex+1] === g &&
          savedFrame.pixels[pixIndex+2] === b) samePixels++;
      
      if (!isStopped && isSavingTime) {
        savedFrame.pixels[pixIndex] = r;
        savedFrame.pixels[pixIndex+1] = g;
        savedFrame.pixels[pixIndex+2] = b;
      }
      
      const avg = (r+g+b) /3;
      const charIndex = map(avg, 0, 255, chars.length, 0);
      let c = chars.charAt((!walk) ? charIndex : (charIndex + counter/4) % chars.length);
      if (c === ' ') c = '&nbsp';
      asciiImage += (!colorize) ? c : `<span style="color: rgb(${r},${g},${b}, 1)">${c}</span>`;
    }
    asciiImage += '<br>';
  }
  
  asciiCanvas.innerHTML = asciiImage;
  
  let allow = 0;
  (samePixels === video.width * video.height) ? allow++ : allow--;
  (!isStopped) ? allow++ : allow--;
  switch (allow) {
    case 2:
      isStopped = true;
      asciiCanvas.style.opacity = 0.4;
      dcDiv.style.opacity = 1;
      break;
    case -2:
      isStopped = false;
      asciiCanvas.style.opacity = 1;
      dcDiv.style.opacity = 0;
      break;
  }
  
  if (!isStopped) counter++;
}

function initialize() {
  densitySlider.value = '100';
  widthSlider.value = '960';
  init_vw = video.width; init_vh = video.height;
  video.play(); video.loop(); video.volume(0);
  video.parent(originalVideo);
  changeWidth(); changeDensity();
  // video.hide();
}

function changeWidth() {
  // at widthSlider.value === 100, 
  // the asciiCanvas fontSize is 16px
  // asciiCanvas.style.fontSize = widthSlider.value/100 * 16 + 'px';
  changeFontSize();
}

function changeDensity() {
  let newW = int(densitySlider.value);
  let newH = int(newW / init_vw * init_vh);
  video.size(newW, newH);
  savedFrame = createGraphics(newW, newH);
  changeFontSize();
}

function changeFontSize() {
  asciiCanvas.style.fontSize = 16 * int(widthSlider.value)/960 * 100/int(densitySlider.value) + 'px';
}