import { getEventProps } from "./utils";

class DraggableFrame {
  constructor({
    plotId,
    leftBorder,
    rightBorder,
    frameChangeCallback,
    handleFrameDraggingStop
  }) {
    this.containerId = `overall-${plotId}`;
    this.leftGrabberId = `left-grabber-${plotId}`;
    this.rightGrabberId = `right-grabber-${plotId}`;
    this.frameId = `frame-${plotId}`;
    this.leftOverlayId = `left-overlay-${plotId}`;
    this.rightOverlayId = `right-overlay-${plotId}`;
    this.chartContainerId = `chart-container-${plotId}`;

    this.minFrameWidth = 10;

    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
    this.frameChangeCallback = frameChangeCallback;
    this.handleFrameDraggingStop = handleFrameDraggingStop;

    this.frameDraggingStartPoint = undefined;
    this.leftDraggingStartPoint = undefined;
    this.leftDraggingStartPoint = undefined;

    this.$container = document.getElementById(this.containerId);
    this.$leftGrabber = document.getElementById(this.leftGrabberId);
    this.$rightGrabber = document.getElementById(this.rightGrabberId);
    this.$frame = document.getElementById(this.frameId);
    this.$leftOverlay = document.getElementById(this.leftOverlayId);
    this.$rightOverlay = document.getElementById(this.rightOverlayId);
    this.$chartContainer = document.getElementById(this.chartContainerId);

    this.$container.addEventListener("click", this);
    this.$container.addEventListener("mousedown", this);

    this.$container.addEventListener("touchstart", this);

    document.addEventListener("mousemove", this);

    this.$chartContainer.addEventListener("touchmove", this);

    document.addEventListener("mouseup", this);
    this.$chartContainer.addEventListener("touchend", this);

    this.setLeftBorder(this.leftBorder);
    this.setRightBorder(this.rightBorder);
  }

  handleEvent(event) {
    switch (event.type) {
      case "click": {
        this.handleClick(event);
        break;
      }
      case "mousedown": {
        this.handleMouseDown(event);
        break;
      }
      case "touchstart": {
        if (event.touches.length === 1) {
          const { clientX, clientY } = getEventProps(event);
          this.__x = clientX;
          this.__y = clientY;
          this.handleMouseDown(event);
        }
        break;
      }
      case "mousemove": {
        this.handleMouseMove(event);
        break;
      }
      case "touchmove": {
        const { clientX, clientY } = getEventProps(event);
        const x = this.__x - clientX;
        const y = this.__y - clientY;
        if (Math.abs(x) > Math.abs(y)) {
          event.preventDefault();
        } else {
          return;
        }

        console.log(event.target);

        if (event.touches.length === 1) {
          this.handleMouseMove(event);
        }
        break;
      }
      case "mouseup": {
        this.handleMouseUp(event);
        break;
      }
      case "touchend": {
        this.handleMouseUp(event);
        break;
      }
    }
  }

  handleClick(e) {
    const {
      target: { id: targetId }
    } = e;
    const { leftOverlayId, rightOverlayId } = this;
    switch (targetId) {
      case leftOverlayId: {
        this.handleOverlayClick(e, { side: "left" });
        break;
      }
      case rightOverlayId: {
        this.handleOverlayClick(e, { side: "right" });
        break;
      }
    }
  }

  handleMouseDown(e) {
    const {
      target: { id: targetId }
    } = e;
    const { leftGrabberId, rightGrabberId, frameId } = this;
    switch (targetId) {
      case leftGrabberId: {
        this.startLeftGrabberDrag(e);
        break;
      }
      case rightGrabberId: {
        this.startRightGrabberDrag(e);
        break;
      }
      case frameId: {
        this.startFrameDrag(e);
        break;
      }
    }
  }

  handleMouseMove(e) {
    console.log(e.target);
    if (this.isFrameDragging()) {
      // this.disableScroll();
      this.processFrameDrag(e);
    }
    if (this.isLeftGrabberDragging()) {
      // this.disableScroll();
      this.processLeftGrabberDrag(e);
    }
    if (this.isRightGrabberDragging()) {
      // this.disableScroll();
      this.processRightGrabberDrag(e);
    }
  }

  handleMouseUp() {
    if (this.isFrameDragging()) {
      // this.enableScroll();
      this.stopFrameDrag();
    }
    if (this.isLeftGrabberDragging()) {
      // this.enableScroll();
      this.stopLeftGrabberDrag();
    }
    if (this.isRightGrabberDragging()) {
      // this.enableScroll();
      this.stopRightGrabberDrag();
    }
  }

  // disableScroll() {
  //   document.body.classList.add("disabled-scroll");
  // }

  // enableScroll() {
  //   document.body.classList.remove("disabled-scroll");
  // }

  /** Left dragging */
  isLeftGrabberDragging() {
    return this.leftDraggingStartPoint !== undefined;
  }

  startLeftGrabberDrag(e) {
    const { clientX } = getEventProps(e);
    this.leftDraggingStartPoint = clientX;
  }

  processLeftGrabberDrag(e) {
    const { clientX } = getEventProps(e);
    const dx = this.toPercents(this.leftDraggingStartPoint - clientX);

    if (this.rightBorder - (this.leftBorder - dx) > this.minFrameWidth) {
      this.setBorders(this.leftBorder - dx, this.rightBorder);

      this.leftDraggingStartPoint = clientX;
    }
  }

  stopLeftGrabberDrag() {
    this.leftDraggingStartPoint = undefined;
    this.handleFrameDraggingStop();
  }

  /** Right dragging */
  isRightGrabberDragging() {
    return this.rightDraggingStartPoint !== undefined;
  }

  startRightGrabberDrag(e) {
    const { clientX } = getEventProps(e);
    this.rightDraggingStartPoint = clientX;
  }

  processRightGrabberDrag(e) {
    const { clientX } = getEventProps(e);
    const dx = this.toPercents(this.rightDraggingStartPoint - clientX);

    if (this.rightBorder - dx - this.leftBorder > this.minFrameWidth) {
      this.setBorders(this.leftBorder, this.rightBorder - dx);

      this.rightDraggingStartPoint = clientX;
    }
  }

  stopRightGrabberDrag() {
    this.rightDraggingStartPoint = undefined;
    this.handleFrameDraggingStop();
  }

  /** Frame dragging */
  isFrameDragging() {
    return this.frameDraggingStartPoint !== undefined;
  }

  startFrameDrag(e) {
    const { clientX } = getEventProps(e);
    this.frameDraggingStartPoint = clientX;
  }

  processFrameDrag(e) {
    const { clientX } = getEventProps(e);

    let dx = this.toPercents(this.frameDraggingStartPoint - clientX);

    this.setBorders(this.leftBorder - dx, this.rightBorder - dx);

    this.frameDraggingStartPoint = clientX;
  }

  stopFrameDrag() {
    this.frameDraggingStartPoint = undefined;
    this.handleFrameDraggingStop();
  }

  /** Overlay click  */
  handleOverlayClick(e, { side }) {
    const { offsetX } = e;
    let offsetInPercents = this.toPercents(offsetX);
    if (side === "right") {
      offsetInPercents += this.rightBorder;
    }
    this.setFrameByCenter(offsetInPercents);
  }

  /******/
  setFrameByCenter(x) {
    const frameWidthInPercents = this.rightBorder - this.leftBorder;
    this.setBorders(x - frameWidthInPercents / 2, x + frameWidthInPercents / 2);
  }

  setBorders(leftBorder, rightBorder) {
    let newLeftBorder = leftBorder;
    let newRightBorder = rightBorder;
    const frameWidthInPercents = this.rightBorder - this.leftBorder;

    if (newLeftBorder < 0) {
      newLeftBorder = 0;
      newRightBorder = frameWidthInPercents;
    } else if (newRightBorder > 100) {
      newRightBorder = 100;
      newLeftBorder = 100 - frameWidthInPercents;
    }

    const isDragging =
      this.isFrameDragging() ||
      this.isLeftGrabberDragging() ||
      this.isRightGrabberDragging();

    this.frameChangeCallback(newLeftBorder, newRightBorder, isDragging);
    this.setLeftBorder(newLeftBorder);
    this.setRightBorder(newRightBorder);
  }

  setLeftBorder(percents) {
    this.$leftOverlay.style["width"] = `${percents}%`;
    this.$frame.style["left"] = `${percents}%`;
    this.leftBorder = percents;
  }

  setRightBorder(percents) {
    this.$rightOverlay.style["width"] = `${100 - percents}%`;
    this.$frame.style["width"] = `${percents - this.leftBorder}%`;
    this.rightBorder = percents;
  }

  toPercents(x) {
    return (x * 100) / this.$container.offsetWidth;
  }
}

export default DraggableFrame;
