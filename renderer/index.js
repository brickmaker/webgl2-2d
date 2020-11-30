const renderer = new Renderer(document.querySelector('#main'))

const vertices = [
    10, 10,
    100, 30,
    10, 60,
    100, 60
]
const indices = [
    0, 1, 2,   // first triangle
    2, 1, 3,   // second triangle
];

const color = [Math.random(), Math.random(), Math.random(), 1]

renderer.draw(vertices, indices, color)