import DraggableFrame from "./draggable-frame";
import Canvas from "./canvas";

import { renderButtons, renderThemeSwitcher } from "./ui";
import {
  findExtremeValues,
  generatePoints,
  hexToNormalizedRgb,
  normalizeValueToRange
} from "./maths";

class Chart {
  constructor({ id, data, textureImg }) {
    this.id = id;
    this.data = data;
    this.textureImg = textureImg;

    this.points = [];
    this.plotColors = [];
    this.plotsVisibility = [];

    this.smallCanvas = undefined;
    this.largeCanvas = undefined;

    this.leftBorder = 75;
    this.rightBorder = 100;

    this.extremeValuesMap = {};

    this.handleFrameChange = this.handleFrameChange.bind(this);
    this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
  }

  getCurrentLargeCanvasTranslation() {
    const { leftBorder, rightBorder } = this;
    const width = rightBorder - leftBorder;
    return (
      -1 *
      normalizeValueToRange({
        value: leftBorder + width / 2,
        a: -(1 - width / 100),
        b: 1 - width / 100,
        minValue: width / 2,
        maxValue: 100 - width / 2
      })
    );
  }

  getCurrentLargeCanvasAspect() {
    return (this.rightBorder - this.leftBorder) / 100;
  }

  updateFrameBorders(leftBorder, rightBorder) {
    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
  }

  handleFrameChange(leftBorder, rightBorder) {
    this.updateFrameBorders(leftBorder, rightBorder);

    this.largeCanvas.updateCamera({
      viewTranslateX: this.getCurrentLargeCanvasTranslation(),
      aspect: this.getCurrentLargeCanvasAspect()
    });
  }

  handleVisibilityToggle(index, isVisible) {
    this.largeCanvas.updateVisibility(index, isVisible);
    this.smallCanvas.updateVisibility(index, isVisible);

    const diffRatio =
      this.extremeValuesMap.y.max / this.getMaxYOfVisiblePlots();
    const cameraSettings = {
      viewScaleY: diffRatio,
      viewTranslateY: diffRatio - 1
    };

    this.largeCanvas.updateCamera(cameraSettings);
    this.smallCanvas.updateCamera(cameraSettings);
  }

  getMaxYOfVisiblePlots() {
    let newMaxY = 0;
    for (let i = 0; i < this.plotsVisibility.length; i++) {
      if (this.plotsVisibility[i] === false) {
        continue;
      }
      const current = this.extremeValuesMap[`y${i}`].max;
      if (newMaxY < current) {
        newMaxY = current;
      }
    }
    return newMaxY;
  }

  renderDraggableFrame() {
    const { id, leftBorder, rightBorder, handleFrameChange } = this;
    new DraggableFrame({
      plotId: id,
      leftBorder,
      rightBorder,
      frameChangeCallback: handleFrameChange
    });
  }

  initPlotsData() {
    const { columns, colors } = this.data;
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    const points = [];
    const plotColors = [];
    const visibility = [];

    for (let i = 1; i < columns.length; i++) {
      const column = columns[i];
      const { originalPoints, generatedPoints } = generatePoints(
        x,
        column,
        extremeValues
      );
      //  console.log(originalPoints);
      //originalPoints.push(originalPoints);
      points.push(generatedPoints);
      const name = column[0];
      plotColors.push(hexToNormalizedRgb(colors[name]));
      visibility.push(true);
    }

    this.points = points;
    this.plotColors = plotColors;
    this.extremeValuesMap = extremeValues;
    this.plotsVisibility = visibility;
  }

  renderCanvases() {
    const { id } = this;
    const commonOptions = {
      points: this.points,
      textureImg: this.textureImg,
      plotColors: this.plotColors,
      plotsVisibility: this.plotsVisibility
    };

    this.largeCanvas = new Canvas({
      ...commonOptions,
      $canvas: document.querySelector(`#chart-canvas-${id}`),
      thickness: 4.0,
      cameraSettings: {
        viewTranslateX: this.getCurrentLargeCanvasTranslation(),
        aspect: this.getCurrentLargeCanvasAspect(),
        viewTranslateZ: -1
      }
    });

    this.smallCanvas = new Canvas({
      ...commonOptions,
      $canvas: document.querySelector(`#overall-canvas-${id}`),
      thickness: 2.5
    });
  }

  renderButtons() {
    const { id, data, handleVisibilityToggle } = this;
    renderButtons({
      plotId: id,
      data,
      handleVisibilityToggle,
      checked: this.plotsVisibility
    });
  }

  async render() {
    this.initPlotsData();
    this.renderButtons();
    this.renderDraggableFrame();
    this.renderCanvases();
    renderThemeSwitcher();
  }
}

export default Chart;
