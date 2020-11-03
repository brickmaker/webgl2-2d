((() => {
    // vertex shader & fragment shader, wrapped in RawShaderMaterial
    const vertShaderStr = `precision mediump float;
        precision mediump int;

        // three internally bind transform matrix with camera, don't need set it manually
        uniform mat4 modelViewMatrix; // optional
        uniform mat4 projectionMatrix; // optional

        attribute vec3 position;
        attribute vec4 color;

        varying vec3 vPosition;
        varying vec4 vColor;

        void main()	{
            vPosition = position;
            vColor = color;

            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `
    const fragShaderStr = `precision mediump float;
        precision mediump int;

        varying vec3 vPosition;
        varying vec4 vColor;

        void main()	{
            // gl_FragColor = vColor;
            gl_FragColor = vec4(0., 0., 0., 1.); // TODO: color setting
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
            this.paths[last].push([x, y])
        }

        getBufferData() {
            let positions = []
            let indices = []
            const width = this.ctx.lineWidth
            for (const path of this.paths) {
                const indexOffset = positions.length / 2 // index offset when combine all path's position and index, divided by 2: 2 term (x, y) mapping to 1 index
                const pathData = getPathBufferData(path, width, indexOffset)
                positions = positions.concat(pathData.positions)
                indices = indices.concat(pathData.indices)
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

        }

        _draw(positions, indices) {
            const geometry = new THREE.BufferGeometry();
            geometry.setIndex(indices)
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 2))

            const material = new THREE.RawShaderMaterial({
                uniforms: {},
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

        closePath() { }

        moveTo(x, y) {
            this.path.moveTo(x, this._height - y)
        }

        lineTo(x, y) {
            this.path.lineTo(x, this._height - y)
        }

        bezierCurveTo() {
        }

        stroke() {
            const { positions, indices } = this.path.getBufferData()
            this._draw(positions, indices)
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