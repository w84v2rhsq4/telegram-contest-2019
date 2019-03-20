attribute vec2 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float thickness;

void main() {
  gl_PointSize = thickness;
  gl_Position =  projectionMatrix * viewMatrix * vec4( position, 0.0, 1.0 );
}