# webgl2-2d
Canvas API implementation in WebGL2

## checklist

refer: http://bucephalus.org/text/CanvasHandbook/CanvasHandbook.html

- [ ] HTMLCanvasElement
    - [ ] width/height
    - [x] getContext('webgl2-2d'): attributes not supported
    - [x] toDataURL(): parameters not supported
- [ ] CanvasRenderingContext2D
    - [x] canvas
    - [ ] State
        - [ ] save()
        - [ ] restore()
    - [ ] Transformations
        - [ ] scale()
        - [ ] rotate()
        - [ ] translate()
        - [ ] transform()
        - [ ] setTransform()
    - [ ] Compositing
        - [ ] globalAlpha
        - [ ] globalCompositeOperation
    - [ ] Colors and styles (TODO: need complete colorParser)
        - [x] strokeStyle
        - [x] fillStyle
        - [ ] createLinearGradient(x0, y0, x1, y1) and addColorStop(pos, color)
        - [ ] createRadialGradient(x0, y0, r0, x1, y1, r1) and addColorStop(pos, color)
        - [ ] createPattern(image, repetition)
    - [ ] Line caps and joins
        - [x] lineWidth
        - [ ] lineCap
        - [ ] lineJoin
    - [ ] Shadows
        - [ ] shadowOffsetX
        - [ ] shadowOffsetY
        - [ ] shadowBlur
        - [ ] shadowColor
    - [x] Rectangles
        - [x] fillRect
        - [x] strokeRect
        - [x] clearRect
    - [ ] Paths
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
        - [ ] clip()
        - [ ] isPointInPath()
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
    
