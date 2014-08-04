function Camera(map) {
  // Initial camera position
  this.x = 10
  this.y = 500

  // Camera angle
  this.angle = 0

  // Field of view, in degree.
  this.fov = 60

  // Max distance to draw
  this.maxDistance = 1500
  this.rotatedMap = map.rotate() 
}

Camera.prototype.project = function(map, canvas) {
  var context = canvas.getContext("2d")

  // Loop over each ray angles to cast
  var angle = this.angle - (this.fov / 2)
  // Calculate angle increment to advance 1px horizontally on screen.
  var angleIncrement = this.fov / canvas.width
  // Distance from screen
  var distanceFromScreen = canvas.width / 2 / Math.tan(this.fov / 2 * DEG)

  // Cast all the rays and draw screen (canvas) wall slices from left to right.
  for (var x = 0; x < canvas.width; x++) {
    var distance = this.castRay(angle, map)
    // Correct fish eye distortion
    // Ray angle (angle) need to be made relative to the camera angle.
    distance = distance * Math.cos((this.angle - angle) * DEG)

    var sliceHeight = map.wallHeight / distance * distanceFromScreen

    // Center column vertically
    var y = canvas.height / 2 - sliceHeight / 2

    // Draw column slice
    context.fillStyle = '#f0f'
    context.fillRect(x, y, 1, sliceHeight)

    // Shade it based on distance
    context.fillStyle = '#000'
    context.globalAlpha = distance / this.maxDistance
    context.fillRect(x, y, 1, sliceHeight)
    context.globalAlpha = 1

    angle += angleIncrement
  }
}

Camera.prototype.castRay = function(angle, map) {
  // Start casting ray from camera position
  var x = this.x
  var y = this.y
  var horizIntersect = this.getHorizontalHit(x, y, angle, map)
  var yRot90 = x
  var xRot90 = map.height - y
  var verticalIntersect = this.getHorizontalHit(xRot90, yRot90, angle + 90, this.rotatedMap) //Vertical hits == horizontal hits for rotated map (90 deg)
  var dist1 = horizIntersect != null ? Math.sqrt(Math.pow(x - horizIntersect.x, 2) + Math.pow(y - horizIntersect.y, 2)) : Number.MAX_VALUE
  var dist2 = verticalIntersect != null ? Math.sqrt(Math.pow(xRot90 - verticalIntersect.x, 2) + Math.pow(yRot90 - verticalIntersect.y, 2)) : Number.MAX_VALUE
  if (dist1 == null && dist2 == null){
    alert('oh oh')
    debugger
  }
  if (dist1 < dist2){
    return dist1
  }else{
    return dist2
  }
}

Camera.prototype.getHorizontalHit = function(x, y, angle, map){
  var xIncr,
      yIncr
  if (this.rayDirection(angle).indexOf("up") >= 0){
    yIncr = -map.blockSize
  }else if (this.rayDirection(angle).indexOf("down") >= 0){
    yIncr = map.blockSize
  } else {
    return null
  }
  xIncr = Math.abs(angle) == 90 ? 0 : xIncr = yIncr / Math.tan(angle*DEG)

  var intersection = this.getFirstHorizontalIntersection(x, y, angle, map)
  var hit = 0;
  while (intersection && !hit){
    hit = map.get(intersection.x, intersection.y)
    if (!hit)
      intersection = this.getNextHorizontalIntersection(intersection, xIncr, yIncr, map)
  }
  if (hit){
    return intersection
  }
  return null
}

Camera.prototype.getFirstHorizontalIntersection = function(x, y, angle, map){
  var offset
  if (this.rayDirection(angle).indexOf("up") >= 0){
    offset = -1
  }else if (this.rayDirection(angle).indexOf("down") >= 0){
      offset = map.blockSize
  }else return null
  var point = {}
  point.y = Math.floor(y/map.blockSize) * map.blockSize + offset
  point.x = Math.abs(angle) == 90 ? x : x + (y-point.y)/Math.tan(-angle * DEG)
  return point
}

Camera.prototype.getNextHorizontalIntersection = function(prevIntersection, xIncr, yIncr, map){
  var xNext = Math.max(-1, Math.min(prevIntersection.x + xIncr, map.width))
  var yNext = Math.max(-1, Math.min(prevIntersection.y + yIncr, map.height))
  return {x : xNext, y : yNext}
}

Camera.prototype.rayDirection = function(angle){
  var dirs = []
  if (Math.sin(angle*DEG) > 0){
    dirs.push("down")
  }else if (Math.sin(angle*DEG) < 0){
    dirs.push("up")
  }
  if (Math.cos(angle*DEG) > 0){
    dirs.push("right")
  }else if (Math.cos(angle*DEG) < 0){
    dirs.push("left")
  }
  return dirs
}
Camera.prototype.outsideMap = function(point){
  return (point.y < 0 || point.y > map.height || (point.x < 0 || point.x > map.width))
}
Camera.prototype.move = function(distance) {
  this.x += Math.cos(this.angle * DEG) * distance
  this.y += Math.sin(this.angle * DEG) * distance
}
