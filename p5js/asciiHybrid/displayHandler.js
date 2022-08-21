// Draw video or image to canvas based on it's type and file format
function videoToCanvas() {
  const param = [video, 0,0, width,height];
  switch (type) {
    case 'video' || 'camera':
      image(...param);
      break;
    case 'image':
      switch (fileFormat) {
        case '.gif':
          image(...param);
          break;
        default:
          drawingContext.drawImage(...param);
          break;
      }
      break;
  }
}

function getFileFormat(name) {
  if (typeof(name) !== 'string') return;
  return name.slice(name.lastIndexOf('.'), name.length);
}