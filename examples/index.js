const canvas2D = document.querySelector('#canvas')
const canvasWebGL = document.querySelector('#webgl')

const ctx2D = canvas2D.getContext('2d')
const ctxWebGL = canvasWebGL.getContext('webgl2-2d')

function drawLine(ctx) {
    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.lineTo(100, 100)
    ctx.stroke()
}

drawLine(ctx2D)
drawLine(ctxWebGL)