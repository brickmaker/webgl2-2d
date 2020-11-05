const { Vector4 } = THREE;


((() => {
    // vertex shader & fragment shader, wrapped in RawShaderMaterial
    const vertShaderStr = `precision mediump float;
        precision mediump int;

        // three internally bind transform matrix with camera, don't need set it manually
        uniform mat4 modelViewMatrix; // optional
        uniform mat4 projectionMatrix; // optional

        attribute vec3 position;
        // attribute vec4 color;

        varying vec3 vPosition;
        // varying vec4 vColor;

        void main()	{
            vPosition = position;
            // vColor = color;

            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `
    const fragShaderStr = `precision mediump float;
        precision mediump int;

        varying vec3 vPosition;
        // varying vec4 vColor;

        uniform vec4 uColor;

        void main()	{
            // gl_FragColor = vColor;
            gl_FragColor = uColor;
            // gl_FragColor = vec4(0., 0., 0., 1.);
        }
    `

    class Path {
        constructor(ctx) {
            this.paths = []
            this.ctx = ctx
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
            this._renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
            })
            this._renderer.setClearColor(0xffffff)
            this._scene = new THREE.Scene();

            this._width = canvas.width
            this._height = canvas.height

            this._camera = new THREE.OrthographicCamera(0, this._width, this._height, 0, -100, 100); // TODO: ortho setting, y flipping

            this._path = null


            // public attributes
            this.canvas = canvas

            this.lineWidth = 1
            this._strokeStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
            this._fillStyle = { r: 0, g: 0, b: 0, a: 1 } // setter&getter
        }

        _draw(positions, indices, color) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(indices)
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 2))

            const material = new THREE.RawShaderMaterial({
                uniforms: {
                    uColor: {
                        value: new Vector4(color.r, color.g, color.b, color.a)
                    }
                },
                vertexShader: vertShaderStr,
                fragmentShader: fragShaderStr,
                // other options...
            })

            // object and scene
            const mesh = new THREE.Mesh(geometry, material)
            this._scene.add(mesh);
            this._renderer.render(this._scene, this._camera);
        }

        // API
        beginPath() {
            this.path = new Path(this)
        }

        closePath() {
            this.path.closePath()
        }

        moveTo(x, y) {
            this.path.moveTo(x, this._height - y)
        }

        lineTo(x, y) {
            this.path.lineTo(x, this._height - y)
        }

        bezierCurveTo() {
        }

        stroke() {
            const { positions, indices } = this.path.getStrokeBufferData()
            this._draw(positions, indices, this._strokeStyle)
        }

        fill() {
            const { positions, indices } = this.path.getShapeBufferData()
            this._draw(positions, indices, this._fillStyle)
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
    let webgl2Context2D = undefined
    HTMLCanvasElement.prototype.getContext = function (contextType) {
        if (contextType === 'webgl2-2d') {
            if (!webgl2Context2D) {
                webgl2Context2D = new WebGL2RenderingContext2D(this) // TODO: consider arguments
            }
            return webgl2Context2D
        } else {
            return originGetContext.apply(this, arguments) // TODO: ..
        }
    }
})()) // TODO: more proper way