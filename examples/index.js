function createExample(draw, title, apis) {
    const div = document.createElement('div')

    div.className = 'example-block'

    const divMain = document.createElement('div')
    divMain.style = 'display: flex;'
    const div2D = document.createElement('div')
    const divWebGL = document.createElement('div')
    const canvas2D = document.createElement('canvas')
    const canvasWebGL = document.createElement('canvas')
    div2D.appendChild(canvas2D)
    let label = document.createElement('p')
    label.innerText = 'Canvas'
    label.className = 'canvas-label'
    div2D.append(label)
    divWebGL.appendChild(canvasWebGL)
    label = document.createElement('p')
    label.innerText = 'WebGL'
    label.className = 'canvas-label'
    divWebGL.append(label)


    divMain.append(div2D)
    divMain.append(divWebGL)
    div.append(divMain)
    const description = document.createElement('div')
    description.className = 'description-block'
    description.innerHTML = `
        <div class='description-title'>
            ${title}: ${apis && apis.map(api => `<pre class='code'>${api}</pre>`).join(', ')}
        </div>
    `
    // <p class='description-content'>${'description'}</>
    div.append(description)
    document.querySelector('#examples').appendChild(div)

    const ctx2D = canvas2D.getContext('2d')
    const ctxWebGL = canvasWebGL.getContext('webgl2-2d')
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

    ctx.moveTo(150, 70)
    ctx.quadraticCurveTo(250, 80, 150, 90)
    ctx.quadraticCurveTo(100, 100, 200, 110)

    ctx.stroke()
}

function drawWithTransform(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 150, 50)

    ctx.transform(1, 0.5, -0.5, 1, 30, 10);
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, 150, 50);

    ctx.transform(1, 0.5, -0.5, 1, 30, 10);
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, 150, 50);
}

function saveAndRestore(ctx) {
    // Save the default state
    ctx.save();

    ctx.fillStyle = 'green';

    ctx.scale(0.7, 0.2);

    ctx.fillRect(10, 50, 100, 100);

    // Restore the default state
    ctx.restore();

    ctx.fillRect(100, 40, 100, 100);
}

function pointInPath(ctx) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(20, 0)
    ctx.lineTo(100, 100)
    ctx.arc(50, 50, 50 * Math.sqrt(2), Math.PI / 4, Math.PI * 3 / 4)
    ctx.lineTo(80, 0)
    ctx.lineTo(100, 0)
    ctx.lineTo(20, 100)
    ctx.arc(50, 70, 30 * Math.sqrt(2), Math.PI * 3 / 4, Math.PI / 4, true)
    ctx.closePath()

    ctx.stroke()

    const points = [
        [20, 10], [50, 10], [80, 10], [110, 10],
        [30, 50], [50, 50], [80, 50],
        [50, 40],
        [50, 70],
        [50, 110], [50, 120]
    ]

    for (const [x, y] of points) {
        if (ctx.isPointInPath(x, y, 'nonzero')) {
            ctx.fillStyle = 'green'
        } else {
            ctx.fillStyle = 'red'
        }
        const size = 5
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
    }
}


function lineJoins(ctx) {
    ctx.strokeStyle = 'green'
    ctx.beginPath()
    ctx.moveTo(10, 50)
    ctx.lineTo(200, 50)
    ctx.moveTo(10, 100)
    ctx.lineTo(200, 100)
    ctx.stroke()

    ctx.strokeStyle = 'black'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(10, 75)
    ctx.lineTo(90, 100)
    ctx.lineTo(130, 50)
    ctx.lineTo(150, 100)
    ctx.lineTo(160, 50)
    ctx.lineTo(170, 100)
    ctx.lineTo(180, 50)

    ctx.stroke()

    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(210, 75)
    ctx.lineTo(250, 50)
    ctx.lineTo(250, 100)
    ctx.closePath()

    ctx.stroke()
}

function drawLineCaps(ctx) {
    ctx.strokeStyle = 'green'
    ctx.beginPath()
    ctx.moveTo(10, 50)
    ctx.lineTo(200, 50)
    ctx.moveTo(10, 100)
    ctx.lineTo(200, 100)
    ctx.stroke()

    ctx.strokeStyle = 'black'
    ctx.lineWidth = 20

    ctx.lineCap = 'butt'
    ctx.beginPath()
    ctx.moveTo(60, 50)
    ctx.lineTo(60, 100)
    ctx.stroke()

    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(110, 50)
    ctx.lineTo(110, 100)
    ctx.stroke()

    ctx.lineCap = 'square'
    ctx.beginPath()
    ctx.moveTo(160, 50)
    ctx.lineTo(160, 100)
    ctx.stroke()

    ctx.lineCap = 'round'
    ctx.lineWidth = 15
    ctx.beginPath()
    ctx.moveTo(220, 50)
    ctx.lineTo(240, 75)
    ctx.lineTo(220, 100)
    ctx.stroke()
}

function drawHeart(ctx) {
    ctx.beginPath();
    ctx.moveTo(75, 40);
    ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
    ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
    ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
    ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
    ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
    ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
    ctx.clip()

    /*
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, ctx.canvas.height)
    ctx.lineTo(ctx.canvas.width, ctx.canvas.height)
    ctx.lineTo(ctx.canvas.width, 0)
    ctx.clip()

    ctx.fillRect(10, 10, 100, 100)
    */

    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function drawImage(ctx) {
    const image = new Image()
    image.onload = () => {
        // ctx.drawImage(image, 120, 20)
        // ctx.drawImage(image, 120, 20, 80, 100)
        ctx.drawImage(image, 100, 100, 400, 500, 120, 20, 80, 100)
    }
    image.src = './images/liubei.jpg'
}

function pixelManipulation(ctx) {

    const printPixel = (imageData) => {
        const { data, width, height } = imageData
        const res = []
        for (let i = 0; i < data.length; i += 4) {
            res.push([data[i], data[i + 1], data[i + 2], data[i + 3]])
        }
        console.log(width, height)
        console.log(res)
    }

    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 75)
    ctx.fillStyle = 'green'
    ctx.fillRect(100, 0, 100, 75)
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 75, 100, 75)
    ctx.fillStyle = 'cyan'
    ctx.fillRect(100, 75, 100, 75)

    const pixels1 = ctx.getImageData(10, 10, 1, 1)
    const pixels2 = ctx.getImageData(120, 10, 1, 1)
    const pixels3 = ctx.getImageData(0, 80, 1, 1)
    const pixels4 = ctx.getImageData(120, 80, 1, 1)
    const pixels5 = ctx.getImageData(98, 73, 4, 4)
    const pixels6 = ctx.getImageData(60, 45, 80, 60)
    printPixel(pixels1)
    printPixel(pixels2)
    printPixel(pixels3)
    printPixel(pixels4)
    printPixel(pixels5)

    ctx.putImageData(pixels6, 210, 20)
    ctx.putImageData(pixels6, 190, 90, 20, 10, 30, 40)

    const pixels7 = ctx.createImageData(30, 40)

    for (let r = 0; r < 40; r++) {
        for (let c = 0; c < 30; c++) {
            pixels7.data[(r * 30 + c) * 4] = 255 * (40 - r) / 40
            pixels7.data[(r * 30 + c) * 4 + 1] = 255 * r / 40
            pixels7.data[(r * 30 + c) * 4 + 2] = 0
            pixels7.data[(r * 30 + c) * 4 + 3] = 255
        }
    }

    ctx.putImageData(pixels7, 250, 90)
}

createExample(drawLine, 'Basic Lines', ['moveTo()', 'lineTo()', 'stroke()'])
createExample(drawShape, 'Shapes', ['lineTo()', 'fill()'])
createExample(drawRect, 'Rectangles', ['fillRect()', 'clearRect()', 'strokeRect()'])
// performDraw(drawPathRect)
createExample(drawCurve, 'Curves', ['arc()', 'arcTo()', 'bezierCurveTo()', 'quadraticCurveTo()'])
createExample(drawWithTransform, 'Transforms', ['transform()', 'translate()', 'rotate()', 'scale()'])
createExample(saveAndRestore, 'State', ['save()', 'restore()'])
createExample(pointInPath, 'PointInPath', ['pointInPath()'])
createExample(lineJoins, 'LineJoin', ['bevel', 'round', 'mitter'])
createExample(drawLineCaps, 'LineCap', ['butt', 'round', 'square'])
createExample(drawHeart, 'Clip space', ['clip()'])
createExample(drawImage, 'Images', ['drawImage()'])
createExample(pixelManipulation, 'Pixel manipulation', ['createImageData()', 'getImageData()', 'putImageData()'])