import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import { findPerspective, findExtremeValues, generatePoints } from "./maths";

import "./styles.css";

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
    this.viewScaleY = 1;
    this.viewTranslateX = 0;
    this.viewTranslateY = 0;
    this.viewTranslateZ = -1;
    this.aspect = 0.25;

    this.textureImg = undefined;

    this.points = [];

    this.viewMatrix = undefined;
    this.projectionMatrix = undefined;

    this.smallCanvas = undefined;
    this.largeCanvas = undefined;

    this.handleFrameChange = this.handleFrameChange.bind(this);
  }

  handleFrameChange(leftBorder, rightBorder) {
    console.log("callback", leftBorder, rightBorder);
    document.getElementById(
      "frame-changing-results"
    ).innerHTML = `left ${leftBorder} right ${rightBorder}`;
    console.log("frame change");

    this.viewTranslateX += 0.1;
    this.setCameraView({
      viewTranslateX: this.viewTranslateX
    });
    this.largeCanvas.setView(this.viewMatrix);
  }

  renderDraggablePlot() {
    new DraggablePlot({
      leftBorder: 60,
      rightBorder: 80,
      frameChangeCallback: this.handleFrameChange
    });
  }

  setCameraView({
    viewScaleY = this.viewScaleY,
    viewTranslateX = this.viewTranslateX,
    viewTranslateY = this.viewTranslateY,
    viewTranslateZ = this.viewTranslateZ
  }) {
    console.log(viewScaleY);
    console.log(viewTranslateX, viewTranslateY, viewTranslateZ);
    // prettier-ignore
    const viewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, viewScaleY, 0, 0,
      0, 0, 1, 0,
      viewTranslateX, viewTranslateY, viewTranslateZ, 1 // x y z -0.5 .. 0.5
    ]);

    this.viewMatrix = viewMatrix;
  }

  setCameraProjection({ aspect }) {
    const projectionMatrix = findPerspective(
      new Float32Array(identityMatrix),
      Math.PI / 2,
      aspect, // 0 .. 1
      0.01,
      10
    );

    this.projectionMatrix = projectionMatrix;
  }

  initCameraView() {
    this.setCameraView({
      viewScaleY: this.viewScaleY,
      viewTranslateX: this.viewTranslateX,
      viewTranslateY: this.viewTranslateY,
      viewTranslateZ: this.viewTranslateZ
    });

    this.setCameraProjection({ aspect: this.aspect });
  }

  initCanvas({ $element, projectionMatrix, viewMatrix }) {
    return new Canvas({
      $canvas: $element,
      points: this.points,
      textureImg: this.textureImg,
      projectionMatrix,
      viewMatrix
    });
  }

  initPointsForAllPlots({ columns }) {
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    const points = [];
    for (let i = 1; i < columns.length; i++) {
      points.push(generatePoints(x, columns[i], extremeValues));
    }

    this.points = points;
  }

  async render() {
    const json = await fetchJson();
    const data = json[dataSetIndex];
    this.textureImg = await fetchTextureImg();

    renderButtons(data);
    renderThemeSwitcher();
    this.renderDraggablePlot();

    this.initPointsForAllPlots(data);

    this.initCameraView();

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
