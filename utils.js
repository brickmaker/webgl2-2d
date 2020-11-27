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
        if (startAngle <= endAngle) {
            startAngle += 2 * Math.PI
        }
        for (let angle = startAngle; angle >= endAngle - epsilon; angle += (endAngle - startAngle) / segments) {
            const px = x + radius * Math.cos(angle)
            const py = y + radius * Math.sin(angle)
            path.push([px, py])
        }
    }

    return path
}

function createBezier(p1, p2, p3, p4, segments = 30) {
    const path = []
    for (let t = 0; t <= 1; t += 1 / segments) {
        const invt = 1 - t
        const x = p1[0] * (invt ** 3) +
            p2[0] * 3 * t * (invt ** 2) +
            p3[0] * 3 * (t ** 2) * invt +
            p4[0] * (t ** 3)
        const y = p1[1] * (invt ** 3) +
            p2[1] * 3 * t * (invt ** 2) +
            p3[1] * 3 * (t ** 2) * invt +
            p4[1] * (t ** 3)
        path.push([x, y])
    }
    return path
}

function createTangentArc(x0, y0, x1, y1, x2, y2, radius) {
    const vec10 = new Vector2(x0 - x1, y0 - y1)
    const vec12 = new Vector2(x2 - x1, y2 - y1)
    vec10.normalize()
    vec12.normalize()

    const angle = (Math.atan2(vec10.y, vec10.x) - Math.atan2(vec12.y, vec12.x))

    const sideLen = Math.abs(radius / Math.tan(angle / 2))

    const tangentPoint1 = new Vector2(x1 + vec10.x * sideLen, y1 + vec10.y * sideLen)
    const tangentPoint2 = new Vector2(x1 + vec12.x * sideLen, y1 + vec12.y * sideLen)

    const middleVec = new Vector2().add(vec10).add(vec12).normalize()
    const middleLen = Math.sqrt(radius * radius + sideLen * sideLen)

    const centerX = x1 + middleVec.x * middleLen
    const centerY = y1 + middleVec.y * middleLen

    const startAngle = Math.atan2(tangentPoint1.y - centerY, tangentPoint1.x - centerX)
    const endAngle = Math.atan2(tangentPoint2.y - centerY, tangentPoint2.x - centerX)
    // NOTE: coordinate difference, use anticlockwise
    const anticlockwise = vec12.cross(vec10) > 0
    return createArc(centerX, centerY, radius, startAngle, endAngle, 30, anticlockwise)

    /*
    //work out tangent points using tan(θ) = opposite / adjacent; angle/2 because hypotenuse is the bisection of a,b
    var tan_angle_div2 = Math.tan(angle / 2);
    var adj_l = (radius / tan_angle_div2);

    var tangent_point1 = [x1 + a[0] * adj_l, y1 + a[1] * adj_l];
    var tangent_point2 = [x1 + b[0] * adj_l, y1 + b[1] * adj_l];

    currentPath.push(tangent_point1[0], tangent_point1[1])

    var bisec = [(a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0];
    var bisec_l = Math.sqrt(Math.pow(bisec[0], 2) + Math.pow(bisec[1], 2));
    bisec[0] /= bisec_l; bisec[1] /= bisec_l;

    var hyp_l = Math.sqrt(Math.pow(radius, 2) + Math.pow(adj_l, 2))
    var center = [x1 + hyp_l * bisec[0], y1 + hyp_l * bisec[1]];

    var startAngle = Math.atan2(tangent_point1[1] - center[1], tangent_point1[0] - center[0]);
    var endAngle = Math.atan2(tangent_point2[1] - center[1], tangent_point2[0] - center[0]);

    this.arc(center[0], center[1], radius, startAngle, endAngle)

    currentPath.push(tangent_point2[0], tangent_point2[1])
    */
}