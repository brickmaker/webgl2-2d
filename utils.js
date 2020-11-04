const { Vector2 } = THREE

function getVector2Normal(vec1, vec2) {
    const vec = new Vector2().add(vec2).sub(vec1)
    return new Vector2(-vec.y, vec.x).normalize()
}

function computeNormalAndLength(points) {
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
    rawNormals.push(getVector2Normal(new Vector2(points[N - 2][0], points[N - 2][1]), new Vector2(points[N - 1][0], points[N - 1][1])))

    normals[0] = rawNormals[0].toArray()
    lengths[0] = 1
    normals[N - 1] = rawNormals[N - 1].toArray()
    lengths[N - 1] = 1
    for (let i = 1; i < N - 1; i++) {
        const va = rawNormals[i - 1]
        const vb = rawNormals[i]
        const normal = new Vector2().addVectors(va, vb).normalize()
        normals[i] = normal.toArray()
        lengths[i] = 1 / normal.dot(va)
    }
    return {
        points,
        normals,
        lengths
    }
}

function getPathStrokeBufferData(path, width, indexOffset = 0) {
    const result = computeNormalAndLength(path)

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

const COLOR_TABLE = {
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