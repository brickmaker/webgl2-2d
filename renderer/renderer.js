const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

//   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  gl_Position = vec4(clipSpace, 0, 1);
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

class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true
        })
        if (!this.gl) {
            console.error('WebGL2 not supported.')
            return
        }

        this.program = createProgram(this.gl, vertexShaderSource, fragmentShaderSource)


        // look up where the vertex data needs to go.
        this.positionAttributeLocation = this.gl.getAttribLocation(this.program, "a_position");

        // look up uniform locations
        this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.colorLocation = this.gl.getUniformLocation(this.program, "u_color");

        // Create a buffer
        this.positionBuffer = this.gl.createBuffer();

        // Create a vertex array object (attribute state)
        this.vao = this.gl.createVertexArray();

        // and make it the one we're currently working with
        this.gl.bindVertexArray(this.vao);

        // Turn on the attribute
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);

        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = this.gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        this.gl.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset);

        // create the buffer
        this.indexBuffer = this.gl.createBuffer();

        // make this buffer the current 'ELEMENT_ARRAY_BUFFER'
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);


        // TODO: consider devicePixelRatio
        // Tell WebGL how to convert from clip space to pixels
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        // Clear the canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        this.gl.useProgram(this.program);

        // Bind the attribute/buffer set we want.
        this.gl.bindVertexArray(this.vao);

        // Pass in the canvas resolution so we can convert from
        // pixels to clipspace in the shader
        this.gl.uniform2f(this.resolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);

    }

    draw(vertices, indices, color) {

        // Put a rectangle in the position buffer
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            this.gl.STATIC_DRAW);

        // Fill the current element array buffer with data
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            this.gl.STATIC_DRAW
        );

        this.gl.uniform4fv(this.colorLocation, new Float32Array(color));

        // Draw the rectangle.
        var primitiveType = this.gl.TRIANGLES;
        var offset = 0;
        var count = indices.length;
        var indexType = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(primitiveType, count, indexType, offset);
    }
}
