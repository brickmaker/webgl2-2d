const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

uniform mat4 u_transform;

// all shaders have a main function
void main() {

  vec4 pos = u_transform * vec4(a_position, 0., 1.);

  // TODO: consider use projection matrix
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = pos.xy / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
//   gl_Position = vec4(clipSpace, 0, 1);
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

const textureVertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;
in vec2 in_texCoord;

out vec2 texCoord;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

uniform mat4 u_transform;

// all shaders have a main function
void main() {
  texCoord = in_texCoord;

  vec4 pos = u_transform * vec4(a_position, 0., 1.);

  // TODO: consider use projection matrix
  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = pos.xy / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
//   gl_Position = vec4(clipSpace, 0, 1);
}
`;

const textureFragmentShaderSource = `#version 300 es

precision highp float;

in vec2 texCoord;

uniform vec4 u_color;

uniform sampler2D u_sampler;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
//   outColor = u_color;
  outColor = texture(u_sampler, texCoord);
}
`;

function compileShader(gl, shaderStr, shaderType) {
    const shader = gl.createShader(shaderType)
    gl.shaderSource(shader, shaderStr)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(shader))
    }

    return shader
}

function createProgram(gl, vertShaderStr, fragShaderStr) {
    const vertShader = compileShader(gl, vertShaderStr, gl.VERTEX_SHADER)
    const fragShader = compileShader(gl, fragShaderStr, gl.FRAGMENT_SHADER)

    const program = gl.createProgram()

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)

    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Could not link shaders: ${gl.getProgramInfoLog(program)}`)
    }

    return program
}

function createSimpleProgramInfo(gl, vertexSource, fragmentSource) {
    const programInfo = {}
    programInfo.program = createProgram(gl, vertexSource, fragmentSource)
    programInfo.attributes = {
        position: {
            location: gl.getAttribLocation(programInfo.program, "a_position"),
            buffer: gl.createBuffer()
        }
    }
    programInfo.uniforms = {
        resolution: gl.getUniformLocation(programInfo.program, "u_resolution"),
        transform: gl.getUniformLocation(programInfo.program, "u_transform"),
        color: gl.getUniformLocation(programInfo.program, "u_color")
    }

    programInfo.vao = gl.createVertexArray()

    gl.bindVertexArray(programInfo.vao);

    {
        gl.enableVertexAttribArray(programInfo.attributes.position.location);
        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.attributes.position.buffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(programInfo.attributes.position.location, size, type, normalize, stride, offset);
    }

    // create the buffer
    programInfo.indexBuffer = gl.createBuffer();

    // make this buffer the current 'ELEMENT_ARRAY_BUFFER'
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, programInfo.indexBuffer);

    programInfo.setup = function (renderer) {
        if (renderer.currentProgramInfo === this) return;
        renderer.currentProgramInfo = this;

        // Tell it to use our program (pair of shaders)
        renderer.gl.useProgram(this.program);

        // Bind the attribute/buffer set we want.
        renderer.gl.bindVertexArray(this.vao);

        // Pass in the canvas resolution so we can convert from
        // pixels to clipspace in the shader
        renderer.gl.uniform2f(this.uniforms.resolution, renderer.gl.canvas.width, renderer.gl.canvas.height);

        renderer.gl.uniformMatrix4fv(this.uniforms.transform, false, renderer.transform)
    }

    return programInfo;
}

class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
            stencil: true
        })
        if (!this.gl) {
            console.error('WebGL2 not supported.')
            return
        }

        this.transform = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]

        this.currentProgramInfo = null
        this.simpleProgramInfo = createSimpleProgramInfo(this.gl, vertexShaderSource, fragmentShaderSource)
        this.simpleProgramInfo.setup(this)

        // TODO: consider devicePixelRatio
        // Tell WebGL how to convert from clip space to pixels
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        // Clear the canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    }

    prepareStencil() {
        this.gl.colorMask(false, false, false, false);
        this.gl.depthMask(false);
        this.gl.enable(this.gl.STENCIL_TEST)
        this.gl.stencilFunc(this.gl.ALWAYS, 1, 0xFF)
        this.gl.stencilOp(this.gl.KEEP, this.gl.KEEP, this.gl.REPLACE)
    }

    useStencil() {
        this.gl.colorMask(true, true, true, true);
        this.gl.depthMask(true);
        this.gl.stencilFunc(this.gl.EQUAL, 1, 0xFF)
    }

    setTransform(transform) {
        this.transform = transform.slice()
        this.gl.uniformMatrix4fv(this.currentProgramInfo.uniforms.transform, false, this.transform)
    }

    draw(vertices, indices, color) {

        this.simpleProgramInfo.setup(this)

        // Put a rectangle in the position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentProgramInfo.attributes.position.buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            this.gl.STATIC_DRAW);

        // Fill the current element array buffer with data
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.currentProgramInfo.indexBuffer);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            this.gl.STATIC_DRAW
        );

        this.gl.uniform4fv(this.currentProgramInfo.uniforms.color, new Float32Array(color));

        // Draw the rectangle.
        var primitiveType = this.gl.TRIANGLES;
        var offset = 0;
        var count = indices.length;
        var indexType = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(primitiveType, count, indexType, offset);
    }
}
