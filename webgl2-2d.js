((() => {
    class Path {
        constructor(ctx) {
            this.paths = []
            this.ctx = ctx
        }

        rect(x, y, width, height) {
            this.paths.push([
                [x, y + height],
                [x, y],
                [x + width, y],
                [x + width, y + height],
            ])
            this.paths[this.paths.length - 1].closed = true
        }

        arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
            const arcPath = createArc(x, y, radius, startAngle, endAngle, 30, anticlockwise)
            const last = this.paths.length - 1
            if (last >= 0)
                this.paths[last] = this.paths[last].concat(arcPath)
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
            for (const path of this.paths) {
                if (path.length < 2) continue
                const indexOffset = positions.length / 2 // index offset when combine all path's position and index, divided by 2: 2 term (x, y) mapping to 1 index
                const pathData = getPathStrokeBufferData(path, width, path.closed, indexOffset)
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

    class WebGL2RenderingContext2D {
        constructor(canvas) {
            this._renderer = new Renderer(canvas)
            this._scene = new THREE.Scene();

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

            // public attributes
            this.canvas = canvas

            this.lineWidth = 1
            this._strokeStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
            this._fillStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
        }

        _draw(positions, indices, color) {
            this._renderer.draw(positions, indices, [color.r, color.g, color.b, color.a])
        }

        // API
        beginPath() {
            this.path = new Path(this)
        }

        closePath() {
            this.path.closePath()
        }

        moveTo(x, y) {
            // TODO: consider call moveTO without beginPath
            this.path.moveTo(x, this._height - y)
        }

        lineTo(x, y) {
            this.path.lineTo(x, this._height - y)
        }

        arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
            this.path.arc(x, this._height - y, radius, -startAngle, -endAngle, anticlockwise)
        }

        arcTo(x1, y1, x2, y2, radius) {
            this.path.arcTo(x1, this._height - y1, x2, this._height - y2, radius)
        }

        bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
            this.path.bezierCurveTo(cp1x, this._height - cp1y, cp2x, this._height - cp2y, x, this._height - y)
        }

        quadraticCurveTo(cpx, cpy, x, y) {
            this.path.quadraticCurveTo(cpx, this._height - cpy, x, this._height - y)
        }

        stroke() {
            const { positions, indices } = this.path.getStrokeBufferData()
            this._draw(positions, indices, this._strokeStyle)
        }

        rect(x, y, width, height) {
            this.path.rect(x, this._height - y - height, width, height)
        }

        fill() {
            const { positions, indices } = this.path.getShapeBufferData()
            this._draw(positions, indices, this._fillStyle)
        }

        fillRect(x, y, width, height) {
            const { positions, indices } = generateRectBufferData(x, this._height - y - height, width, height)
            this._draw(positions, indices, this._fillStyle)
        }

        strokeRect(x, y, width, height) {
            const rectPath = new Path(this)
            rectPath.rect(x, this._height - y - height, width, height)
            const { positions, indices } = rectPath.getStrokeBufferData()
            this._draw(positions, indices, this._strokeStyle)
        }

        clearRect(x, y, width, height) {
            const { positions, indices } = generateRectBufferData(x, this._height - y - height, width, height)
            const transparent = { r: 0, g: 0, b: 0, a: 0 }
            this._draw(positions, indices, transparent)
        }


        // Transformations
        transform(a, b, c, d, e, f) {

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


        set fillStyle(color) {
            this._fillStyle = colorParser(color)
        }

        get fillStyle() {
            // TODO: format
            return this._fillStyle
        }

        set strokeStyle(color) {
            this._strokeStyle = colorParser(color)
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