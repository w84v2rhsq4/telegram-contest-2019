attribute vec2 position;
void main() {
  // gl_PointSize = 4.0;
  gl_PointSize = 2.0;
  gl_Position = vec4( position, 0.0, 1.0 );
}