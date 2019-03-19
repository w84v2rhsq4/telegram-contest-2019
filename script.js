import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import { findExtremeValues, generatePoints } from "./maths";

import "./styles.css";

const dataSetIndex = 1;

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
    this.textureImg = undefined;

    this.points = [];

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

    this.largeCanvas
      .setCamera({
        viewTranslateX: this.largeCanvas.viewTranslateX + 0.1
      })
      .update();
  }

  renderDraggablePlot() {
    new DraggablePlot({
      leftBorder: 60,
      rightBorder: 80,
      frameChangeCallback: this.handleFrameChange
    });
  }

  initCanvas($canvas) {
    return new Canvas({
      $canvas,
      points: this.points,
      textureImg: this.textureImg
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

    this.smallCanvas = this.initCanvas(
      document.querySelector("#overall-canvas")
    );

    this.largeCanvas = this.initCanvas(document.querySelector("#chart-canvas"));
    this.largeCanvas
      .setCamera({
        viewScaleY: 1,
        viewTranslateX: 0,
        viewTranslateY: 0,
        viewTranslateZ: -1,
        aspect: 0.25
      })
      .update();
  }
}

new Application().render();
