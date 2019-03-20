const containerId = "overall";
const leftGrabberId = "left-grabber";
const rightGrabberId = "right-grabber";
const frameId = "frame";
const leftOverlayId = "left-overlay";
const rightOverlayId = "right-overlay";

class DraggablePlot {
  constructor({ leftBorder, rightBorder, frameTranslateCallback }) {
    this.leftBorder = leftBorder;
    this.rightBorder = rightBorder;
    this.frameTranslateCallback = frameTranslateCallback;

    this.frameDraggingStartPoint = undefined;
    this.leftDraggingStartPoint = undefined;
    this.leftDraggingStartPoint = undefined;

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
      // case "mouseleave": {
      //   break;
      // }
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
      //   case leftGrabberId: {
      //     break;
      //   }
      //   case rightGrabberId: {
      //     break;
      //   }
      //   case frameId: {
      //     break;
      //   }
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
    if (this.isFrameDragging()) {
      this.processFrameDrag(e);
    }
    if (this.isLeftGrabberDragging()) {
      this.processLeftGrabberDrag(e);
    }
    if (this.isRightGrabberDragging()) {
      this.processRightGrabberDrag(e);
    }
  }

  handleMouseUp() {
    if (this.isFrameDragging()) {
      this.stopFrameDrag();
    }
    if (this.isLeftGrabberDragging()) {
      this.stopLeftGrabberDrag();
    }
    if (this.isRightGrabberDragging()) {
      this.stopRightGrabberDrag();
    }
  }

  /** Left dragging */
  isLeftGrabberDragging() {
    return this.leftDraggingStartPoint !== undefined;
  }

  startLeftGrabberDrag(e) {
    const { clientX } = e;
    this.leftDraggingStartPoint = clientX;
  }

  processLeftGrabberDrag(e) {
    const { clientX } = e;
    const dx = this.toPercents(this.leftDraggingStartPoint - clientX);
    this.setBorders(this.leftBorder - dx, this.rightBorder);

    this.leftDraggingStartPoint = clientX;
  }

  stopLeftGrabberDrag() {
    this.leftDraggingStartPoint = undefined;
  }

  /** Right dragging */
  isRightGrabberDragging() {
    return this.rightDraggingStartPoint !== undefined;
  }

  startRightGrabberDrag(e) {
    const { clientX } = e;
    this.rightDraggingStartPoint = clientX;
  }

  processRightGrabberDrag(e) {
    const { clientX } = e;
    const dx = this.toPercents(this.rightDraggingStartPoint - clientX);
    this.setBorders(this.leftBorder, this.rightBorder - dx);

    this.rightDraggingStartPoint = clientX;
  }

  stopRightGrabberDrag() {
    this.rightDraggingStartPoint = undefined;
  }

  /** Frame dragging */
  isFrameDragging() {
    return this.frameDraggingStartPoint !== undefined;
  }

  startFrameDrag(e) {
    const { clientX } = e;
    this.frameDraggingStartPoint = clientX;
  }

  processFrameDrag(e) {
    const { clientX } = e;
    let dx = this.toPercents(this.frameDraggingStartPoint - clientX);
    this.setBorders(this.leftBorder - dx, this.rightBorder - dx);

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

    this.frameTranslateCallback(newLeftBorder, newRightBorder);
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

export default DraggablePlot;
