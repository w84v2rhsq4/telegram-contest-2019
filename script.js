import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import { findPerspective, findExtremeValues, generatePoints } from "./maths";

import "./styles.css";
import vertexShader from "./src/shaders/points.vert";
import fragmentShader from "./src/shaders/points.frag";

const dataSetIndex = 1;

//prettier-ignore
const identityMatrix = [
  1, 0, 0, 0, 
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1 
];

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
  return await response.json();
}

class Application {
  constructor() {
    this.viewTranslateX = 0;
    this.viewTranslateY = 0;
    this.viewTranslateZ = -1;
    this.viewScaleY = 1;
    this.aspect = 0.25;

    this.textureImg = undefined;

    this.points = [];
  }

  handleFrameChange(leftBorder, rightBorder) {
    console.log("callback", leftBorder, rightBorder);
    document.getElementById(
      "frame-changing-results"
    ).innerHTML = `left ${leftBorder} right ${rightBorder}`;
  }

  renderDraggablePlot() {
    new DraggablePlot({
      leftBorder: 60,
      rightBorder: 80,
      frameChangeCallback: this.handleFrameChange
    });
  }

  initCanvasView() {
    const {
      viewScaleY,
      viewTranslateX,
      viewTranslateY,
      viewTranslateZ,
      aspect
    } = this;

    // prettier-ignore
    const viewMatrix = new Float32Array([
      1, 0, 0, 0, 
      0, viewScaleY, 0, 0,
      0, 0, 1, 0,
      viewTranslateX, viewTranslateY, viewTranslateZ, 1 // x y z -0.5 .. 0.5
    ]);
    // prettier-ignore
    const projectionMatrix = findPerspective(
      new Float32Array(identityMatrix),
      Math.PI / 2,
      aspect, // 0 .. 1
      0.01,
      10
    );

    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;
  }

  initCanvas({ $element, projectionMatrix, viewMatrix }) {
    new Canvas({
      vertexShader,
      fragmentShader,
      $canvas: $element,
      data: this.points,
      textureImg: this.textureImg,
      projectionMatrix,
      viewMatrix
    });
  }

  generatePlots({ columns }) {
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    for (let i = 1; i < columns.length; i++) {
      this.points.push(generatePoints(x, columns[i], extremeValues));
    }
  }

  async render() {
    const json = await fetchJson();
    const data = json[dataSetIndex];
    this.textureImg = await fetchTextureImg();

    renderButtons(data);
    renderThemeSwitcher();
    this.renderDraggablePlot();

    this.generatePlots(data);

    this.initCanvasView();

    this.smallCanvas = this.initCanvas({
      $element: document.querySelector("#overall-canvas"),
      projectionMatrix: new Float32Array(identityMatrix),
      viewMatrix: new Float32Array(identityMatrix)
    });

    this.largeCanvas = this.initCanvas({
      $element: document.querySelector("#chart-canvas"),
      projectionMatrix: this.projectionMatrix,
      viewMatrix: this.viewMatrix
    });
  }
}

new Application().render();

// setInterval(() => {
//   aspect += 0.05;
//   largeCanvas.setProjection(
//     findPerspective(
//       new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
//       Math.PI / 2,
//       aspect, // 0 .. 1
//       0.01,
//       10
//     )
//   );
// }, 5000);
