let chars = 'Ñ@#W$9876543210?!abc;:+=-,._                    ';
let savedFrameTime = 0;
let isStopped = false;
let counter = 0;
let init_vw, init_vh;
let initializeEnd;

// Customization
let walk = false;
let cameraMode = false;
let colorize = false;

let video, vidRef, c, type, lastAvg;

function preload() {
  type = 'video';
  video = createVideo('bird.mp4', initialize);
  
  densitySlider.value = '100';
  widthSlider.value = window.innerWidth * 3/4;
  widthSlider.max = window.outerWidth-40;
}

function draw() {  
  if (!video) return;
  if (type !== 'image' && !video.loadedmetadata) return;
  if (initializeEnd) {
    if (typeof(c) === 'undefined') {
      c = createCanvas(int(56 * init_vw / init_vh), 56);
      c.parent(videoDisplay);
      initializeEnd = false;
    }
  }

  if (c.width !== 56 * init_vw / init_vh || c.height !== 56) c.resize(56 * init_vw / init_vh, 56);
  
  if (type === 'image') c.drawingContext.drawImage(vidRef, 0, 0, c.width, c.height);
  if (type === 'video' || type === 'camera') image(video, 0,0, c.width, c.height);
  
  video.loadPixels();
  let samePixels = 0;
  
  let isSavingTime = false
  if (second() % 2 === 0 && savedFrameTime !== second()) {
    savedFrameTime = second();
    isSavingTime = true;
  }
  
  let asciiImage = '';
  for (let y = 0; y < video.height; y++) {
    lastAvg = -1;
    for (let x = 
         (!cameraMode) ? 0 : video.width-1; 
         (!cameraMode) ? x < video.width : x >= 0; 
         (!cameraMode) ? x++ : x--) {
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
      
      if (isStopped) return;
      const avg = (r+g+b) / 3;
      const charIndex = map(avg, 0, 255, chars.length-1, 0);
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
  
  if (!isStopped) {
    if (colorize && asciiCanvas.style.color === '#fff') asciiCanvas.style.color = '#000';
    if (!colorize && asciiCanvas.style.color === '#000') asciiCanvas.style.color = '#fff';
    asciiCanvas.innerHTML = asciiImage; 
    counter++;
  }
  
  // if (type === 'image') return;
  // let allow = 0;
  // (samePixels === video.width * video.height) ? allow++ : allow--;
  // (video.elt.paused && !isStopped) ? allow++ : allow--;
  // switch (allow) {
  //   case 2:
  //     isStopped = true;
  //     asciiCanvas.style.opacity = 0.4;
  //     dcDiv.style.opacity = 1;
  //     break;
  //   case -2:
  //     if (!isStopped) return;
  //     isStopped = false;
  //     asciiCanvas.style.opacity = 1;
  //     dcDiv.style.opacity = 0;
  //     break;
  // }
}

function inputLoad(param) {
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
    (type === 'video') ? video = createVideo(blob, initialize) : 
      (video = loadImage(blob, initialize), vidRef = new Image(), vidRef.src = blob);
  }
}

function initialize() {
  initializeEnd = false;
  counter = 0;
  
  if (type === 'video' || type === 'camera') 
    (video.hide(), video.volume(0), video.loop())
  init_vw = video.width; init_vh = video.height;
  changeWidth(); changeDensity();
  initializeEnd = true;
  
  if (frameCount === 0) return;
  if (type === 'camera') {
    fileInput.classList.remove('fileInputActive');
    webcamButton.classList.add('webcamButtonActive');
  } else if (type === 'video' || type === 'image') {
    webcamButton.classList.remove('webcamButtonActive');
    fileInput.classList.add('fileInputActive');
  }
}

function changeWidth() {
  changeFontSize();
}

function changeDensity() {
  let newW = int(densitySlider.value);
  let newH = int(newW / init_vw * init_vh);
  (type === 'video' || type === 'camera') ? 
    video.size(newW, newH) : 
    (video = loadImage(vidRef.src, () => video.resize(newW, newH)));
  savedFrame = createImage(newW, newH);
  changeFontSize();
}

function changeFontSize() {
  // at widthSlider.value === 100, 
  // the asciiCanvas fontSize is 16px
  asciiCanvas.style.fontSize = 16 * int(widthSlider.value)/1320 * 100/int(densitySlider.value) + 'px';
}

function mouseMoved() {
  if (video.elt.paused && video.volume() === 0) (video.elt.volume(1), video.elt.play());
}