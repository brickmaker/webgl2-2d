const canvas2D = document.querySelector('#canvas')
const canvasWebGL = document.querySelector('#webgl')

const ctx2D = canvas2D.getContext('2d')
const ctxWebGL = canvasWebGL.getContext('webgl2-2d')

function drawLine(ctx) {
    ctx.lineWidth = 10

    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(100, 100)

    ctx.moveTo(30, 10)
    ctx.lineTo(50, 100)

    // V
    ctx.moveTo(80, 10)
    ctx.lineTo(100, 70)
    ctx.lineTo(120, 10)

    // L
    ctx.moveTo(130, 10)
    ctx.lineTo(130, 70)
    ctx.lineTo(150, 70)

    ctx.stroke()
}

drawLine(ctx2D)
drawLine(ctxWebGL)