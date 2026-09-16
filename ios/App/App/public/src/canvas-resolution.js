// Match the display's physical pixels without changing logical game coordinates.
// Cap large desktop/HiDPI buffers to keep mobile GPU memory under control.
export function canvasResolution(width,height,pixelRatio=1){
  const w=Math.max(1,width),h=Math.max(1,height);
  const density=Math.min(Math.max(1,pixelRatio),3,Math.sqrt(8_000_000/(w*h)));
  return {width:Math.max(1,Math.round(w*density)),height:Math.max(1,Math.round(h*density))};
}
export function smoothImages(context){context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';}
