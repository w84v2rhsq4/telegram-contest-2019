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

    this.originalPoints = undefined;
    this.totalExtremeValuesMap = {};
    this.currentFrameExtremeValuesMap = {};

    this.handleFrameChange = this.handleFrameChange.bind(this);
    this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
  }

  getCurrentLargeCanvasHorizontalTransform() {
    const { leftBorder, rightBorder } = this;
    const width = rightBorder - leftBorder;

    return {
      viewTranslateX:
        -1 *
        normalizeValueToRange({
          value: leftBorder + width / 2,
          a: -(1 - width / 100),
          b: 1 - width / 100,
          minValue: width / 2,
          maxValue: 100 - width / 2
        }),
      aspect: width / 100
    };
  }

  getCurrentLargeCanvasVerticalTransform() {
    const { totalExtremeValuesMap, currentFrameExtremeValuesMap } = this;
    const diffRatio =
      totalExtremeValuesMap.y.max /
      this.getMaxYOfVisiblePlotsFromMap(currentFrameExtremeValuesMap);

    return {
      viewScaleY: diffRatio,
      viewTranslateY: diffRatio - 1
    };
  }

  getCurrentSmallCanvasVerticalTransform() {
    const { totalExtremeValuesMap } = this;
    const diffRatio =
      totalExtremeValuesMap.y.max /
      this.getMaxYOfVisiblePlotsFromMap(totalExtremeValuesMap);

    return {
      viewScaleY: diffRatio,
      viewTranslateY: diffRatio - 1
    };
  }

  updateFrameBorders(leftBorder, rightBorder) {
    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
  }

  setLocalExtremeValuesMap() {
    const { leftBorder, rightBorder } = this;

    const leftIndex = Math.ceil(
      normalizeValueToRange({
        value: leftBorder,
        a: 0,
        b: this.originalPoints[0].length - 1,
        minValue: 0,
        maxValue: 100
      })
    );
    const rightIndex = Math.floor(
      normalizeValueToRange({
        value: rightBorder,
        a: 0,
        b: this.originalPoints[0].length - 1,
        minValue: 0,
        maxValue: 100
      })
    );

    this.currentFrameExtremeValuesMap = findExtremeValues(
      this.originalPoints,
      leftIndex,
      rightIndex
    );
  }

  handleFrameChange(leftBorder, rightBorder) {
    this.updateFrameBorders(leftBorder, rightBorder);

    this.setLocalExtremeValuesMap();

    this.largeCanvas.updateCamera({
      ...this.getCurrentLargeCanvasHorizontalTransform(),
      ...this.getCurrentLargeCanvasVerticalTransform()
    });
  }

  handleVisibilityToggle(index, isVisible) {
    this.largeCanvas.updateVisibility(index, isVisible);
    this.smallCanvas.updateVisibility(index, isVisible);

    this.largeCanvas.updateCamera(
      this.getCurrentLargeCanvasVerticalTransform()
    );
    this.smallCanvas.updateCamera(
      this.getCurrentSmallCanvasVerticalTransform()
    );
  }

  getMaxYOfVisiblePlotsFromMap(map) {
    let newMaxY = 0;
    for (let i = 0; i < this.plotsVisibility.length; i++) {
      if (this.plotsVisibility[i] === false) {
        continue;
      }
      const current = map[`y${i}`].max;
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
      const { generatedPoints } = generatePoints(x, column, extremeValues);

      points.push(generatedPoints);
      const name = column[0];
      plotColors.push(hexToNormalizedRgb(colors[name]));
      visibility.push(true);
    }

    this.points = points;
    this.plotColors = plotColors;
    this.totalExtremeValuesMap = extremeValues;
    this.plotsVisibility = visibility;
    this.originalPoints = columns;

    this.setLocalExtremeValuesMap();
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
        viewTranslateZ: -1,
        ...this.getCurrentLargeCanvasHorizontalTransform(),
        ...this.getCurrentLargeCanvasVerticalTransform()
      }
    });

    this.smallCanvas = new Canvas({
      ...commonOptions,
      $canvas: document.querySelector(`#overall-canvas-${id}`),
      thickness: 2.5
    });
  }

  renderButtons() {
    const { id, data, handleVisibilityToggle, plotsVisibility } = this;
    renderButtons({
      plotId: id,
      data,
      handleVisibilityToggle,
      checked: plotsVisibility
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
