import vertexShader from "./shaders/points.vert";
import fragmentShader from "./shaders/points.frag";

import { getProjectionByAspect, normalizeValueToRange } from "./maths";

class Canvas {
  constructor({
    $canvas,
    points,
    plotColors,
    textureImg,
    thickness,
    plotsVisibility,
    cameraSettings,
    isDarkTheme
  }) {
    this.$canvas = $canvas;
    this.points = points;
    this.textureImg = textureImg;
    this.thickness = thickness;
    this.plotColors = plotColors;
    this.plotsVisibility = plotsVisibility;

    this.colorLocation = undefined;
    this.viewMatrixLocation = undefined;
    this.projectionMatrixLocation = undefined;
    this.thicknessLocation = undefined;

    this.gl = undefined;
    this.buffers = [];
    this.redraw = true;
    this.keyframes = [];
    this.alpha = plotColors.map(() => ({ value: 1 }));
    this.isDarkTheme = isDarkTheme;

    this.animate = this.animate.bind(this);
    this.animateCamera = this.animateCamera.bind(this);
    this.animateAlpha = this.animateAlpha.bind(this);
    window.onresize = this.resizeCanvas.bind(this);

    this.initCamera(cameraSettings);
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

  setCamera(cameraSettings) {
    const {
      viewScaleY,
      viewTranslateX,
      viewTranslateY,
      viewTranslateZ,
      aspect
    } = {
      ...this.cameraSettings,
      ...cameraSettings
    };

    // prettier-ignore
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, viewScaleY, 0, 0,
      0, 0, 1, 0,
      viewTranslateX, viewTranslateY, viewTranslateZ, 1 // x y z -0.5 .. 0.5
    ]);
    const projectionMatrix = getProjectionByAspect(aspect);

    this.cameraSettings = cameraSettings;
    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;
  }

  setTheme(isDark) {
    this.isDarkTheme = isDark;
  }

  initCamera(settings) {
    const defaultSettings = {
      viewScaleY: 1,
      viewTranslateX: 0,
      viewTranslateY: 0,
      viewTranslateZ: -1,
      aspect: 1
    };
    this.setCamera({ ...defaultSettings, ...settings });
  }

  // updateCamera(newSettings) {
  //   this.setCamera({ ...this.cameraSettings, ...newSettings });
  //   this.update();
  // }

  lerp(a, b, t) {
    const out = a + t * (b - a);
    return out;
  }

  updateCamera(newSettings) {
    for (const property of Object.keys(newSettings)) {
      this.keyframes.push({
        name: property,
        start: this.cameraSettings[property],
        end: newSettings[property],
        time: [performance.now(), performance.now() + 300]
      });
    }

    // this.setCamera({ ...this.cameraSettings, ...newSettings });
    // this.update();

    if (this.keyframes.length) {
      this.animateCamera(performance.now());
    }
  }

  animateCamera(sec) {
    const newSettings = {};
    let time = 0;
    for (const k of this.keyframes) {
      time = normalizeValueToRange({
        value: sec,
        minValue: k.time[0],
        maxValue: k.time[1],
        a: 0,
        b: 1
      });

      newSettings[k.name] = this.lerp(k.start, k.end, Math.min(time, 1));
    }

    this.setCamera({ ...this.cameraSettings, ...newSettings });
    this.update();

    if (time > 1) {
      this.keyframes = [];
      return;
    }

    requestAnimationFrame(this.animateCamera);
  }

  setVisibility(index, value) {
    this.plotsVisibility[index] = value;

    this.alpha[index] = {
      start: value ? 0 : 1,
      end: value ? 1 : 0,
      time: [performance.now(), performance.now() + 300]
    };
    this.currentAlpha = index;
    this.animateAlpha(performance.now());
  }

  animateAlpha(sec) {
    const currentAlpha = this.alpha[this.currentAlpha];
    let time = normalizeValueToRange({
      value: sec,
      minValue: currentAlpha.time[0],
      maxValue: currentAlpha.time[1],
      a: 0,
      b: 1
    });

    currentAlpha.value = this.lerp(currentAlpha.start, currentAlpha.end, time);

    this.update();

    if (time > 1) {
      return;
    }

    requestAnimationFrame(this.animateAlpha);
  }

  updateVisibility(index, value) {
    this.setVisibility(index, value);
    this.update();
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
    this.colorTextureLocation = gl.getUniformLocation(program, "colorTexture");
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
      this.update();
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
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Load program into GPU
    gl.useProgram(program);

    // Set values to program variables
    gl.uniform1i(this.colorTextureLocation, 0);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, this.viewMatrix);
    gl.uniformMatrix4fv(
      this.projectionMatrixLocation,
      false,
      this.projectionMatrix
    );
    gl.uniform1f(this.thicknessLocation, this.thickness);

    // Render geometry
    for (let i = 0; i < points.length; i++) {
      // if (!this.plotsVisibility[i]) {
      //   continue;
      // }
      gl.uniform4f(
        this.colorLocation,
        ...this.plotColors[i],
        this.alpha[i].value
      );
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

  updateTheme(isDark) {
    this.isDarkTheme = isDark;
  }
}

export default Canvas;
