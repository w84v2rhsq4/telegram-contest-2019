import DraggablePlot from "./draggable-plot";

import "./styles.css";

var reflow = true;

var canvas,
  gl,
  buffer,
  buffer2,
  vertex_shader,
  fragment_shader,
  currentProgram,
  vertex_position,
  colorLocation,
  parameters = {
    start_time: new Date().getTime(),
    time: 0,
    screenWidth: 0,
    screenHeight: 0
  };

let points, points2;

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
  const draggablePlot = new DraggablePlot({
    leftBorder: 60,
    rightBorder: 80,
    frameChangeCallback: (leftBorder, rightBorder) => {
      document.getElementById(
        "frame-changing-results"
      ).innerHTML = `left ${leftBorder} right ${rightBorder}`;
    }
  });
}

function initThemeSwitcher() {
  document.getElementById("theme-switcher").addEventListener("click", e => {
    const nightMode = document.body.classList.contains("dark");
    console.log("nightMode: ", nightMode);

    e.target.innerText = `Switch to ${nightMode ? "Night Mode" : "Day Mode"}`;

    document.body.classList.toggle("dark");
  });
}

async function fetchTextureImg() {
  const image = new Image();
  image.src = "./black.png";
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
  initThemeSwitcher();

  const plotColumns = data[4].columns;
  const y0 = plotColumns[1];
  const y1 = plotColumns[2];
  const x = plotColumns[0];
  points = buildPoints(x, y0);
  points2 = buildPoints(x, y1);
  init();

  await fetchTextureImg();
  resizeCanvas();
  animate();
}

main();

function buildPoints(x, y) {
  // const columns = data[4].columns;
  // const y0 = columns[1];
  // const x = columns[0];

  const maxY = Math.max(...iterate(y));
  const minY = Math.min(...iterate(y));
  console.log("max", maxY);
  const maxX = Math.max(...iterate(x));
  const minX = Math.min(...iterate(x));

  const resultArray = new Array(x.length - 1 + y.length - 1);
  for (let i = 0; i < resultArray.length / 2; i += 2) {
    resultArray[i] = (2 * (x[i + 1] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y[i + 1] - minY)) / (maxY - minY) - 1;
    if (isNaN(resultArray[i]) || isNaN(resultArray[i + 1])) {
      debugger;
    }
  }

  // points = resultArray;

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
  for (let i = 0; i < resultArray.length - 2; i += 2) {
    const a = [resultArray[i], resultArray[i + 1]];
    const b = [resultArray[i + 2], resultArray[i + 3]];

    let step = distanceTo(a, b) * 1800;
    for (let j = 0; j < step; j++) {
      new_points.push(lerp(a, b, j / step));
    }
  }
  // points = new_points.flat();
  // console.log(points.length);

  return new_points.flat();
}

function init() {
  vertex_shader = document.getElementById("vs").textContent;
  fragment_shader = document.getElementById("fs").textContent;

  canvas = document.querySelector("#overall-canvas");

  // Initialise WebGL

  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (error) {}

  if (!gl) {
    throw "cannot create webgl context";
  }

  // Create Vertex buffer (2 triangles)

  buffer = gl.createBuffer();
  buffer2 = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points2), gl.STATIC_DRAW);

  // Create Program

  currentProgram = createProgram(vertex_shader, fragment_shader);

  colorLocation = gl.getUniformLocation(currentProgram, "color");
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
  if (reflow) {
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

  gl.uniform3f(
    colorLocation,
    0.9529411764705882,
    0.2980392156862745,
    0.26666666666666666
  );
  gl.uniform1i(gl.getUniformLocation(currentProgram, "colorTexture"), 0);

  // Render geometry

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_position);
  gl.drawArrays(gl.POINTS, 0, points.length / 2);

  gl.uniform3f(colorLocation, 0.24, 0.76, 0.25);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
  gl.vertexAttribPointer(vertex_position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertex_position);
  gl.drawArrays(gl.POINTS, 0, points2.length / 2);
  console.log(points, points2);
  gl.disableVertexAttribArray(vertex_position);
  reflow = false;
}
