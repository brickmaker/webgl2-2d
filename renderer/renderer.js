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

function createTextureFromUint8Array(gl, array, type, width, height) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, array);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function createTextureInfo(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const level = 0
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    return {
        texture,
        width: image.width,
        height: image.height
    };
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

function createTextureProgramInfo(gl, vertexSource, fragmentSource) {
    const programInfo = {}
    programInfo.program = createProgram(gl, vertexSource, fragmentSource)
    programInfo.attributes = {
        position: {
            location: gl.getAttribLocation(programInfo.program, "a_position"),
            buffer: gl.createBuffer()
        },
        texCoord: {
            location: gl.getAttribLocation(programInfo.program, "in_texCoord"),
            buffer: gl.createBuffer()
        }
    }
    programInfo.uniforms = {
        resolution: gl.getUniformLocation(programInfo.program, "u_resolution"),
        transform: gl.getUniformLocation(programInfo.program, "u_transform"),
        // color: gl.getUniformLocation(programInfo.program, "u_color")
        sampler: gl.getUniformLocation(programInfo.program, "u_sampler")
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

    {
        gl.enableVertexAttribArray(programInfo.attributes.texCoord.location);
        gl.bindBuffer(gl.ARRAY_BUFFER, programInfo.attributes.texCoord.buffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;          // 2 components per iteration
        const type = gl.FLOAT;   // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(programInfo.attributes.texCoord.location, size, type, normalize, stride, offset);
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

        {
            // bind textures
            const textureUnit = 0;
            // Bind the texture to texture unit 0
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            gl.uniform1i(this.uniforms.sampler, textureUnit);
        }
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
        this.textureProgramInfo = createTextureProgramInfo(this.gl, textureVertexShaderSource, textureFragmentShaderSource)
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

    draw(vertices, indices, fillStyle) {

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

        this.gl.uniform4fv(this.currentProgramInfo.uniforms.color, new Float32Array(fillStyle));

        // Draw the rectangle.
        var primitiveType = this.gl.TRIANGLES;
        var offset = 0;
        var count = indices.length;
        var indexType = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(primitiveType, count, indexType, offset);
    }

    drawTexture(vertices, indices, texCoords, texture) {
        this.textureProgramInfo.setup(this)

        // Put a rectangle in the position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentProgramInfo.attributes.position.buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(vertices),
            this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.currentProgramInfo.attributes.texCoord.buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            this.gl.STATIC_DRAW);

        // Fill the current element array buffer with data
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.currentProgramInfo.indexBuffer);
        this.gl.bufferData(
            this.gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            this.gl.STATIC_DRAW
        );

        // bind textures
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);


        // Draw the rectangle.
        var primitiveType = this.gl.TRIANGLES;
        var offset = 0;
        var count = indices.length;
        var indexType = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(primitiveType, count, indexType, offset);
    }

    drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {

        const x1 = sx / image.width
        const x2 = (sx + sWidth) / image.width
        const y1 = sy / image.height
        const y2 = (sy + sHeight) / image.height
        // const texCoords = [0, 0, 1, 0, 1, 1, 0, 1]
        const texCoords = [x1, y1, x2, y1, x2, y2, x1, y2]
        const vertices = [dx, dy, dx + dWidth, dy, dx + dWidth, dy + dHeight, dx, dy + dHeight]
        const indices = [0, 1, 2, 0, 2, 3]
        const textureInfo = createTextureInfo(this.gl, image)

        this.drawTexture(vertices, indices, texCoords, textureInfo.texture)
    }

    getImageData(x, y, w, h) {
        const data = new Uint8ClampedArray(w * h * 4);
        const flipY = this.gl.canvas.height - y - h
        this.gl.readPixels(x, flipY, w, h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data)

        // flip upside down
        const flipData = new Uint8ClampedArray(w * h * 4);
        for (let r = 0; r < h; r++) {
            flipData.set(data.subarray(r * w * 4, (r + 1) * w * 4), (h - r - 1) * w * 4)
        }
        return {
            data: flipData,
            width: w,
            height: h
        }
    }

    putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
        let texture = null

        const { data, width, height } = imageData
        let dWidth = width
        let dHeight = height

        if (dirtyWidth && dirtyHeight) {
            const array = new Uint8Array(dirtyWidth * dirtyHeight * 4)
            for (let r = 0; r < Math.min(dirtyHeight, height - dirtyY); r++) {
                const slice = data.subarray(((dirtyY + r) * width + dirtyX) * 4, ((dirtyY + r) * width + Math.min(width, dirtyX + dirtyWidth)) * 4)
                const offset = r * dirtyWidth * 4
                // console.log(r, slice, offset)
                array.set(slice, offset)
                // array.set(data.subarray(((dirtyY + r) * width + dirtyX) * 4), r * dirtyWidth * 4)
            }
            texture = createTextureFromUint8Array(this.gl, array, this.gl.RGBA, dirtyWidth, dirtyHeight)
            dWidth = dirtyWidth
            dHeight = dirtyHeight
        } else {
            texture = createTextureFromUint8Array(this.gl, data, this.gl.RGBA, width, height)
        }

        const texCoords = [0, 0, 1, 0, 1, 1, 0, 1]
        const vertices = [dx, dy, dx + dWidth, dy, dx + dWidth, dy + dHeight, dx, dy + dHeight]
        // NOTE: weird API
        if (dirtyWidth && dirtyHeight) {
            for (let i = 0; i < vertices.length; i += 2) {
                vertices[i] += dirtyX
                vertices[i + 1] += dirtyY
            }
        }
        const indices = [0, 1, 2, 0, 2, 3]
        this.drawTexture(vertices, indices, texCoords, texture)
    }
}
