import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import "./styles.css";
import vertexShader from "./src/shaders/points.vert";
import fragmentShader from "./src/shaders/points.frag";

const dataSetIndex = 4;

function insertButtons(data) {
  const { colors, names } = data;

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

function initDraggablePlot() {
  new DraggablePlot({
    leftBorder: 60,
    rightBorder: 80,
    frameChangeCallback: (leftBorder, rightBorder) => {
      document.getElementById(
        "frame-changing-results"
      ).innerHTML = `left ${leftBorder} right ${rightBorder}`;
    }
  });
}

function initCanvas() {}

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
  return new Promise(resolve => {
    image.onload = () => {
      resolve(image);
    };
  });
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
  insertButtons(data[dataSetIndex]);
  initDraggablePlot();
  initThemeSwitcher();

  const plotColumns = data[dataSetIndex].columns;
  console.log("plotcolumns", plotColumns);
  // const p = [];
  // const xAxis = plotColumns[0];
  // for (let i = 0; i < plotColumns.length; i++) {
  //   p[i] = buildPoints(xAxis, plotColumns[i]);
  // }

  const x = plotColumns[0];
  const y0 = plotColumns[1];
  const y1 = plotColumns[2];
  const y2 = plotColumns[3];
  const y3 = plotColumns[4];

  const extremeValues = findExtremeValues(plotColumns);
  console.log("extremevalues", extremeValues);

  const points1 = buildPoints(x, y0, extremeValues);
  const points2 = buildPoints(x, y1, extremeValues);
  const points3 = buildPoints(x, y2, extremeValues);
  const points4 = buildPoints(x, y3, extremeValues);

  const textureImg = await fetchTextureImg();
  new Canvas({
    vertexShader,
    fragmentShader,
    $canvas: document.querySelector("#overall-canvas"),
    data: [points1, points2, points3, points4],
    textureImg
  });

  new Canvas({
    vertexShader,
    fragmentShader,
    $canvas: document.querySelector("#chart-canvas"),
    data: [points1, points2, points3, points4],
    textureImg
  });
}

main();

function findExtremeValues(plots) {
  const maxX = Math.max(...iterate(plots[0]));
  const minX = Math.min(...iterate(plots[0]));
  const yMaxValues = [];
  const yMinValues = [];
  for (let i = 1; i < plots.length; i++) {
    yMaxValues.push(Math.max(...iterate(plots[i])));
    yMinValues.push(Math.min(...iterate(plots[i])));
  }

  const extremeValuesMap = {
    x: {
      max: maxX,
      min: minX
    },
    y: {
      max: Math.max(...yMaxValues),
      min: Math.min(...yMinValues)
    }
  };
  return extremeValuesMap;
}

function buildPoints(x, y, extremeValues) {
  const maxY = extremeValues.y.max; //Math.max(...iterate(y));
  const minY = extremeValues.y.min; // Math.min(...iterate(y));
  console.log("max", maxY);
  const maxX = extremeValues.x.max; // Math.max(...iterate(x));
  const minX = extremeValues.x.min; //Math.min(...iterate(x));

  const resultArray = new Array(x.length - 1 + y.length - 1);
  for (let i = 0; i < resultArray.length / 2; i += 2) {
    resultArray[i] = (2 * (x[i + 1] - minX)) / (maxX - minX) - 1;
    resultArray[i + 1] = (2 * (y[i + 1] - minY)) / (maxY - minY) - 1;
    if (isNaN(resultArray[i]) || isNaN(resultArray[i + 1])) {
      debugger;
    }
  }

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

  const points = [];
  for (let i = 0; i < resultArray.length - 2; i += 2) {
    const a = [resultArray[i], resultArray[i + 1]];
    const b = [resultArray[i + 2], resultArray[i + 3]];

    let step = distanceTo(a, b) * 1800;
    for (let j = 0; j < step; j++) {
      points.push(lerp(a, b, j / step));
    }
  }

  return points.flat();
}
