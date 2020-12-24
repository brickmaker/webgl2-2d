# webgl2-2d
Canvas API implementation in WebGL2

## checklist

refer: http://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html

- [x] HTMLCanvasElement
    - [x] width/height (TODO: set behavior not same)
    - [x] getContext('webgl2-2d'): attributes not supported
    - [x] toDataURL(): (TODO: parameters not supported)
- [x] CanvasRenderingContext2D
    - [x] canvas
    - [x] State
        - [x] save()
        - [x] restore()
    - [x] Transformations
        - [x] scale()
        - [x] rotate()
        - [x] translate()
        - [x] transform()
        - [x] setTransform()
    - [ ] Compositing
        - [ ] globalAlpha
        - [ ] globalCompositeOperation
    - [ ] Colors and styles (TODO: need complete colorParser)
        - [x] strokeStyle
        - [x] fillStyle
        - [ ] createLinearGradient(x0, y0, x1, y1) and addColorStop(pos, color)
        - [ ] createRadialGradient(x0, y0, r0, x1, y1, r1) and addColorStop(pos, color)
        - [ ] createPattern(image, repetition)
    - [x] Line caps and joins
        - [x] lineWidth
        - [x] lineCap
        - [x] lineJoin
    - [ ] Shadows
        - [ ] shadowOffsetX
        - [ ] shadowOffsetY
        - [ ] shadowBlur
        - [ ] shadowColor
    - [x] Rectangles
        - [x] fillRect
        - [x] strokeRect
        - [x] clearRect
    - [x] Paths
        - [x] beginPath()
        - [x] closePath()
        - [x] stroke()
        - [x] fill()
        - [x] lineTo()
        - [x] moveTo()
        - [x] rect()
        - [x] quadraticCurveTo()
        - [x] bezierCurveTo()
        - [x] arc()
        - [x] arcTo()
        - [x] clip() (TODO: not fully supported, bug exists with save/restore and multiple clip)
        - [x] isPointInPath() (TODO: specify path support)
    - [ ] Text
        - [ ] font
        - [ ] textAlign
        - [ ] textBaseline
        - [ ] fillText()
        - [ ] strokeText()
        - [ ] measureText().width
    - [ ] Drawing Images
        - [ ] drawImage()
    - [ ] Pixel manipulation
        - [ ] ImageData
        - [ ] createImageData()
        - [ ] getImageData()
        - [ ] putImageData()
    
