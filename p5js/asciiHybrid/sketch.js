const acceptedFormats = `
  .png, .jpg, .jpeg, .webp, .svg, .gif,
  .mp4, .webm, .bmp, .3gp, .av1, .mov`;
document.getElementById("fileInput").accept = acceptedFormats;

// Set of characters that will be displayed
const chars = 'Ñ@#W$9876543210?!abc;:+=-,._                    ';

// Customization
let walk = false;
let cameraMode = false;
let colorize = false;
let flipChars = false;

// In case the slider removed by unknown creatures
let density = 0;
let outputWidth = 0;

// For walk customization
let counter = 0;

// This variable will be false after the first successful video loaded
let whack = true;

let method = grayscale_yuv;
let video, fileFormat, isStopped, type, lastGrayValue;

function setup() {
  firstTimer();
  (min(screen.width, screen.height) < 400) ? 
    (densitySlider.max = '60', densitySlider.value = '20') : 
    (densitySlider.value = '40');
  widthSlider.value = window.innerWidth * 3/4;
  widthSlider.max = window.outerWidth;
  pixelDensity(1);
}

function draw() {
  if (!video) return;
  if (
    (type === 'image' && fileFormat !== '.gif' && !video.complete) || 
    ((type === 'camera' || type === 'video') && video.elt.readyState !== 4)
  ) return;
  
  if (!isStopped) {
    videoToCanvas();
    loadPixels();

    let asciiImage = (!colorize) ? '<span>' : '';
    for (let y = 0; y < height; y++) {
      lastGrayValue = -1;
      for (let x = 
           (!cameraMode) ? 0 : width-1; 
           (!cameraMode) ? x < width : x >= 0; 
           (!cameraMode) ? x++ : x--) {
        
        // Get RGB value of the canvas pixel at location (x, y)
        const pixIndex = (x + y * width) * 4;
        const r = pixels[pixIndex];
        const g = pixels[pixIndex+1];
        const b = pixels[pixIndex+2];

        // Current rgb to grayscale conversion use the average method
        const grayValue = method(r, g, b);
        
        const charIndex = (!flipChars) ?
          map(grayValue, 0, 255, chars.length-1, 0) :
          map(grayValue, 0, 255, 0, chars.length-1);
        
        let c = (!walkCheckbox.checked) ?
          chars.charAt(charIndex) :
          chars.charAt(int(charIndex + counter / 6) % chars.length);
        
        if (c === ' ') c = (!colorize) ? '&nbsp' : "·";
        
        // Create <span> with specific color at the cost of performance
        // It will lag especially when the density value is high. Output width doesn't affect that much
        if (colorize) {
          if (lastGrayValue !== grayValue) {
            if (lastGrayValue !== -1) asciiImage += '</span>';
            asciiImage += 
              `<span style="color: rgb(${r},${g},${b})">` 
          }
        }
        
        asciiImage += c;
        if (colorize) {
          if (!cameraMode && x === width-1) asciiImage += '</span>';
          else if (cameraMode && x === 0) asciiImage += '</span>';
        }
        lastGrayValue = grayValue;
      }
      asciiImage += '<br>';
    }
    
    // If colorize is true, the default text-color will be black.
    // It will save spaces rather than create so many span with black color which is pointless,
    // since the background color is also black.
    
    if (colorize && asciiCanvas.style.color === '#fff') asciiCanvas.style.color = '#000';
    if (!colorize && asciiCanvas.style.color === '#000') asciiCanvas.style.color = '#fff';
    asciiCanvas.innerHTML = (!colorize) ? asciiImage + '</span>' : asciiImage; 
  }
  
  if (type !== 'image' && video.elt.paused) isStopped = true;
  if (type === 'image' && !walkCheckbox.checked && fileFormat !== '.gif') isStopped = true;
  if (!isStopped) counter = (counter + 1) % (chars.length * 6);
}

function grayscale_yuv(R, G, B) {
  const Y = 0.2126*R + 0.7152*G + 0.0722*B;
  return Y;
}

function grayscale_average(R, G, B) {
  const avg = (R+G+B)/3;
  return avg;
}

function inputLoad(param) {
  let t = '', tempFileFormat;
  if (param === 'camera') t = param;
  else {
    t = param.type.slice(0, 5);
    tempFileFormat = getFileFormat(param.name.toLowerCase());
    if (!acceptedFormats.includes(tempFileFormat)) return;
  }
  if (t === '' ) return;
  
  // Remove all elements that has class "videoDisplay" so there will be no duplicate of it
  let videos = document.getElementsByClassName('videoDisplay');
  for (let i = 0; i < videos.length; i++) videos[i].remove();
  
  let blob,  // the source of video or image 
      lastType = type; type = t;
  
  fileFormat = tempFileFormat;
  if (type !== 'camera') {
    blob = URL.createObjectURL(param);

    // Change text beside choose file button as the file name
    const endFirstSlice = 1 + 3 + fileFormat.length;
    const startSecondSlice = param.name.length - fileFormat.length - 3;

    inputButtonText.innerHTML = (param.name.length < 15) ?
      param.name :
      param.name.slice(0, endFirstSlice-1) + '…' + param.name.slice(startSecondSlice, param.name.length);
  }
    
  switch (type) {
    case 'camera':
      fileInput.value = ''; video = createCapture(VIDEO, initialize);
      break;
    case 'video':
      video = createVideo(blob, initialize);
      break;
    case 'image':
      switch (fileFormat) {
        case '.gif':
          video = loadImage(blob, initialize);
          break;
        default:
          video = new Image(); video.addEventListener('load', initialize); video.src = blob;
          break;
      }
      break;
  }
}

function initialize() {
  counter = 0;
  isStopped = false;
  
  if (type === 'video' || type === 'camera') 
    (video.elt.classList.add('videoDisplay'), 
    (whack) ? video.elt.volume = 0 : video.elt.volume = 1, 
    video.elt.addEventListener('play', () => isStopped && (isStopped = false), 
    video.elt.loop = true, video.elt.play()));
  changeDensity(densitySlider.value); changeWidth(widthSlider.value);
  
  if (whack) whack = false;
  
  (type === 'camera') ? 
    (video.elt.classList.add('isCamera'),
    inputButtonText.classList.remove('fileInputActive'),
    webcamButton.classList.add('webcamButtonActive')) 
  : 
    ((type === 'image') && 
    ((fileFormat !== '.gif') ? 
      (video.classList.add('videoDisplay'), document.body.appendChild(video)) :
      (video.canvas.classList.add('videoDisplay'), document.body.appendChild(video.canvas))),
    webcamButton.classList.remove('webcamButtonActive'),
    inputButtonText.classList.add('fileInputActive'));
}

function changeDensity(value) {
  density = int(value);
  let newW = density;
  let newH = int((type !== 'image' || fileFormat === '.gif') ? 
              newW / video.width * video.height : 
              newW / video.naturalWidth * video.naturalHeight);
  (typeof(canvas) === 'undefined') ? (createCanvas(newW, newH)) : resizeCanvas(newW, newH);
  changeFontSize();
}

function changeWidth(value) { outputWidth = int(value); changeFontSize(); }

function switchStopped() {
  if (
    (type === 'image' && fileFormat !== '.gif' && video.complete) || 
    (type === 'camera' || type === 'video' && video.elt.paused && video.elt.readyState === 4)
  ) 
    isStopped = false;
}

function changeFontSize() {
  asciiCanvas.style.fontSize = 16 * 100/int(density) * int(outputWidth)/1320 + 'px';
}

function firstTimer() {
  if (whack) (type = 'video', video = createVideo('bird.mp4', initialize));
}

function mousePressed() {  firstTimer(); }
function touchStarted() {  firstTimer(); }