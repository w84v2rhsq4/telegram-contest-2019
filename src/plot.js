import DraggablePlot from "./draggable-plot";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import { findExtremeValues, generatePoints, normalizedHexToRgb } from "./maths";

function normalizeValue({ value, a, b, minValue, maxValue }) {
  return ((b - a) * (value - minValue)) / (maxValue - minValue) + a;
}

class Plot {
  constructor({ id, data, textureImg }) {
    this.id = id;
    this.data = data;
    this.textureImg = textureImg;

    this.points = [];
    this.plotColors = [];
    this.plotsVisibility = [];

    this.smallCanvas = undefined;
    this.largeCanvas = undefined;

    this.left = 20;
    this.right = 80;

    this.extremeValuesMap = {};

    this.handleFrameTranslate = this.handleFrameTranslate.bind(this);
    this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
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

  handleVisibilityToggle(index, isVisible) {
    this.largeCanvas.setVisibility(index, isVisible).update();
    this.smallCanvas.setVisibility(index, isVisible).update();
  }

  renderDraggablePlot() {
    const { id, left, right, handleFrameTranslate } = this;
    new DraggablePlot({
      plotId: id,
      leftBorder: left,
      rightBorder: right,
      frameTranslateCallback: handleFrameTranslate
    });
  }

  initCanvas($canvas, thickness) {
    return new Canvas({
      $canvas,
      points: this.points,
      textureImg: this.textureImg,
      thickness,
      plotColors: this.plotColors,
      plotsVisibility: this.plotsVisibility
    });
  }

  initPlotsData({ columns, colors }) {
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    const points = [];
    const plotColors = [];
    const visibility = [];
    for (let i = 1; i < columns.length; i++) {
      const column = columns[i];
      points.push(generatePoints(x, column, extremeValues));
      const name = column[0];
      plotColors.push(normalizedHexToRgb(colors[name]));
      visibility.push(true);
    }

    this.points = points;
    this.plotColors = plotColors;
    this.extremeValuesMap = extremeValues;
    this.plotsVisibility = visibility;
  }

  async render() {
    const { id, data, handleVisibilityToggle } = this;

    this.initPlotsData(data);
    renderButtons({
      plotId: id,
      data,
      handleVisibilityToggle,
      checked: this.plotsVisibility
    });

    renderThemeSwitcher();
    this.renderDraggablePlot();

    this.smallCanvas = this.initCanvas(
      document.querySelector(`#overall-canvas-${id}`),
      2.5
    );

    //  const maxY = this.extremeValuesMap.y.max;

    this.largeCanvas = this.initCanvas(
      document.querySelector(`#chart-canvas-${id}`),
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

export default Plot;
