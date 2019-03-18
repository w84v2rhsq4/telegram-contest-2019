const containerId = "overall";
const leftGrabberId = "left-grabber";
const rightGrabberId = "right-grabber";
const frameId = "frame";
const leftOverlayId = "left-overlay";
const rightOverlayId = "right-overlay";

class DraggablePlot {
  constructor({ leftBorder, rightBorder, frameChangeCallback }) {
    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
    this.frameChangeCallback = frameChangeCallback;

    this.bindEvents();
  }

  bindEvents() {
    this.frameDraggingStartPoint = undefined;

    this.$container = document.getElementById(containerId);
    this.$leftGrabber = document.getElementById(leftGrabberId);
    this.$rightGrabber = document.getElementById(rightGrabberId);
    this.$frame = document.getElementById(frameId);
    this.$leftOverlay = document.getElementById(leftOverlayId);
    this.$rightOverlay = document.getElementById(rightOverlayId);

    this.$container.addEventListener("click", this);
    this.$container.addEventListener("mousedown", this);
    document.addEventListener("mousemove", this);
    document.addEventListener("mouseup", this);

    this.setLeftBorder(this.leftBorder);
    this.setRightBorder(this.rightBorder);
  }

  handleEvent(event) {
    switch (event.type) {
      case "click": {
        this.handleClick(event);
        break;
      }
      case "mousemove": {
        this.handleMouseMove(event);
        break;
      }
      case "mouseleave": {
        break;
      }
      case "mousedown": {
        this.handleMouseDown(event);
        break;
      }
      case "mouseup": {
        this.handleMouseUp(event);
        break;
      }
    }
  }

  handleClick(e) {
    const {
      target: { id: targetId }
    } = e;
    switch (targetId) {
      case leftGrabberId: {
        break;
      }
      case rightGrabberId: {
        break;
      }
      case frameId: {
        break;
      }
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
    switch (targetId) {
      case frameId: {
        this.startFrameDrag(e);
        break;
      }
    }
  }

  handleMouseMove(e) {
    if (this.isFrameDragging()) {
      this.processFrameDrag(e);
    }
  }

  handleMouseUp(e) {
    if (this.isFrameDragging()) {
      this.stopFrameDrag();
    }
  }

  /** Frame dragging */
  isFrameDragging() {
    return this.frameDraggingStartPoint !== undefined;
  }
  startFrameDrag(e) {
    const { clientX } = e;
    console.log("start", clientX);
    this.frameDraggingStartPoint = clientX;
  }

  processFrameDrag(e) {
    const { clientX } = e;
    const x = clientX - this.frameDraggingStartPoint;

    if (x === 0) {
      return;
    }
    this.setFrameByCenter(this.toPercents(Math.abs(clientX)));
    this.frameDraggingStartPoint = clientX;
  }

  stopFrameDrag() {
    this.frameDraggingStartPoint = undefined;
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

  /** */
  setFrameByCenter(x) {
    const frameWidthInPercents = this.rightBorder - this.leftBorder;

    let newLeftBorder = x - frameWidthInPercents / 2;
    let newRightBorder = x + frameWidthInPercents / 2;

    if (newLeftBorder < 0) {
      newLeftBorder = 0;
      newRightBorder = frameWidthInPercents;
    } else if (newRightBorder > 100) {
      newRightBorder = 100;
      newLeftBorder = 100 - frameWidthInPercents;
    }

    this.setLeftBorder(newLeftBorder);
    this.setRightBorder(newRightBorder);
  }

  setLeftBorder(percents) {
    this.$leftOverlay.style["width"] = `${percents}%`;
    this.$frame.style["left"] = `${percents}%`;
    this.leftBorder = percents;
    this.frameChangeCallback(this.leftBorder, this.rightBorder);
  }

  setRightBorder(percents) {
    this.$rightOverlay.style["width"] = `${100 - percents}%`;
    this.$frame.style["width"] = `${percents - this.leftBorder}%`;
    this.rightBorder = percents;
    this.frameChangeCallback(this.leftBorder, this.rightBorder);
  }

  toPercents(x) {
    return Math.ceil((x * 100) / this.$container.offsetWidth);
  }
}

export default DraggablePlot;
