let chars = 'Ñ@#W$9876543210?!abc;:+=-,._                    ';
let counter = 0;
let output_vw, output_vh;

// Customization
let walk = false;
let cameraMode = false;
let colorize = false;
let flipChars = false;

let whack = true;

let video, vidRef, type, lastAvg;

function preload() {
  type = 'video';
  video = createVideo('bird.mp4', initialize);
  
  densitySlider.value = '100';
  widthSlider.value = window.innerWidth * 3/4;
  widthSlider.max = window.outerWidth;
}

function draw() {  
  if (!video) return;
  if (type !== 'image' && !video.loadedmetadata) return;
  
  gfx = video.get(0,0, video.width, video.height);
  gfx.resize(output_vw, output_vh);
  
  // if (type === 'image') c.drawingContext.drawImage(vidRef, 0, 0, c.width, c.height);
  
  gfx.loadPixels();
  let samePixels = 0;
  
  let asciiImage = '';
  for (let y = 0; y < gfx.height; y++) {
    lastAvg = -1;
    for (let x = 
         (!cameraMode) ? 0 : gfx.width-1; 
         (!cameraMode) ? x < gfx.width : x >= 0; 
         (!cameraMode) ? x++ : x--) {
      const pixIndex = (x + y * gfx.width) * 4;
      const r = gfx.pixels[pixIndex];
      const g = gfx.pixels[pixIndex+1];
      const b = gfx.pixels[pixIndex+2];
      
      const avg = (r+g+b) / 3;
      const charIndex = map(avg, 0, 255, 
                            (!flipChars) ? chars.length-1 : 0, 
                            (!flipChars) ? 0 : chars.length-1);
      let c = chars.charAt((!walk) ? charIndex : int(charIndex + counter/6) % chars.length);
      if (c === ' ') (c = (!colorize) ? '&nbsp' : "^");
      if (colorize) {
        if (avg <= 3) c = '&nbsp';
        if (lastAvg !== avg) {
          if (x > 0) asciiImage += '</span>';
          if (avg > 3) asciiImage += `<span style="color: rgb(${r},${g},${b})">`;
          else asciiImage += '<span>';
        }
      }
      asciiImage += c;
      
      lastAvg = avg;
    }
    asciiImage += '<br>';
  }
  
  if (colorize && asciiCanvas.style.color === '#fff') asciiCanvas.style.color = '#000';
  if (!colorize && asciiCanvas.style.color === '#000') asciiCanvas.style.color = '#fff';
  asciiCanvas.innerHTML = asciiImage; 
  if (video.elt.paused) return;
  counter++;
}

function inputLoad(param) {
  let videos = document.getElementsByTagName('video');
  if (videos.length > 0) videos[0].remove();
  let t;
  t = (param === 'camera') ? param : t = param.type.slice(0, 5);
  
  if (t === '') return;
  
  let lastType = type;
  type = t; 
  
  let blob = (type !== 'camera') ? URL.createObjectURL(param) : (0);

  if (type === 'camera') {
    if (lastType === type) return;
    fileInput.value = '';
    video = createCapture(VIDEO, initialize);
  } else if (type === 'video' || type === 'image') {
    if (type === 'video') video = createVideo(blob, initialize)
  }
}

function initialize() {
  initializeEnd = false;
  counter = 0;
  
  if (type === 'video' || type === 'camera') 
    ((whack) ? video.elt.volume = 0 : video.elt.volume = 1, video.elt.loop = true, video.elt.play());
  video.elt.classList.add('videoDisplay');
  if (type === 'camera') video.elt.classList.add('isCamera');
  changeFontSize(); changeDensity(); 
  
  if (type === 'camera') {
    fileInput.classList.remove('fileInputActive');
    webcamButton.classList.add('webcamButtonActive');
  } else if (type === 'video' || type === 'image') {
    webcamButton.classList.remove('webcamButtonActive');
    fileInput.classList.add('fileInputActive');
  }
  
  if (whack) whack = false;
}

function changeDensity() {
  let newW = int(densitySlider.value);
  let newH = int(newW / init_vw * init_vh);
  output_vw = newW; output_vh = newH;
  changeFontSize();
}

function changeWidth() {
  changeFontSize();
}

function changeFontSize() {
  asciiCanvas.style.fontSize = 16 * 100/int(densitySlider.value) * int(widthSlider.value)/1320 + 'px';
}
