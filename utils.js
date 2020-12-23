const { Vector2, Vector3, Matrix3, Matrix4 } = THREE

function getVector2Normal(vec1, vec2) {
    const vec = new Vector2().add(vec2).sub(vec1)
    return new Vector2(-vec.y, vec.x).normalize()
}

function normalize(vec) {
    const len = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1])
    return [vec[0] / len, vec[1] / len]
}

function mat4Multiply(mat1, mat2) {
    const m1 = new Matrix4().fromArray(mat1)
    const m2 = new Matrix4().fromArray(mat2)
    return m1.multiply(m2).elements
}

function computeNormalAndLength(points) {
    if (!points || points.lengths < 2) {
        return {
            points,
            miterNormals: null,
            lengths: null,
            normal: null
        }
    }

    const N = points.length
    const miterNormals = Array(N).fill().map(() => [0, 0])
    const lengths = Array(N).fill(1)

    const normals = []
    for (let i = 0; i < N - 1; i++) {
        normals.push(getVector2Normal(new Vector2(points[i][0], points[i][1]), new Vector2(points[i + 1][0], points[i + 1][1])))
    }
    normals.push(getVector2Normal(new Vector2(points[N - 1][0], points[N - 1][1]), new Vector2(points[0][0], points[0][1])))

    for (let i = 0; i < N; i++) {
        const va = normals[(i - 1 + N) % N]
        const vb = normals[i % N]
        const normal = new Vector2().addVectors(va, vb).normalize()

        const edgeDir = new Vector2(points[(i + 1) % N][0] - points[i][0], points[(i + 1) % N][1] - points[i][1])
        // keep mitter normal's direction outside
        if (normal.dot(edgeDir) > 0) {
            normal.negate()
        }
        lengths[i] = 1 / normal.dot(va)
        miterNormals[i] = normal.toArray()
    }

    return {
        points,
        miterNormals, // mitter normals
        lengths,
        normals: normals.map(n => n.toArray())
    }
}

function getPathStrokeBufferData(path, width, isClosed, indexOffset, lineJoin, lineCap) {
    const result = computeNormalAndLength(path)

    const positions = []
    const indices = []

    if (!isClosed) {
        // begin Node
        // TODO: consider linecap
        const [x, y] = result.points[0]
        const [nx, ny] = result.normals[0]

        if (lineCap === 'square') {
            const [dirX, dirY] = normalize([result.points[1][0] - result.points[0][0], result.points[1][1] - result.points[0][1]])
            positions.push(x - dirX * width / 2 + nx * width / 2, y - dirY * width / 2 + ny * width / 2, x - dirX * width / 2 - nx * width / 2, y - dirY * width / 2 - ny * width / 2)
        } else if (lineCap === 'round') {
            const startAngle = Math.atan2(-ny, -nx)
            const endAngle = Math.atan2(ny, nx)
            const arcPath = createArc(x, y, width / 2, startAngle, endAngle, 30, true)
            for (const [px, py] of arcPath) {
                positions.push(px, py, x, y)
            }
        }

        positions.push(x + nx * width / 2, y + ny * width / 2, x - nx * width / 2, y - ny * width / 2)
    }

    // don't need to consider first and last point if not isClosed
    const lineJoinRange = isClosed ? { left: 0, right: result.points.length - 1 } : { left: 1, right: result.points.length - 2 }

    for (let i = lineJoinRange.left; i <= lineJoinRange.right; i++) {
        const [x, y] = result.points[i]
        const [nx, ny] = result.miterNormals[i]
        const l = result.lengths[i]
        if (lineJoin === 'bevel' | lineJoin === 'round') {
            let [rawNormal1x, rawNormal1y] = result.normals[(i + result.normals.length - 1) % result.normals.length]
            let [rawNormal2x, rawNormal2y] = result.normals[i]
            // NOTE: caution the draw order
            if (l < 0) {
                positions.push(x + nx * l * width / 2, y + ny * l * width / 2, x - rawNormal1x * width / 2, y - rawNormal1y * width / 2)

                // for round join
                const startAngle = Math.atan2(-rawNormal1y, -rawNormal1x)
                const endAngle = Math.atan2(-rawNormal2y, -rawNormal2x)
                const arcPath = createArc(x, y, width / 2, startAngle, endAngle, 30, false)
                for (const [px, py] of arcPath) {
                    positions.push(x, y, px, py)
                }

                positions.push(x + nx * l * width / 2, y + ny * l * width / 2, x - rawNormal2x * width / 2, y - rawNormal2y * width / 2,)
            } else {
                positions.push(x + rawNormal1x * width / 2, y + rawNormal1y * width / 2, x - nx * l * width / 2, y - ny * l * width / 2)

                // for round join
                const startAngle = Math.atan2(rawNormal1y, rawNormal1x)
                const endAngle = Math.atan2(rawNormal2y, rawNormal2x)
                const arcPath = createArc(x, y, width / 2, startAngle, endAngle, 30, true)
                for (const [px, py] of arcPath) {
                    positions.push(px, py, x, y)
                }

                positions.push(x + rawNormal2x * width / 2, y + rawNormal2y * width / 2, x - nx * l * width / 2, y - ny * l * width / 2)
            }
        } else {
            positions.push(x + nx * l * width / 2, y + ny * l * width / 2, x - nx * l * width / 2, y - ny * l * width / 2)
        }
    }

    if (!isClosed) {
        // end Node
        // TODO: consider linecap
        const idx = result.points.length - 1
        const [x, y] = result.points[idx]
        const [nx, ny] = result.normals[idx - 1] // NOTE: not use current normal, because this is the normal of edge between last point and first point. use previous instead

        positions.push(x + nx * width / 2, y + ny * width / 2, x - nx * width / 2, y - ny * width / 2)

        if (lineCap === 'square') {
            const [dirX, dirY] = normalize([result.points[idx][0] - result.points[idx - 1][0], result.points[idx][1] - result.points[idx - 1][1]])
            positions.push(x + dirX * width / 2 + nx * width / 2, y + dirY * width / 2 + ny * width / 2, x + dirX * width / 2 - nx * width / 2, y + dirY * width / 2 - ny * width / 2)
        } else if (lineCap === 'round') {
            const startAngle = Math.atan2(-ny, -nx)
            const endAngle = Math.atan2(ny, nx)
            const arcPath = createArc(x, y, width / 2, startAngle, endAngle, 30, false)
            for (const [px, py] of arcPath) {
                positions.push(px, py, x, y)
            }
        }

    }

    for (let i = 0; i < (positions.length / 4 - 1); i++) { // divide by 4: get half num of nodes; minus 1, prevent tail if not closed
        indices.push(indexOffset + 2 * i, indexOffset + 2 * i + 1, indexOffset + 2 * i + 2)
        indices.push(indexOffset + 2 * i + 1, indexOffset + 2 * i + 3, indexOffset + 2 * i + 2)
    }

    if (isClosed) {
        indices.push(indexOffset + positions.length / 2 - 2, indexOffset + positions.length / 2 - 1, indexOffset)
        indices.push(indexOffset + positions.length / 2 - 1, indexOffset + 1, indexOffset)
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
    'green': [0, 128, 0, 1],
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

    if (!anticlockwise) {
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

function createQuadratic(p1, p2, p3, segments = 30) {
    const path = []
    for (let t = 0; t <= 1; t += 1 / segments) {
        const invt = 1 - t
        const x = p1[0] * (invt ** 2) +
            p2[0] * 2 * t * invt +
            p3[0] * (t ** 2)
        const y = p1[1] * (invt ** 2) +
            p2[1] * 2 * t * invt +
            p3[1] * (t ** 2)
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
    // TODO: arc direction, review
    const anticlockwise = vec12.cross(vec10) < 0
    return createArc(centerX, centerY, radius, startAngle, endAngle, 30, anticlockwise)
}

function pointInPolygon(points, x, y, fillRule) {
    let crossCnt = 0
    let noneZeroValue = 0
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i]
        const [x2, y2] = points[(i + 1) % points.length]
        if (y1 == y2) continue // discard parallel edge
        if ((y1 - y) * (y2 - y) <= 0) {
            let xMid = x1 + (x2 - x1) * (y - y1) / (y2 - y1) // middle x pos for line p1 - p2
            if (xMid > x) {
                // use pos-x ray casting
                // get valid path
                if (y === y1) {
                    // ray intersect vertex, check cross or touch
                    const y0 = points[(i + points.length - 1) % points.length]
                    if ((y0 - y) * (y2 - y) <= 0) {
                        // two edge at differenct side, not cnt
                        continue
                    }
                }
                crossCnt += 1
                noneZeroValue += y2 > y1 ? 1 : -1
            }
        }
    }
    if (fillRule === 'evenodd') {
        return crossCnt % 2 != 0
    } else {
        return noneZeroValue != 0
    }
}