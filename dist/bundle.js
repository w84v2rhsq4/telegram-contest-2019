/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__draggable_plot__ = __webpack_require__(1);


var reflow = true;

var canvas,
  gl,
  buffer,
  vertex_shader,
  fragment_shader,
  currentProgram,
  vertex_position,
  timeLocation,
  resolutionLocation,
  parameters = {
    start_time: new Date().getTime(),
    time: 0,
    screenWidth: 0,
    screenHeight: 0
  };

let points;

function insertButtons(data) {
  const { colors, names } = data[0];
  console.log(colors, names);

  const buttonsContainer = document.getElementById("buttons");
  const plots = Object.keys(names);
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const button = document.createElement("button");
    button.classList.add("button");
    button.innerHTML = `<i class="tick-icon" style="background-color:${
      colors[plot]
    }"></i>${names[plot]}`;
    buttonsContainer.appendChild(button);
  }

  buttonsContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") {
      e.target.classList.toggle("checked");
    }
  });
}

function initFrame() {
  const draggablePlot = new __WEBPACK_IMPORTED_MODULE_0__draggable_plot__["a" /* default */]({
    leftBorder: 60,
    rightBorder: 80,
    frameChangeCallback: (leftBorder, rightBorder) => {
      document.getElementById(
        "frame-changing-results"
      ).innerHTML = `left ${leftBorder} right ${rightBorder}`;
    }
  });
}

async function fetchTextureImg() {
  const image = new Image();
  image.src = "./green.png";
  await new Promise(resolve => {
    image.onload = () => {
      createTexture(image);
      resolve();
    };
  });
}

function createTexture(image) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
}

async function fetchJson() {
  const response = await fetch("chart_data.json");
  const data = await response.json();

  return data;
}

function* iterate(arr) {
  for (let i = 1; i < arr.length; i++) {
    yield arr[i];
  }
}

async function main() {
  const data = await fetchJson();
  console.log(data);
  insertButtons(data);
  initFrame();
  buildPoints(data);
  init();

  await fetchTextureImg();
  resizeCanvas();
  animate();
}

main();

function buildPoints(data) {
  const columns = data[4].columns;
  const y0 = columns[1];
  const x = columns[0];

  const maxY = Math.max(...iterate(y0));
  const minY = Math.min(...iterate(y0));
  console.log("max", maxY);
  const maxX = Math.max(...iterate(x));
  const minX = Math.min(...iterate(x));

  const resultArray = new Array(x.length - 1 + y0.length - 1);
  for (let i = 0; i < resultArray.length / 2; i += 2) {
    resultArray[i] = (2 * (x[i + 1] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y0[i + 1] - minY)) / (maxY - minY) - 1;
    if (isNaN(resultArray[i]) || isNaN(resultArray[i + 1])) {
      debugger;
    }
  }

  points = resultArray;

  function lerp(a, b, t) {
    const out = [];
    const ax = a[0];
    const ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
  }

  function distanceTo(a, b) {
    return Math.sqrt(distanceToSquared(a, b));
  }
  function distanceToSquared(a, b) {
    var dx = a[0] - b[0],
      dy = a[1] - b[1];
    return dx * dx + dy * dy;
  }

  // let step = 100;
  const new_points = [];
  for (let i = 0; i < points.length - 2; i += 2) {
    const a = [points[i], points[i + 1]];
    const b = [points[i + 2], points[i + 3]];

    let step = distanceTo(a, b) * 1800;
    for (let j = 0; j < step; j++) {
      new_points.push(lerp(a, b, j / step));
    }
  }
  points = new_points.flat();
  console.log(points.length);
}

function init() {
  vertex_shader = document.getElementById("vs").textContent;
  fragment_shader = document.getElementById("fs").textContent;

  canvas = document.querySelector("canvas");

  // Initialise WebGL

  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (error) {}

  if (!gl) {
    throw "cannot create webgl context";
  }

  // Create Vertex buffer (2 triangles)

  buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

  // Create Program

  currentProgram = createProgram(vertex_shader, fragment_shader);

  timeLocation = gl.getUniformLocation(currentProgram, "time");
  resolutionLocation = gl.getUniformLocation(currentProgram, "resolution");
}

function createProgram(vertex, fragment) {
  var program = gl.createProgram();

  var vs = createShader(vertex, gl.VERTEX_SHADER);
  var fs = createShader(
    "#ifdef GL_ES\nprecision highp float;\n#endif\n\n" + fragment,
    gl.FRAGMENT_SHADER
  );

  if (vs == null || fs == null) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  gl.linkProgram(program);

  // if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  //   alert(
  //     "ERROR:\n" +
  //       "VALIDATE_STATUS: " +
  //       gl.getProgramParameter(program, gl.VALIDATE_STATUS) +
  //       "\n" +
  //       "ERROR: " +
  //       gl.getError() +
  //       "\n\n" +
  //       "- Vertex Shader -\n" +
  //       vertex +
  //       "\n\n" +
  //       "- Fragment Shader -\n" +
  //       fragment
  //   );

  //   return null;
  // }

  return program;
}

function createShader(src, type) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      (type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") +
        " SHADER:\n" +
        gl.getShaderInfoLog(shader)
    );
    return null;
  }

  return shader;
}

function resizeCanvas(event) {
  if (
    canvas.width != canvas.clientWidth ||
    canvas.height != canvas.clientHeight
  ) {
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;

    // parameters.screenWidth = canvas.width;
    // parameters.screenHeight = canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    reflow = true;
  }
}
window.onresize = resizeCanvas;

function animate() {
  if (true) {
    render();
  }
  requestAnimationFrame(animate);
}

function render() {
  if (!currentProgram) return;

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.SRC_COLOR,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA
  );
  //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  parameters.time = new Date().getTime() - parameters.start_time;
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Load program into GPU

  gl.useProgram(currentProgram);

  // Set values to program variables

  gl.uniform1f(timeLocation, parameters.time / 1000);
  gl.uniform2f(
    resolutionLocation,
    parameters.screenWidth,
    parameters.screenHeight
  );
  gl.uniform1i(gl.getUniformLocation(currentProgram, "colorTexture"), 0);

  // Render geometry

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_position);
  gl.drawArrays(gl.POINTS, 0, points.length / 2);
  gl.disableVertexAttribArray(vertex_position);
  reflow = false;
}


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const containerId = "overall";
const leftGrabberId = "left-grabber";
const rightGrabberId = "right-grabber";
const frameId = "frame";
const leftOverlayId = "left-overlay";
const rightOverlayId = "right-overlay";

class DraggablePlot {
  constructor({ leftBorder, rightBorder, frameChangeCallback }) {
    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
    this.frameChangeCallback = frameChangeCallback;

    this.bindEvents();
  }

  bindEvents() {
    this.frameDraggingStartPoint = undefined;

    this.$container = document.getElementById(containerId);
    this.$leftGrabber = document.getElementById(leftGrabberId);
    this.$rightGrabber = document.getElementById(rightGrabberId);
    this.$frame = document.getElementById(frameId);
    this.$leftOverlay = document.getElementById(leftOverlayId);
    this.$rightOverlay = document.getElementById(rightOverlayId);

    this.$container.addEventListener("click", this);
    this.$container.addEventListener("mousedown", this);
    document.addEventListener("mousemove", this);
    document.addEventListener("mouseup", this);

    this.setLeftBorder(this.leftBorder);
    this.setRightBorder(this.rightBorder);
  }

  handleEvent(event) {
    switch (event.type) {
      case "click": {
        this.handleClick(event);
        break;
      }
      case "mousemove": {
        this.handleMouseMove(event);
        break;
      }
      case "mouseleave": {
        break;
      }
      case "mousedown": {
        this.handleMouseDown(event);
        break;
      }
      case "mouseup": {
        this.handleMouseUp(event);
        break;
      }
    }
  }

  handleClick(e) {
    const {
      target: { id: targetId }
    } = e;
    switch (targetId) {
      case leftGrabberId: {
        break;
      }
      case rightGrabberId: {
        break;
      }
      case frameId: {
        break;
      }
      case leftOverlayId: {
        this.handleOverlayClick(e, { side: "left" });
        break;
      }
      case rightOverlayId: {
        this.handleOverlayClick(e, { side: "right" });
        break;
      }
    }
  }

  handleMouseDown(e) {
    const {
      target: { id: targetId }
    } = e;
    switch (targetId) {
      case frameId: {
        this.startFrameDrag(e);
        break;
      }
    }
  }

  handleMouseMove(e) {
    if (this.isFrameDragging()) {
      this.processFrameDrag(e);
    }
  }

  handleMouseUp(e) {
    if (this.isFrameDragging()) {
      this.stopFrameDrag();
    }
  }

  /** Frame dragging */
  isFrameDragging() {
    return this.frameDraggingStartPoint !== undefined;
  }
  startFrameDrag(e) {
    const { clientX } = e;
    console.log("start", clientX);
    this.frameDraggingStartPoint = clientX;
  }

  processFrameDrag(e) {
    const { clientX } = e;
    const x = clientX - this.frameDraggingStartPoint;

    if (x === 0) {
      return;
    }
    this.setFrameByCenter(this.toPercents(Math.abs(clientX)));
    this.frameDraggingStartPoint = clientX;
  }

  stopFrameDrag() {
    this.frameDraggingStartPoint = undefined;
  }

  /** Overlay click  */
  handleOverlayClick(e, { side }) {
    const { offsetX } = e;
    let offsetInPercents = this.toPercents(offsetX);
    if (side === "right") {
      offsetInPercents += this.rightBorder;
    }
    this.setFrameByCenter(offsetInPercents);
  }

  /** */
  setFrameByCenter(x) {
    const frameWidthInPercents = this.rightBorder - this.leftBorder;

    let newLeftBorder = x - frameWidthInPercents / 2;
    let newRightBorder = x + frameWidthInPercents / 2;

    if (newLeftBorder < 0) {
      newLeftBorder = 0;
      newRightBorder = frameWidthInPercents;
    } else if (newRightBorder > 100) {
      newRightBorder = 100;
      newLeftBorder = 100 - frameWidthInPercents;
    }

    this.setLeftBorder(newLeftBorder);
    this.setRightBorder(newRightBorder);
  }

  setLeftBorder(percents) {
    this.$leftOverlay.style["width"] = `${percents}%`;
    this.$frame.style["left"] = `${percents}%`;
    this.leftBorder = percents;
    this.frameChangeCallback(this.leftBorder, this.rightBorder);
  }

  setRightBorder(percents) {
    this.$rightOverlay.style["width"] = `${100 - percents}%`;
    this.$frame.style["width"] = `${percents - this.leftBorder}%`;
    this.rightBorder = percents;
    this.frameChangeCallback(this.leftBorder, this.rightBorder);
  }

  toPercents(x) {
    return Math.ceil((x * 100) / this.$container.offsetWidth);
  }
}

/* harmony default export */ __webpack_exports__["a"] = (DraggablePlot);


/***/ })
/******/ ]);