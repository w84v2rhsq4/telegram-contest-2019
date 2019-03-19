attribute vec2 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
  // gl_PointSize = 4.0;
  gl_PointSize = 2.0;
  gl_Position =  projectionMatrix * viewMatrix * vec4( position, 0.0, 1.0 );
}