import vertexShader from "./shaders/points.vert";
import fragmentShader from "./shaders/points.frag";

import { findPerspective } from "./maths";
//prettier-ignore
const identityMatrix = [
  1, 0, 0, 0, 
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1 
];

class Canvas {
  constructor({ $canvas, points, plotColors, textureImg, thickness }) {
    this.$canvas = $canvas;
    this.points = points;
    this.textureImg = textureImg;
    this.thickness = thickness;
    this.plotColors = plotColors;

    this.colorLocation = undefined;
    this.viewMatrixLocation = undefined;
    this.projectionMatrixLocation = undefined;
    this.thicknessLocation = undefined;

    this.gl = undefined;
    this.buffers = [];
    this.redraw = true;

    this.viewMatrix = new Float32Array(identityMatrix);
    this.projectionMatrix = new Float32Array(identityMatrix);

    this.animate = this.animate.bind(this);
    window.onresize = this.resizeCanvas.bind(this);

    this.setContext();
    this.initVertexBuffers();
    this.createProgram();
    this.createTexture();

    this.resizeCanvas();
    this.animate();
  }

  setContext() {
    const { $canvas } = this;
    try {
      this.gl = $canvas.getContext("webgl");
    } catch (error) {
      throw error;
    }
  }

  setCamera({
    viewScaleY = this.viewScaleY,
    viewTranslateX = this.viewTranslateX,
    viewTranslateY = this.viewTranslateY,
    viewTranslateZ = this.viewTranslateZ,
    aspect = this.aspect
  }) {
    this.viewScaleY = viewScaleY;
    this.viewTranslateX = viewTranslateX;
    this.viewTranslateY = viewTranslateY;
    this.viewTranslateZ = viewTranslateZ;
    this.aspect = aspect;

    // prettier-ignore
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, viewScaleY, 0, 0,
      0, 0, 1, 0,
      viewTranslateX, viewTranslateY, viewTranslateZ, 1 // x y z -0.5 .. 0.5
    ]);
    const projectionMatrix = findPerspective(
      new Float32Array(identityMatrix),
      Math.PI / 2,
      aspect, // 0 .. 1
      0.01,
      10
    );

    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;

    return this;
  }

  initVertexBuffers() {
    const { gl, points, buffers } = this;
    for (let i = 0; i < points.length; i++) {
      buffers[i] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(points[i]),
        gl.STATIC_DRAW
      );
    }
  }

  createProgram() {
    const { gl } = this;
    const program = gl.createProgram();

    const vs = this.createShader(vertexShader, gl.VERTEX_SHADER);
    const fs = this.createShader(fragmentShader, gl.FRAGMENT_SHADER);

    if (vs == null || fs == null) {
      return null;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(program);

    this.program = program;
    this.colorLocation = gl.getUniformLocation(program, "color");
    this.viewMatrixLocation = gl.getUniformLocation(program, "viewMatrix");
    this.projectionMatrixLocation = gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );
    this.thicknessLocation = gl.getUniformLocation(program, "thickness");
  }

  createShader(src, type) {
    const { gl } = this;
    var shader = gl.createShader(type);

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    return shader;
  }

  resizeCanvas() {
    const { $canvas, gl } = this;
    if (
      $canvas.width != $canvas.clientWidth ||
      $canvas.height != $canvas.clientHeight
    ) {
      $canvas.width = $canvas.clientWidth * 2;
      $canvas.height = $canvas.clientHeight * 2;

      gl.viewport(0, 0, $canvas.width, $canvas.height);
      this.redraw = true;
    }
  }

  update() {
    this.redraw = true;
  }

  animate() {
    const { redraw } = this;
    if (redraw) {
      this.render();
    }
    requestAnimationFrame(this.animate);
  }

  render() {
    const { gl, program, points } = this;
    if (!program) {
      return;
    }

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_COLOR,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );
    //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Load program into GPU
    gl.useProgram(program);

    // Set values to program variables
    gl.uniform1i(gl.getUniformLocation(program, "colorTexture"), 0);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, this.viewMatrix);
    gl.uniformMatrix4fv(
      this.projectionMatrixLocation,
      false,
      this.projectionMatrix
    );
    gl.uniform1f(this.thicknessLocation, this.thickness);

    // Render geometry
    for (let i = 0; i < points.length; i++) {
      gl.uniform3f(this.colorLocation, ...this.plotColors[i]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[i]);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.POINTS, 0, points[i].length / 2);
    }

    this.redraw = false;
  }

  createTexture() {
    const { gl, textureImg } = this;
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textureImg
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}

export default Canvas;
