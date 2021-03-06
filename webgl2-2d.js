((() => {
    class Path {
        constructor(ctx) {
            this.paths = []
            this.ctx = ctx
        }

        rect(x, y, width, height) {
            this.paths.push([
                [x, y],
                [x, y + height],
                [x + width, y + height],
                [x + width, y],
            ])
            this.paths[this.paths.length - 1].closed = true
        }

        arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
            const arcPath = createArc(x, y, radius, startAngle, endAngle, 30, anticlockwise)
            const last = this.paths.length - 1
            if (last >= 0)
                this.paths[last] = this.paths[last].concat(arcPath.slice(1)) // concat, remove duplicate arc start point
            else
                this.paths.push(arcPath)
        }

        arcTo(x1, y1, x2, y2, radius) {
            const last = this.paths.length - 1
            if (this.paths[last].closed) {
                // path closed at start point
                const [x0, y0] = this.paths[last][0]
                const path = createTangentArc(x0, y0, x1, y1, x2, y2, radius)
                this.paths.push(path)
            } else {
                const [x0, y0] = this.paths[last][this.paths[last].length - 1] // last point
                const path = createTangentArc(x0, y0, x1, y1, x2, y2, radius)
                this.paths[last] = this.paths[last].concat(path)
            }
        }

        moveTo(x, y) {
            this.paths.push([[x, y]])
        }

        lineTo(x, y) {
            const last = this.paths.length - 1
            if (this.paths[last].closed) {
                // path closed at start point
                const prevPoint = this.paths[last][0].slice()
                this.paths.push([prevPoint, [x, y]])
            } else {
                this.paths[last].push([x, y])
            }
        }

        bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
            const last = this.paths.length - 1
            if (this.paths[last].closed) {
                // path closed at start point
                const startPoint = this.paths[last][0].slice()
                const path = createBezier(startPoint, [cp1x, cp1y], [cp2x, cp2y], [x, y], 30)
                this.paths.push(path)
            } else {
                const startPoint = this.paths[last][this.paths[last].length - 1].slice() // last point
                const path = createBezier(startPoint, [cp1x, cp1y], [cp2x, cp2y], [x, y], 30)
                this.paths[last] = this.paths[last].concat(path.splice(1)) // prevent duplicate join point
            }
        }
        quadraticCurveTo(cpx, cpy, x, y) {
            const last = this.paths.length - 1
            if (this.paths[last].closed) {
                // path closed at start point
                const startPoint = this.paths[last][0].slice()
                const path = createQuadratic(startPoint, [cpx, cpy], [x, y], 30)
                this.paths.push(path)
            } else {
                const startPoint = this.paths[last][this.paths[last].length - 1].slice() // last point
                const path = createQuadratic(startPoint, [cpx, cpy], [x, y], 30)
                this.paths[last] = this.paths[last].concat(path.splice(1)) // prevent duplicate join point
            }
        }

        closePath() {
            const last = this.paths.length - 1
            const startPoint = [this.paths[last][0][0], this.paths[last][0][1]]
            const lastIdx = this.paths[last].length - 1
            const lastPoint = [this.paths[last][lastIdx][0], this.paths[last][lastIdx][1]]
            if (startPoint[0] === lastPoint[0] && startPoint[1] === lastPoint[1]) {
                // remove duplicate point
                this.paths[last].pop()
            }

            // NOTE: hack, add closed attribute to array
            this.paths[last].closed = true
        }

        getStrokeBufferData() {
            let positions = []
            let indices = []
            const width = this.ctx.lineWidth
            const lineJoin = this.ctx.lineJoin
            const lineCap = this.ctx.lineCap
            for (const path of this.paths) {
                if (path.length < 2) continue
                const indexOffset = positions.length / 2 // index offset when combine all path's position and index, divided by 2: 2 term (x, y) mapping to 1 index
                const pathData = getPathStrokeBufferData(path, width, path.closed, indexOffset, lineJoin, lineCap)
                positions = positions.concat(pathData.positions)
                indices = indices.concat(pathData.indices)
            }
            return {
                positions,
                indices
            }
        }

        getShapeBufferData() {
            let positions = []
            let indices = []
            for (const path of this.paths) {
                const indexOffset = positions.length / 2 // index offset when combine all path's position and index, divided by 2: 2 term (x, y) mapping to 1 index
                const data = getPathShapeBufferData(path, indexOffset)
                positions = positions.concat(data.positions)
                indices = indices.concat(data.indices)
            }
            return {
                positions,
                indices
            }
        }
    }

    class ImageData {
        constructor(width, height, data) {
            this.width = width
            this.height = height
            this.data = data

            if (!this.data) {
                this.data = new Uint8Array(width * height * 4)
            }
        }
    }

    class CanvasGradient {
        constructor() {
            this.stops = []
        }

        addColorStop(offset, color) {
            this.stops.push({
                offset,
                color: colorParser(color)
            })
        }
        imageData(width, height) { }
    }

    class CanvasLinearGradient extends CanvasGradient {
        constructor(x1, y1, x2, y2) {
            super()
            this.x1 = x1
            this.y1 = y1
            this.x2 = x2
            this.y2 = y2
        }

        imageData(width, height) {
            const imageData = new ImageData(width, height)
            const [x1, x2, y1, y2] = [this.x1, this.x2, this.y1, this.y2]
            const normal = normalize([x2 - x1, y2 - y1])
            // const dirX = x2 - x1
            // const dirY = y2 - y1
            const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            const tableLen = parseInt(Math.sqrt(width ** 2 + height ** 2))
            const colorTable = new Array(tableLen).fill(0)
            this.stops.sort((a, b) => {
                return a.offset - b.offset
            })
            for (let i = 0; i < this.stops.length - 1; i++) {
                const grad1 = this.stops[i]
                const grad2 = this.stops[i + 1]
                for (let p = parseInt((grad1.offset * tableLen)); p <= parseInt((grad2.offset * tableLen)); p++) {
                    const k = (p - parseInt((grad1.offset * tableLen))) / ((grad2.offset - grad1.offset) * tableLen)
                    colorTable[p] = lerpColor(grad1.color, grad2.color, k)
                }
            }
            for (let r = 0; r < height; r++) {
                for (let c = 0; c < width; c++) {
                    // translate
                    let xx = c - x1
                    let yy = r - y1
                    // rotate
                    // let xxx = dirX * xx + dirY * yy
                    let xxx = normal[0] * xx + normal[1] * yy
                    // let yyy = -normal[1] * xx + normal[0] * yy
                    // scale
                    xxx /= length

                    const colorTableIdx = Math.min(Math.max(parseInt(xxx * tableLen), 0), tableLen - 1);

                    imageData.data[(r * width + c) * 4] = parseInt(colorTable[colorTableIdx].r * 255)
                    imageData.data[(r * width + c) * 4 + 1] = parseInt(colorTable[colorTableIdx].g * 255)
                    imageData.data[(r * width + c) * 4 + 2] = parseInt(colorTable[colorTableIdx].b * 255)
                    imageData.data[(r * width + c) * 4 + 3] = parseInt(colorTable[colorTableIdx].a * 255)
                }
            }
            return imageData
        }
    }

    class CanvasRadialGradient extends CanvasGradient {
        constructor(x1, y1, r1, x2, y2, r2) {
            super()
            this.x1 = x1
            this.y1 = y1
            this.r1 = r1
            this.x2 = x2
            this.y2 = y2
            this.r2 = r2
        }

        imageData(width, height) {
            // TODO: ...
            const imageData = new ImageData(width, height)
            const [x1, y1, r1, x2, y2, r2] = [this.x1, this.y1, this.r1, this.x2, this.y2, this.r2]
        }
    }

    class WebGL2RenderingContext2D {
        constructor(canvas) {
            this._renderer = new Renderer(canvas)

            this._width = canvas.width
            this._height = canvas.height

            this._zIdx = 0 // NOTE: z offset of geometry, due to three's geometry limitation, not need when using pure WebGL

            this._path = null

            /*
            consider WebGL's uniforms
            4d, column major
            [
                a, b, 0, 0,
                c, d, 0, 0,
                0, 0, 1, 0,
                e, f, 0, 1,
            ]
            */
            this._transform = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]

            this._stateStack = []

            // public attributes
            this.canvas = canvas

            this.lineWidth = 1
            this.lineJoin = 'miter'
            this.lineCap = 'butt'

            this._strokeStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
            this._fillStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
        }

        _createGradientTexture(gradient, width, height) {
            // TODO: ...
        }

        _createGradientImageData(gradient, width, height) {
            // TODO: bad implementation, create texture instead
            // TODO: need refactor
            if (gradient.type === 'linear') {
            } else if (gradient.type === 'radial') {
                const imageData = new ImageData(width, height)
                const { x1, x2, y1, y2 } = gradient
                const normal = normalize([x2 - x1, y2 - y1])
                // const dirX = x2 - x1
                // const dirY = y2 - y1
                const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                const tableLen = parseInt(Math.sqrt(width ** 2 + height ** 2))
                const colorTable = new Array(tableLen).fill(0)
                gradient.stops.sort((a, b) => {
                    return a.offset - b.offset
                })
                for (let i = 0; i < gradient.stops.length - 1; i++) {
                    const grad1 = gradient.stops[i]
                    const grad2 = gradient.stops[i + 1]
                    for (let p = parseInt((grad1.offset * tableLen)); p <= parseInt((grad2.offset * tableLen)); p++) {
                        const k = (p - parseInt((grad1.offset * tableLen))) / ((grad2.offset - grad1.offset) * tableLen)
                        colorTable[p] = lerpColor(grad1.color, grad2.color, k)
                    }
                }
                for (let r = 0; r < height; r++) {
                    for (let c = 0; c < width; c++) {
                        // translate
                        let xx = c - x1
                        let yy = r - y1
                        // rotate
                        // let xxx = dirX * xx + dirY * yy
                        let xxx = normal[0] * xx + normal[1] * yy
                        // let yyy = -normal[1] * xx + normal[0] * yy
                        // scale
                        xxx /= length

                        const colorTableIdx = Math.min(Math.max(parseInt(xxx * tableLen), 0), tableLen - 1);

                        imageData.data[(r * width + c) * 4] = parseInt(colorTable[colorTableIdx].r * 255)
                        imageData.data[(r * width + c) * 4 + 1] = parseInt(colorTable[colorTableIdx].g * 255)
                        imageData.data[(r * width + c) * 4 + 2] = parseInt(colorTable[colorTableIdx].b * 255)
                        imageData.data[(r * width + c) * 4 + 3] = parseInt(colorTable[colorTableIdx].a * 255)
                    }
                }
                return imageData
            }
        }

        _draw(positions, indices, fillStyle) {
            if (fillStyle instanceof CanvasGradient) {
                // TODO: maybe not work with transform?
                const texCoords = positions.map((v, i) => {
                    return i % 2 == 0 ? v / this._width : v / this._height
                })
                // const imageData = this._createGradientImageData(fillStyle, this._width, this._height)
                const imageData = fillStyle.imageData(this._width, this._height)
                this._renderer.drawTexture(
                    positions,
                    indices,
                    texCoords,
                    createTextureFromUint8Array(this._renderer.gl, imageData.data, this._renderer.gl.RGBA, this._width, this._height)
                )
            } else {
                this._renderer.draw(positions, indices, [fillStyle.r, fillStyle.g, fillStyle.b, fillStyle.a])
            }
        }

        // API
        beginPath() {
            this.path = new Path(this)
        }

        closePath() {
            this.path.closePath()
        }

        moveTo(x, y) {
            // TODO: consider call moveTo without beginPath
            this.path.moveTo(x, y)
        }

        lineTo(x, y) {
            this.path.lineTo(x, y)
        }

        arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
            this.path.arc(x, y, radius, startAngle, endAngle, anticlockwise)
        }

        arcTo(x1, y1, x2, y2, radius) {
            this.path.arcTo(x1, y1, x2, y2, radius)
        }

        bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
            this.path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
        }

        quadraticCurveTo(cpx, cpy, x, y) {
            this.path.quadraticCurveTo(cpx, cpy, x, y)
        }

        stroke() {
            const { positions, indices } = this.path.getStrokeBufferData()
            this._draw(positions, indices, this._strokeStyle)
        }

        clip(path, fillStyle) {
            // TODO: support specify path and fillStyle
            // TODO: save/restore
            this._renderer.prepareStencil()
            this.fill()
            this._renderer.useStencil()
        }

        rect(x, y, width, height) {
            this.path.rect(x, y, width, height)
        }

        fill() {
            const { positions, indices } = this.path.getShapeBufferData()
            this._draw(positions, indices, this._fillStyle)
        }

        fillRect(x, y, width, height) {
            const { positions, indices } = generateRectBufferData(x, y, width, height)
            this._draw(positions, indices, this._fillStyle)
        }

        strokeRect(x, y, width, height) {
            const rectPath = new Path(this)
            rectPath.rect(x, this._height - y - height, width, height)
            const { positions, indices } = rectPath.getStrokeBufferData()
            this._draw(positions, indices, this._strokeStyle)
        }

        clearRect(x, y, width, height) {
            const { positions, indices } = generateRectBufferData(x, y, width, height)
            const transparent = { r: 0, g: 0, b: 0, a: 0 }
            this._draw(positions, indices, transparent)
        }


        // Transformations
        transform(a, b, c, d, e, f) {
            const newMat = [
                a, b, 0, 0,
                c, d, 0, 0,
                0, 0, 1, 0,
                e, f, 0, 1
            ]
            // NOTE: post-multiply!!
            // it's not directly transform shapes, it's canvas!
            this._transform = mat4Multiply(this._transform, newMat)
            this._renderer.setTransform(this._transform)
        }


        setTransform(a, b, c, d, e, f) {
            this._transform = [
                a, b, 0, 0,
                c, d, 0, 0,
                0, 0, 1, 0,
                e, f, 0, 1
            ]
            this._renderer.setTransform(this._transform)
        }

        translate(x, y) {
            this.transform(1, 0, 0, 1, x, y)
        }

        rotate(angle) {
            this.transform(
                Math.cos(angle),
                Math.sin(angle),
                -Math.sin(angle),
                Math.cos(angle),
                0,
                0
            )
        }

        scale(x, y) {
            this.transform(x, 0, 0, y, 0, 0)
        }

        // save & restore states
        /*
            Each context maintains a stack of drawing states. Drawing states consist of:
    
            * The current transformation matrix.
            * The current clipping region.
            * The current values of the following attributes: strokeStyle, fillStyle, globalAlpha, lineWidth, lineCap, lineJoin, miterLimit, shadowOffsetX, shadowOffsetY, shadowBlur, shadowColor, globalCompositeOperation, font, textAlign, textBaseline.
    
            The current path and the current bitmap are not part of the drawing state. The current path is persistent, and can only be reset using the beginPath() method. The current bitmap is a property of the canvas, not the context.
        */

        save() {
            this._stateStack.push({
                transform: this._transform.slice(),

                strokeStyle: this._strokeStyle,
                fillStyle: this._fillStyle,
                lineWidth: this.lineWidth
            })
        }

        restore() {
            if (this._stateStack.length === 0) return;
            const state = this._stateStack.pop()

            this._transform = state.transform
            this._renderer.setTransform(this._transform)

            this._strokeStyle = state.strokeStyle
            this._fillStyle = state.fillStyle
            this.lineWidth = state.lineWidth
        }

        isPointInPath(x, y, fillRule) {
            // TODO: support pass path: isPointInPath(path, x, y, fillRule)
            if (this.path.paths.length === 0)
                return false
            const currPath = this.path.paths[this.path.paths.length - 1].slice()
            if (currPath.length === 0)
                return false

            // close path
            const startPoint = [currPath[0][0], currPath[0][1]]
            const lastIdx = currPath.length - 1
            const lastPoint = [currPath[lastIdx][0], currPath[lastIdx][1]]
            if (startPoint[0] === lastPoint[0] && startPoint[1] === lastPoint[1]) {
                currPath.pop()
            }
            return pointInPolygon(currPath, x, y, fillRule)
        }

        drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
            if (arguments.length === 3) {
                this._renderer.drawImage(image, 0, 0, image.width, image.height, sx, sy, image.width, image.height)
            } else if (arguments.length === 5) {
                this._renderer.drawImage(image, 0, 0, image.width, image.height, sx, sy, sWidth, sHeight)
            } else if (arguments.length === 9) {
                this._renderer.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            } else {
                throw new Error('Invalid parameters')
            }
        }


        // pixel manipulation

        getImageData(sx, sy, sw, sh) {
            return this._renderer.getImageData(sx, sy, sw, sh)
        }

        putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
            this._renderer.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight)
        }

        createImageData(width, height) {
            if (arguments.length === 1) {
                const imageData = width
                width = imageData.width
                height = imagedata.height
            }
            return {
                width,
                height,
                data: new Uint8ClampedArray(width * height * 4)
            }
        }

        // gradient

        createLinearGradient(x1, y1, x2, y2) {
            return new CanvasLinearGradient(x1, y1, x2, y2)
        }

        createRadialGradient(x1, y1, r1, x2, y2, r2) {
            return new CanvasRadialGradient(x1, y1, r1, x2, y2, r2)
        }


        set fillStyle(style) {
            if (style instanceof CanvasGradient) {
                this._fillStyle = style
            } else {
                this._fillStyle = colorParser(style)
            }
        }

        get fillStyle() {
            // TODO: format
            return this._fillStyle
        }

        set strokeStyle(style) {
            if (style instanceof CanvasGradient) {
                this._strokeStyle = style
            } else {
                this._strokeStyle = colorParser(style)
            }
        }

        get strokeStyle() {
            // TODO: format
            return this._strokeStyle
        }
    }

    // mixin getContext
    const originGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (contextType) {
        if (contextType === 'webgl2-2d') {
            return new WebGL2RenderingContext2D(this) // TODO: consider arguments
        } else {
            return originGetContext.apply(this, arguments) // TODO: ..
        }
    }
})()) // TODO: more proper way