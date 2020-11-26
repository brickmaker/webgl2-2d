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

function drawRect(ctx) {
    ctx.lineWidth = 5;
    ctx.fillRect(25, 25, 100, 100);
    ctx.fillRect(50, 50, 120, 120);
    ctx.clearRect(40, 40, 70, 70);
    ctx.strokeRect(50, 50, 50, 50);
}

function drawPathRect(ctx) {
    ctx.lineWidth = 5;
    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(20, 20)
    ctx.rect(50, 50, 120, 50)
    ctx.lineTo(80, 30)
    ctx.stroke()
    // ctx.fill()
}

function drawCurve(ctx) {
    ctx.beginPath()
    ctx.arc(75, 75, 50, 0, Math.PI * 2, true)
    ctx.moveTo(110, 75);
    ctx.arc(75, 75, 35, 0, Math.PI, false);

    ctx.moveTo(40, 60);
    ctx.bezierCurveTo(60, 40, 80, 80, 110, 60)

    ctx.moveTo(180, 50)
    ctx.arcTo(280, 50, 250, 80, 30)

    ctx.stroke()
}

// performDraw(drawLine)
// performDraw(drawShape)
// performDraw(drawRect)
// performDraw(drawPathRect)
performDraw(drawCurve)
