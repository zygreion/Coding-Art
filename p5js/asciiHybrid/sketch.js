const chars = 'Ñ@#W$9876543210?!abc;:+=-,._                    ';
let counter = 0;

// Customization
let walk = false;
let cameraMode = false;
let colorize = false;
let flipChars = false;

let whack = true;

let video, isStopped, type, lastAvg;

function setup() {
  (type = 'video', video = createVideo('bird.mp4', initialize));
  densitySlider.value = '40';
  widthSlider.value = window.innerWidth * 3/4;
  widthSlider.max = window.outerWidth;
}

function draw() {  
  if (!video) return;
  if (
    (type === 'image' && !video.complete) || 
    ((type === 'camera' || type === 'video') && video.elt.readyState !== 4)
  ) return;
  
  if (!isStopped) {
    (type !== 'image') ? 
      image(video, 0,0, width,height) :
      drawingContext.drawImage(video, 0,0, width,height);

    loadPixels();

    let asciiImage = '';
    for (let y = 0; y < height; y++) {
      lastAvg = -1;
      for (let x = 
           (!cameraMode) ? 0 : width-1; 
           (!cameraMode) ? x < width : x >= 0; 
           (!cameraMode) ? x++ : x--) {
        const pixIndex = (x + y * width) * 4;
        const r = pixels[pixIndex];
        const g = pixels[pixIndex+1];
        const b = pixels[pixIndex+2];

        const avg = (r+g+b) / 3;
        const charIndex = map(avg, 0, 255, 
                              (!flipChars) ? chars.length-1 : 0, 
                              (!flipChars) ? 0 : chars.length-1);
        let c = chars.charAt((!walkCheckbox.checked) ? charIndex : int(charIndex + counter/6) % chars.length);
        if (c === ' ') (c = (!colorize) ? '&nbsp' : "^");
        if (colorize) {
          if (avg <= 3) c = '&nbsp';
          if (lastAvg !== avg) {
            if (x > 0) asciiImage += '</span>';
            asciiImage += (avg > 3) ? `<span style="color: rgb(${r},${g},${b})">` : '<span>';
          }
        }
        
        asciiImage += c;
        if (colorize && x === width-1) asciiImage += '</span>';
        lastAvg = avg;
      }
      asciiImage += '<br>';
    }
  
    if (colorize && asciiCanvas.style.color === '#fff') asciiCanvas.style.color = '#000';
    if (!colorize && asciiCanvas.style.color === '#000') asciiCanvas.style.color = '#fff';
    asciiCanvas.innerHTML = asciiImage; 
  }
  
  if (type !== 'image' && video.elt.paused) isStopped = true;
  if (type === 'image' && !walkCheckbox.checked) isStopped = true;
  if (!isStopped) counter = (counter + 1) % (chars.length * 6);
}

function inputLoad(param) {
  let videos = (type !== 'image') ? document.getElementsByTagName('VIDEO') : document.getElementsByTagName('IMG');
  if (videos.length > 0) videos[0].remove();
  let t;
  t = (param === 'camera') ? param : t = param.type.slice(0, 5);
  
  if (t === '') return;
  
  let blob, lastType = type; type = t; 
  if (type !== 'camera') blob = URL.createObjectURL(param);

  if (type === 'camera') (lastType === type) ? (0) : (fileInput.value = '', video = createCapture(VIDEO, initialize));
  else if (type === 'video') video = createVideo(blob, initialize);
  else if (type === 'image') (video = new Image(), video.addEventListener('load', initialize), video.src = blob);
}

function initialize() {
  counter = 0;
  isStopped = false;
  
  if (type === 'video' || type === 'camera') 
    (video.elt.classList.add('videoDisplay'), 
    (whack) ? video.elt.volume = 0 : video.elt.volume = 1, 
    video.elt.addEventListener('play', () => isStopped && (isStopped = false), 
    video.elt.loop = true, video.elt.play()));
  changeFontSize(); changeDensity(densitySlider.value); 
  
  (type === 'camera') ? 
    (video.elt.classList.add('isCamera'),
    fileInput.classList.remove('fileInputActive'),
    webcamButton.classList.add('webcamButtonActive')) 
  : 
    ((type === 'image') && (video.classList.add('videoDisplay'), document.body.appendChild(video)),
    webcamButton.classList.remove('webcamButtonActive'),
    fileInput.classList.add('fileInputActive'));
  
  if (whack) whack = false;
}

function changeDensity(newW) {
  newW = int(newW);
  let newH = int((type !== 'image') ? 
              newW / video.width * video.height : 
              newW / video.naturalWidth * video.naturalHeight);
  (typeof(canvas) === 'undefined') ? (createCanvas(newW, newH)) : resizeCanvas(newW, newH);
  changeFontSize();
}

function changeWidth() {  changeFontSize(); }

function switchStopped() {
  if (
    (type === 'image' && video.complete) || 
    (type === 'camera' || type === 'video' && video.elt.paused && video.elt.readyState === 4)
  ) 
    isStopped = false;
}

function changeFontSize() {
  asciiCanvas.style.fontSize = 16 * 100/int(densitySlider.value) * int(widthSlider.value)/1320 + 'px';
}

function mousePressed() {  if (whack) (type = 'video', video = createVideo('bird.mp4', initialize)); }
function touchStarted() {  if (whack) (type = 'video', video = createVideo('bird.mp4', initialize)); }