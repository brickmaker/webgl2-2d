const { Vector2 } = THREE

function getVector2Normal(vec1, vec2) {
    const vec = new Vector2().add(vec2).sub(vec1)
    return new Vector2(-vec.y, vec.x).normalize()
}

function computeNormalAndLength(points, isClosed = false) {
    if (!points || points.lengths < 2) {
        return {
            points,
            normals: null,
            lengths: null
        }
    }

    const N = points.length
    const normals = Array(N).fill().map(() => [0, 0])
    const lengths = Array(N).fill(1)

    const rawNormals = []
    for (let i = 0; i < N - 1; i++) {
        rawNormals.push(getVector2Normal(new Vector2(points[i][0], points[i][1]), new Vector2(points[i + 1][0], points[i + 1][1])))
    }
    // if closed, we need this segement's normal
    rawNormals.push(getVector2Normal(new Vector2(points[N - 1][0], points[N - 1][1]), new Vector2(points[0][0], points[0][1])))

    for (let i = 0; i < N; i++) {
        const va = rawNormals[(i - 1 + N) % N]
        const vb = rawNormals[i % N]
        const normal = new Vector2().addVectors(va, vb).normalize()
        normals[i] = normal.toArray()
        lengths[i] = 1 / normal.dot(va)
    }

    if (!isClosed) {
        // reset normal, not mitter
        normals[0] = rawNormals[0].toArray()
        lengths[0] = 1
        normals[N - 1] = rawNormals[N - 2].toArray() // NOTE: not use current raw normal, use previous instead
        lengths[N - 1] = 1
    }

    return {
        points,
        normals,
        lengths
    }
}

function getPathStrokeBufferData(path, width, isClosed = false, indexOffset = 0) {
    const result = computeNormalAndLength(path, isClosed)

    const positions = []
    const indices = []

    for (let i = 0; i < path.length; i++) {
        const [x, y] = result.points[i]
        const [nx, ny] = result.normals[i]
        const l = result.lengths[i]
        positions.push(x + nx * l * width / 2, y + ny * l * width / 2, x - nx * l * width / 2, y - ny * l * width / 2)
    }
    for (let i = 0; i < path.length - 1; i++) {
        indices.push(indexOffset + 2 * i, indexOffset + 2 * i + 1, indexOffset + 2 * i + 2)
        indices.push(indexOffset + 2 * i + 1, indexOffset + 2 * i + 3, indexOffset + 2 * i + 2)
    }

    if (isClosed) {
        indices.push(indexOffset + 2 * (path.length - 1), indexOffset + 2 * (path.length - 1) + 1, indexOffset)
        indices.push(indexOffset + 2 * (path.length - 1) + 1, indexOffset + 1, indexOffset)
    }

    return {
        positions,
        indices
    }
}

function getPathShapeBufferData(path, indexOffset = 0) {
    const positions = []
    for (const p of path) {
        positions.push(p[0], p[1])
    }
    const indices = earcut(positions)
    for (let i = 0; i < indices.length; i++) {
        indices[i] += indexOffset
    }
    return {
        positions,
        indices
    }
}

function generateRectBufferData(x, y, width, height) {
    const positions = [x, y, x + width, y, x + width, y + height, x, y + height]
    const indices = [0, 1, 2, 0, 2, 3]
    return {
        positions,
        indices
    }
}

const COLOR_TABLE = {
    'transparent': [0, 0, 0, 0],
    'black': [0, 0, 0, 1],
    'white': [255, 255, 255, 1],
    'red': [255, 0, 0, 1],
    'green': [0, 255, 0, 1],
    'blue': [0, 0, 255, 1],
}

function colorParser(color) {
    if (color in COLOR_TABLE) {
        const [r, g, b, a] = COLOR_TABLE[color]
        return {
            r: r / 255,
            g: g / 255,
            b: b / 255,
            a: a
        }
    }
    // TODO: support all color type
    console.error('Not supported color yet.')
}

function createArc(x, y, radius, startAngle, endAngle, segments = 30, anticlockwise = false) {
    startAngle %= 2 * Math.PI
    endAngle %= 2 * Math.PI

    const path = []
    const epsilon = 0.0001

    if (anticlockwise) {
        if (endAngle <= startAngle) {
            endAngle += 2 * Math.PI
        }
        for (let angle = startAngle; angle <= endAngle + epsilon; angle += (endAngle - startAngle) / segments) {
            const px = x + radius * Math.cos(angle)
            const py = y + radius * Math.sin(angle)
            path.push([px, py])
        }
    } else {
        startAngle += 2 * Math.PI
        for (let angle = startAngle; angle >= endAngle - epsilon; angle += (endAngle - startAngle) / segments) {
            const px = x + radius * Math.cos(angle)
            const py = y + radius * Math.sin(angle)
            path.push([px, py])
        }
    }

    return path
}
