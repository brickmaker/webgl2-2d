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


    class WebGL2RenderingContext2D {
        constructor(ctx) {
            this._gl = ctx
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
                    }
                },
                uniforms: {}
            }


        }

        // API
        beginPath() { }
        moveTo() { }
        lineTo() { }
        stroke() {
            const gl = this._gl
            gl.bindBuffer(gl.ARRAY_BUFFER, this.programInfo.attributes.position.vertexBuffer)

            const positions = [
                0, 0,
                1, 0.,
                0.0, 1.,
                -1., 0.5,
            ];

            gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);

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
                const vertexCount = 4;
                gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
                // gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
            }
        }
        bezierCurveTo() {
            console.log('todo')
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