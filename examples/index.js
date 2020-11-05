const canvas2D = document.querySelector('#canvas')
const canvasWebGL = document.querySelector('#webgl')

const ctx2D = canvas2D.getContext('2d')
const ctxWebGL = canvasWebGL.getContext('webgl2-2d')

function performDraw(draw) {
    draw(ctx2D)
    draw(ctxWebGL)
}

function drawLine(ctx) {

    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(100, 100)

    ctx.moveTo(30, 10)
    ctx.lineTo(50, 100)

    ctx.lineWidth = 2
    ctx.strokeStyle = 'blue'
    ctx.stroke()

    ctx.beginPath()
    // V
    ctx.moveTo(80, 10)
    ctx.lineTo(100, 70)
    ctx.lineTo(120, 10)

    // L
    ctx.moveTo(130, 10)
    ctx.lineTo(130, 70)
    ctx.lineTo(150, 70)
    ctx.lineTo(130, 10)
    ctx.closePath()
    ctx.lineTo(150, 10)

    ctx.lineWidth = 5
    ctx.strokeStyle = 'red'
    ctx.stroke()
}

function drawShape(ctx) {
    ctx.beginPath();

    ctx.moveTo(90, 50);
    ctx.lineTo(100, 100);
    ctx.lineTo(120, 80);

    ctx.fillStyle = 'red'
    ctx.fill();

    ctx.beginPath()

    ctx.moveTo(10, 10);
    ctx.lineTo(110, 10);
    ctx.lineTo(50, 40);
    ctx.lineTo(70, 60);
    ctx.lineTo(40, 80);

    ctx.fillStyle = 'blue'
    ctx.fill();
}

performDraw(drawLine)
// performDraw(drawShape)
