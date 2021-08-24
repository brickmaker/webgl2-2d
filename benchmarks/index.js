const canvas2D = document.querySelector("#canvas");
const canvasWebGL = document.querySelector("#webgl");

const ctx2D = canvas2D.getContext("2d");
const ctxWebGL = canvasWebGL.getContext("webgl2-2d");

function timeTest(ctx, drawFunc, times) {
  const start = performance.now();
  for (let i = 0; i < times; i++) drawFunc(ctx);
  const end = performance.now();
  return end - start;
}

function drawRandomLine(ctx) {
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(
    Math.random() * ctx.canvas.width,
    Math.random() * ctx.canvas.height
  );
  ctx.lineTo(
    Math.random() * ctx.canvas.width,
    Math.random() * ctx.canvas.height
  );
  ctx.stroke();
}

function drawRandomBezier(ctx) {
  const data = {
    x1: Math.random() * ctx.canvas.width,
    y1: Math.random() * ctx.canvas.height,
    x2: Math.random() * ctx.canvas.width,
    y2: Math.random() * ctx.canvas.height,
    cp1x: Math.random() * ctx.canvas.width,
    cp1y: Math.random() * ctx.canvas.height,
    cp2x: Math.random() * ctx.canvas.width,
    cp2y: Math.random() * ctx.canvas.height,
  };
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(data.x1, data.y1);
  ctx.bezierCurveTo(data.cp1x, data.cp1y, data.cp2x, data.cp2y, data.x2, data.y2);
  ctx.stroke();
}

function benchmark(drawFunc, n) {
//   const canvasTime = timeTest(ctx2D, drawFunc, n);
  const webglTime = timeTest(ctxWebGL, drawFunc, n);
//   console.log(`canvas: ${canvasTime}ms`);
  console.log(`webgl: ${webglTime}ms`);
}

benchmark(drawRandomBezier, 10000);
