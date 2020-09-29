((() => {
    const vertShader = `#version 300 es
    in vec2 iPosition;

    void main() {
        gl_Position = vec4(iPosition, 0., 1.);
    }
    `
    const fragShader = `#version 300 es
    precision highp float;
    // uniform vec4 uColor;
    out vec4 fragmentColor;

    void main() {
        fragmentColor = vec4(1., 0., 0., 1.);
    }
    `

    function createShader(gl, shaderStr, type) {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, shaderStr)
        gl.compileShader(shader)

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Error when compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createProgram(gl, vertShaderStr, fragShaderStr) {
        const vertShader = createShader(gl, vertShaderStr, gl.VERTEX_SHADER)
        const fragShader = createShader(gl, fragShaderStr, gl.FRAGMENT_SHADER)

        const program = gl.createProgram()
        gl.attachShader(program, vertShader)
        gl.attachShader(program, fragShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return program;
    }

    class Path {
        constructor() {
            this.paths = []
        }

        moveTo(x, y) {
            this.paths.push([x, y])
        }

        lineTo(x, y) {
            this.paths[this.paths.length - 1].push(x, y)
        }
    }

    class WebGL2RenderingContext2D {
        constructor(ctx) {
            this._gl = ctx
            this._path = new Path()

            // public attributes
            this.canvas = this._gl.canvas
            this.lineWidth = 1

            const gl = this._gl


            this.program = createProgram(gl, vertShader, fragShader)

            // init attributes & uniforms

            this.programInfo = {
                program: this.program,
                attributes: {
                    position: {
                        location: gl.getAttribLocation(this.program, 'iPosition'),
                        vertexBuffer: gl.createBuffer(),
                        indexBuffer: gl.createBuffer()
                    }
                },
                uniforms: {}
            }


        }

        _draw(vertices, indices) {
            const gl = this._gl

            // vertex buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.programInfo.attributes.position.vertexBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.programInfo.attributes.position.indexBuffer)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


            {
                const numComponents = 2;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.programInfo.attributes.position.vertexBuffer);
                gl.vertexAttribPointer(
                    this.programInfo.attributes.position.location,
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset);
                gl.enableVertexAttribArray(this.programInfo.attributes.position.location)

            }
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(this.programInfo.program)

            {
                const offset = 0;
                const vertexCount = 6;
                // gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
                // gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
                gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
            }
        }

        // API
        beginPath() { }

        closePath() { }

        moveTo(x, y) {
            this._path.moveTo(x, y)
        }

        lineTo(x, y) {
            this._path.lineTo(x, y)
        }

        bezierCurveTo() {
            console.log('todo')
        }

        stroke() {
            const vertices = [
                0, 0,
                1, 0.,
                0.0, 1.,
                -1., 0.5,
            ];

            const indices = [
                0, 1, 2,
                1, 2, 3
            ]

            this._draw(vertices, indices)
        }
    }

    // mixin getContext
    const originGetContext = HTMLCanvasElement.prototype.getContext
    let webgl2Context2D = undefined
    HTMLCanvasElement.prototype.getContext = function (contextType) {
        if (contextType === 'webgl2-2d') {
            if (!webgl2Context2D) {
                webgl2Context2D = new WebGL2RenderingContext2D(originGetContext.call(this, 'webgl2'))
            }
            return webgl2Context2D
        } else {
            return originGetContext.apply(this, arguments) // TODO: ..
        }
    }
})()) // TODO: more proper way