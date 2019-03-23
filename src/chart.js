import DraggableFrame from "./draggable-frame";
import Canvas from "./canvas";
import Tooltip from "./tooltip";

import { renderButtons, renderThemeSwitcher } from "./ui";
import {
  findExtremeValues,
  generatePoints,
  hexToNormalizedRgb,
  normalizeValueToRange,
  findIndexOfClosestValue
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

  handleFrameChange(leftBorder, rightBorder) {
    this.updateFrameBorders(leftBorder, rightBorder);

    this.setLocalExtremeValuesMap();

    this.largeCanvas.updateCamera({
      ...this.getCurrentLargeCanvasHorizontalTransform(),
      ...this.getCurrentLargeCanvasVerticalTransform()
    });

    this.renderGrid();
    this.renderTimeline();
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

    const $largeCanvas = document.querySelector(`#chart-canvas-${id}`);
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

  renderTooltip() {
    const { id } = this;
    const $tooltip = document.querySelector(`#tooltip-${id}`);
    this.tooltip = new Tooltip({ $tooltip });
  }

  updateTooltip(data) {
    this.tooltip.updateData(data);
    this.tooltip.rerender();
  }

  renderGrid() {
    const { id, currentFrameExtremeValuesMap } = this;
    const $container = document.querySelector(`#grid-${id}`);

    if ($container.children.length > 1) {
      $container.children[0].remove();
    }
    const $grid = document.createElement("div");
    $grid.className = "y-grid";
    const itemHeight = ($container.offsetHeight * 0.9) / 5 - 1;

    const max = currentFrameExtremeValuesMap.y.max * 0.9;

    const step = max / 5;
    const data = [];
    for (let i = 0, offset = 0; i < 6; i++) {
      data.push(Math.floor(offset));
      offset += step;
    }

    let bottom = 0;
    for (let i = 0; i < data.length; i++) {
      const $item = document.createElement("div");
      $item.className = "y-grid-item";
      $item.innerHTML = `<span>${data[i]}</span>`;
      $item.style.bottom = `${bottom}px`;
      $grid.appendChild($item);
      bottom += itemHeight;
    }
    $container.appendChild($grid);

    if ($container.children.length > 1) {
      if (this.currentFrameExtremeValuesMap.y.max < this.currentGridMax) {
        $container.children[0].classList.add("animate-up");
        $container.children[1].classList.add("animate-down");

        $grid.offsetWidth;
        $container.children[1].classList.remove("animate-down");
      } else {
        $container.children[0].classList.add("animate-down");
        $container.children[1].classList.add("animate-up");

        $grid.offsetWidth;
        $container.children[1].classList.remove("animate-up");
      }
    }

    this.currentGridMax = this.currentFrameExtremeValuesMap.y.max;
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

    this.renderGrid();
    this.renderTimeline();

    const $grid = document.querySelector(`#grid-${this.id}`);

    $grid.addEventListener("mousemove", e => {
      console.log(e.offsetX);

      const value = normalizeValueToRange({
        value: e.offsetX,
        maxValue: $grid.offsetWidth,
        minValue: 0,
        a: this.currentFrameExtremeValuesMap.x.min,
        b: this.currentFrameExtremeValuesMap.x.max
      });

      const valueIndex = findIndexOfClosestValue(this.originalPoints[0], value);

      console.log("vallue index", e.offsetX, $grid.offsetWidth,);
      const tooltipData = [];

      for (let i = 1; i < this.originalPoints.length; i++) {
        const plotName = this.originalPoints[i][0];
        tooltipData.push({
          name: this.data.names[plotName],
          value: this.originalPoints[i][valueIndex],
          color: this.data.colors[plotName]
        });
      }

      this.updateTooltip({
        plotsData: tooltipData,
        time: this.originalPoints[0][valueIndex]
      });
    });
  }
}

export default Chart;
