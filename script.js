import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import { findExtremeValues, generatePoints, normalizedHexToRgb } from "./maths";

import "./styles.css";

const dataSetIndex = 4;

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

function normalizeValue({ value, a, b, minValue, maxValue }) {
  return ((b - a) * (value - minValue)) / (maxValue - minValue) + a;
}

class Application {
  constructor() {
    this.textureImg = undefined;

    this.points = [];
    this.plotColors = [];

    this.smallCanvas = undefined;
    this.largeCanvas = undefined;

    this.left = 20;
    this.right = 80;

    this.extremeValuesMap = {};

    this.handleFrameTranslate = this.handleFrameTranslate.bind(this);
  }

  handleFrameTranslate(left, right) {
    this.left = left;
    this.right = right;

    const width = right - left;
    const value =
      -1 *
      normalizeValue({
        value: left + width / 2,
        a: -(1 - width / 100),
        b: 1 - width / 100,
        minValue: width / 2,
        maxValue: 100 - width / 2
      });
    this.largeCanvas
      .setCamera({
        viewTranslateX: value,
        aspect: (this.right - this.left) / 100
      })
      .update();
  }

  renderDraggablePlot() {
    new DraggablePlot({
      leftBorder: this.left,
      rightBorder: this.right,
      frameTranslateCallback: this.handleFrameTranslate
    });
  }

  initCanvas($canvas, thickness) {
    return new Canvas({
      $canvas,
      points: this.points,
      textureImg: this.textureImg,
      thickness,
      plotColors: this.plotColors
    });
  }

  initPointsForAllPlots({ columns, colors }) {
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    const points = [];
    const plotColors = [];
    for (let i = 1; i < columns.length; i++) {
      const column = columns[i];
      points.push(generatePoints(x, column, extremeValues));
      const name = column[0];
      plotColors.push(normalizedHexToRgb(colors[name]));
    }

    this.points = points;
    this.plotColors = plotColors;
    this.extremeValuesMap = extremeValues;
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
      document.querySelector("#overall-canvas"),
      2.5
    );

    //  const maxY = this.extremeValuesMap.y.max;

    this.largeCanvas = this.initCanvas(
      document.querySelector("#chart-canvas"),
      4.0
    );
    this.largeCanvas
      .setCamera({
        viewScaleY: 1, //1.6,
        viewTranslateX: 0,
        viewTranslateY: 0, //0.6,
        viewTranslateZ: -1,
        aspect: (this.right - this.left) / 100
      })
      .update();
  }
}

new Application().render();
