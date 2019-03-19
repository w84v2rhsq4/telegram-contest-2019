class Canvas {
  constructor({
    $canvas,
    vertexShader,
    fragmentShader,
    data,
    textureImg,
    viewMatrix,
    projectionMatrix
  }) {
    this.$canvas = $canvas;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.data = data;
    this.textureImg = textureImg;
    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;

    this.colorLocation = undefined;
    this.viewMatrixLocation = undefined;
    this.projectionMatrixLocation = undefined;

    this.gl = undefined;
    this.buffers = [];
    this.redraw = true;

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

  initVertexBuffers() {
    const { gl, data, buffers } = this;
    for (let i = 0; i < data.length; i++) {
      buffers[i] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data[i]), gl.STATIC_DRAW);
    }
  }

  setProjection(newProjectionMatrix) {
    this.projectionMatrix = newProjectionMatrix;

    this.redraw = true;
  }

  setView(newViewMatrix) {
    this.viewMatrix = newViewMatrix;

    this.redraw = true;
  }

  createProgram() {
    const { gl, vertexShader, fragmentShader } = this;
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
    this.viewMatrixLocation = gl.getUniformLocation(this.program, "viewMatrix");
    this.projectionMatrixLocation = gl.getUniformLocation(
      this.program,
      "projectionMatrix"
    );
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

  animate() {
    const { redraw } = this;
    if (redraw) {
      this.render();
    }
    requestAnimationFrame(this.animate);
  }

  render() {
    const { gl, program, data } = this;
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

    // Render geometry
    for (let i = 0; i < data.length; i++) {
      this.gl.uniform3f(
        this.colorLocation,
        0.9529411764705882,
        0.2980392156862745,
        0.26666666666666666
      );
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers[i]);
      this.gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(0);
      this.gl.drawArrays(this.gl.POINTS, 0, data[i].length / 2);
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
