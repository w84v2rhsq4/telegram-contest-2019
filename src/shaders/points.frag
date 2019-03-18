precision highp float;

uniform vec3 color;
uniform sampler2D colorTexture;
void main( void ) {
  vec4 baseColor = texture2D(colorTexture, gl_PointCoord.xy);
  gl_FragColor = vec4(baseColor.rgb + color, baseColor.a);
}