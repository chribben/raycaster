function Camera() {
  // Initial camera position
  this.x = 10
  this.y = 500

  // Camera angle
  this.angle = 0

  // Field of view, in degree.
  this.fov = 60

  // Max distance to draw
  this.maxDistance = 1500
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
/////////// Finding vertical intersection
//Get first intersection
  var intersection1 = this.getVerticalHit(x, y, angle, map)
  var intersection2 = this.getHorizontalHit(x, y, angle, map)

  var dist1 = intersection1 != null ? Math.sqrt(Math.pow(x - intersection1.x, 2) + Math.pow(y - intersection1.y, 2)) : Number.MAX_VALUE
  var dist2 = intersection2 != null ? Math.sqrt(Math.pow(x - intersection2.x, 2) + Math.pow(y - intersection2.y, 2)) : Number.MAX_VALUE
  if (dist1 == null && dist2 == null){
    alert('oh oh')
    debugger
  }
  if (dist1 < dist2){
    return dist1
  }else{
    return dist2
  }
  // Pre-compute Cartesian increments to make it faster
  // var xIncrement = Math.cos(angle * DEG)
  // var yIncrement = Math.sin(angle * DEG)
  //
  // for (var length = 0; length < this.maxDistance; length++) {
  //   x += xIncrement
  //   y += yIncrement
  //
  //   var hit = map.get(x, y)
  //
  //   if (hit) return length
  // }
}

Camera.prototype.getHorizontalHit = function(x, y, angle, map){
  var xIncr
  var yIncr
  if (angle < 0 && angle > -180){
    yIncr = -map.blockSize
  }else if (angle > 0 && angle < 180){
    yIncr = map.blockSize
  }
  xIncr = yIncr / Math.tan(angle*DEG)
//  console.log('Horizontal incr: ' + 'angle: ' + angle + '(' + xIncr + ', ' + yIncr + ')' )

  var intersection = this.getFirstHorizontalIntersection(x, y, angle, map)
  var hit = 0;
  while (intersection && !hit && yIncr){
    hit = map.get(intersection.x, intersection.y)
    if (!hit)
      intersection = this.getNextHorizontalIntersection(intersection, xIncr, yIncr, map)
  }
  if (hit){
    return intersection
  }
  return null
}

Camera.prototype.getNextHorizontalIntersection = function(prevIntersection, xIncr, yIncr, map){
  var xNext = Math.max(0, Math.min(prevIntersection.x + xIncr, map.width))
  var yNext = Math.max(0, Math.min(prevIntersection.y + yIncr, map.height))
  return {x : xNext, y : yNext}
}

Camera.prototype.getFirstHorizontalIntersection = function(x, y, angle, map){
  var offset
  if (angle < 0 && angle > -180){
    offset = -1
  }else if (angle > 0 && angle < 180){
      offset = map.blockSize
  }else return null

  var point = {}
  point.y = Math.floor(y/map.blockSize) * map.blockSize + offset
  point.x = x + (y-point.y)/Math.tan(-angle * DEG)
  return point
}

Camera.prototype.getVerticalHit = function(x, y, angle, map){
  var xIncr
  var yIncr
  if (angle < -90 && angle > 90){
    xIncr = -map.blockSize
  }else if (angle > -90 && angle < 90){
    xIncr = map.blockSize
  }
  yIncr = xIncr * Math.tan(angle*DEG)

  var intersection = this.getFirstVerticalIntersection(x, y, angle, map)
  var hit = 0;
  while (intersection && !hit && xIncr){
    hit = map.get(intersection.x, intersection.y)
    if (!hit)
      intersection = this.getNextVerticalIntersection(intersection, xIncr, yIncr, map)
  }
  if (hit){
    return intersection
  }
  return null
}

Camera.prototype.getNextVerticalIntersection = function(prevIntersection, xIncr, yIncr, map){
  var xNext = Math.max(0, Math.min(prevIntersection.x + xIncr, map.width))
  var yNext = Math.max(0, Math.min(prevIntersection.y + yIncr, map.height))
  return {x : xNext, y : yNext}
}
Camera.prototype.outsideMap = function(point){
  return (point.y < 0 || point.y > map.height || (point.x < 0 || point.x > map.width))
}
Camera.prototype.getFirstVerticalIntersection = function(x, y, angle, map){
  var offset
  if (angle < -90 && angle > 90){
    offset = -1
  }else if (angle > -90 && angle < 90){
      offset = map.blockSize
  }else return null

  var point = {}
  point.x = Math.floor(x/map.blockSize) * map.blockSize + offset
  point.y = y + (x-point.x)*Math.tan(-angle * DEG)
  return point
}

Camera.prototype.move = function(distance) {
  this.x += Math.cos(this.angle * DEG) * distance
  this.y += Math.sin(this.angle * DEG) * distance
}
