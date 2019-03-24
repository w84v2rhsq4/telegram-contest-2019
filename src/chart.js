import DraggableFrame from "./draggable-frame";
import Canvas from "./canvas";
import Tooltip from "./tooltip";

import { renderButtons, renderThemeSwitcher, Grid } from "./ui";
import {
  findExtremeValues,
  generatePoints,
  hexToNormalizedRgb,
  normalizeValueToRange,
  findIndexOfClosestValue,
  getInverse,
  multiplyVector4,
  identityMatrix
} from "./maths";
import { months } from "./utils";

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
    this.handleFrameDraggingStop = this.handleFrameDraggingStop.bind(this);
    this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
    this.handleGridMouseMove = this.handleGridMouseMove.bind(this);
    this.handleGridMouseLeave = this.handleGridMouseLeave.bind(this);

    this.$largeCanvas = document.querySelector(`#chart-canvas-${id}`);
    this.$smallCanvas = document.querySelector(`#overall-canvas-${id}`);
    this.$gridContainer = document.querySelector(`#grid-${this.id}`);
    this.$tooltipLine = undefined;
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

    const leftIndex = findIndexOfClosestValue(
      this.originalPoints[0],
      normalizeValueToRange({
        value: leftBorder,
        a: this.originalPoints[0][1],
        b: this.originalPoints[0][this.originalPoints[0].length - 1],
        minValue: 0,
        maxValue: 100
      })
    );
    const rightIndex = findIndexOfClosestValue(
      this.originalPoints[0],
      normalizeValueToRange({
        value: rightBorder,
        a: this.originalPoints[0][1],
        b: this.originalPoints[0][this.originalPoints[0].length - 1],
        minValue: 0,
        maxValue: 100
      })
    );

    this.leftIndex = leftIndex;
    this.rightIndex = rightIndex;

    this.currentFrameExtremeValuesMap = findExtremeValues(
      this.originalPoints,
      leftIndex,
      rightIndex
    );
  }

  handleFrameChange(leftBorder, rightBorder, isDragging) {
    const { currentFrameExtremeValuesMap } = this;
    this.updateFrameBorders(leftBorder, rightBorder);

    this.setLocalExtremeValuesMap();

    this.largeCanvas.updateCamera({
      ...this.getCurrentLargeCanvasHorizontalTransform(),
      ...this.getCurrentLargeCanvasVerticalTransform()
    });

    if (!isDragging) {
      this.grid.updateMaxY(currentFrameExtremeValuesMap.y.max).render();
    }
    this.renderTimeline();
  }

  handleFrameDraggingStop() {
    this.grid.updateMaxY(this.currentFrameExtremeValuesMap.y.max).render();
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
    const {
      id,
      leftBorder,
      rightBorder,
      handleFrameChange,
      handleFrameDraggingStop
    } = this;
    new DraggableFrame({
      plotId: id,
      leftBorder,
      rightBorder,
      frameChangeCallback: handleFrameChange,
      handleFrameDraggingStop
    });
  }

  initPlotsData() {
    const { columns, colors } = this.data;
    const extremeValues = findExtremeValues(columns);

    const x = columns[0];
    const points = [];
    const result = [];
    const plotColors = [];
    const visibility = [];

    for (let i = 1; i < columns.length; i++) {
      const column = columns[i];
      const { generatedPoints, resultArray } = generatePoints(x, column, extremeValues);

      result.push(resultArray);
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
    this.resultArray = result;

    this.setLocalExtremeValuesMap();
  }

  renderCanvases() {
    const { $largeCanvas, $smallCanvas } = this;
    const commonOptions = {
      points: this.points,
      textureImg: this.textureImg,
      plotColors: this.plotColors,
      plotsVisibility: this.plotsVisibility
    };

    this.largeCanvas = new Canvas({
      ...commonOptions,
      $canvas: $largeCanvas,
      thickness: 4.0,
      cameraSettings: {
        viewTranslateZ: -1,
        ...this.getCurrentLargeCanvasHorizontalTransform(),
        ...this.getCurrentLargeCanvasVerticalTransform()
      }
    });

    this.smallCanvas = new Canvas({
      ...commonOptions,
      $canvas: $smallCanvas,
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

  renderTooltip() {
    const { id } = this;
    const $tooltip = document.querySelector(`#tooltip-${id}`);
    this.tooltip = new Tooltip({ $tooltip });
  }

  updateTooltip(data) {
    this.tooltip
      .setData(data)
      .render()
      .show();
  }

  handleGridMouseLeave() {
    this.tooltip.hide();
    if (this.$tooltipLine !== undefined) {
      this.$gridContainer.removeChild(this.$tooltipLine);
      this.$tooltipLine = undefined;
    }
  }

  handleGridMouseMove(e) {
    const {
      $gridContainer,
      originalPoints,
      currentFrameExtremeValuesMap,
      data
    } = this;

    // const value = normalizeValueToRange({
    //   value: e.offsetX,
    //   maxValue: $gridContainer.offsetWidth,
    //   minValue: 0,
    //   a: currentFrameExtremeValuesMap.x.min,
    //   b: currentFrameExtremeValuesMap.x.max
    // });
    // const valueIndex = findIndexOfClosestValue(originalPoints[0], value);
    const diff = 100/(this.rightBorder - this.leftBorder);
    const l = normalizeValueToRange({
      value: this.leftBorder,
      maxValue: 100,
      minValue: 0,
      a: -1,
      b: 1
    });
    const r = normalizeValueToRange({
      value: this.rightBorder,
      maxValue: 100,
      minValue: 0,
      a: -1,
      b: 1
    });
    const x = normalizeValueToRange({
      value: e.offsetX,
      maxValue: this.$grid.offsetWidth,
      minValue: 0,
      a: l*diff,
      b: r*diff
    });
    
    let ndc = [
      x,
      -( e.offsetY / this.$grid.offsetHeight ) * 2 + 1,
      0,
      0
    ];

    const Iproj = getInverse(this.largeCanvas.projectionMatrix, new Float32Array(identityMatrix));
    const Iview = getInverse(this.largeCanvas.viewMatrix, new Float32Array(identityMatrix));
    ndc = multiplyVector4( ndc, Iproj );
    ndc = multiplyVector4( ndc, Iview );

    function getValueIndex(array, value) {
      return array.reduce((prev, _, i) => {
        if (i % 2 === 1) {
          return prev;
        }
        return Math.abs(array[i] - value) < Math.abs(array[prev] - value)
          ? i
          : prev;
      }, 0);
    }

    const xyIndex = getValueIndex(this.resultArray[0], ndc[0]);
    const valueIndex = xyIndex / 2 + 1;




    const tooltipData = [];
    for (let i = 1; i < originalPoints.length; i++) {
      const plotName = originalPoints[i][0];
      tooltipData.push({
        name: data.names[plotName],
        value: originalPoints[i][valueIndex],
        color: data.colors[plotName]
      });
    }

    if (typeof this.$tooltipLine === "undefined") {
      this.$tooltipLine = document.createElement("div");
      this.$tooltipLine.className = "vertical-line";
    } else {
      while (this.$tooltipLine.lastChild) {
        this.$tooltipLine.removeChild(this.$tooltipLine.lastChild);
      }
    }

    const tooltipX = normalizeValueToRange({
      value: this.resultArray[0][xyIndex],
      maxValue: r,
      minValue: l,
      a: 0,
      b: $gridContainer.offsetWidth
    });
    this.$tooltipLine.style = `left: ${tooltipX}px`;

    for (let i = 1; i < originalPoints.length; i++) {
      this.$yPoint = document.createElement("div");
      const y = normalizeValueToRange({
        value: originalPoints[i][valueIndex],
        maxValue: currentFrameExtremeValuesMap.y.max,
        minValue: 0,
        a: 0,
        b: $gridContainer.offsetHeight
      });
      this.$yPoint.className = "tooltip-point";

      this.$yPoint.style = ` bottom: ${y}px; border-color: ${
        this.data.colors[this.data.columns[i][0]]
      }`;

      this.$tooltipLine.appendChild(this.$yPoint);
    }

    $gridContainer.appendChild(this.$tooltipLine);

    this.updateTooltip({
      plotsData: tooltipData,
      time: originalPoints[0][valueIndex]
    });
  }

  renderYGrid() {
    const {
      $gridContainer,
      handleGridMouseLeave,
      handleGridMouseMove,
      currentFrameExtremeValuesMap
    } = this;

    this.$grid = document.querySelector(`#blank-${this.id}`);

    this.grid = new Grid({
      $gridContainer,
      handleGridMouseLeave,
      handleGridMouseMove,
      currentYMax: currentFrameExtremeValuesMap.y.max,
      $grid: this.$grid
    });
    this.grid.render();
  }

  renderTimeline() {
    const { id } = this;
    const $container = document.querySelector(`#timeline-${id}`);
    $container.innerHTML = "";
    const { min, max } = this.currentFrameExtremeValuesMap.x;

    const step = (max - min) / 6;
    const data = [];
    for (let i = 0, offset = min; i < 6; i++) {
      const date = new Date(Math.floor(offset));

      data.push(`${months[date.getMonth()]} ${date.getDate()}`);
      offset += step;
    }

    for (let i = 0; i < data.length; i++) {
      const $item = document.createElement("div");
      $item.className = "timeline-item";
      $item.innerHTML = `<span>${data[i]}</span>`;

      $container.appendChild($item);
    }
  }

  async render() {
    this.initPlotsData();
    this.renderButtons();
    this.renderDraggableFrame();
    this.renderCanvases();
    renderThemeSwitcher();
    this.renderTooltip();
    this.renderYGrid();
    this.renderTimeline();
  }
}

export default Chart;
