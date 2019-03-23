import { months, days } from "./utils";

class Tooltip {
  constructor({ $tooltip }) {
    this.$tooltip = $tooltip;
    this.time = undefined;
    this.plotsData = [];

    this.$time = document.createElement("div");
    this.$time.className = "tooltip-time";
    this.$plotsList = document.createElement("div");
    this.$plotsList.className = "tooltip-plots-list";

    this.$tooltip.appendChild(this.$time);
    this.$tooltip.appendChild(this.$plotsList);
  }

  getFormattedTime() {
    const { time } = this;

    return `${days[time.getDay()]}, ${
      months[time.getMonth()]
    } ${time.getDate()}`;
  }

  renderItems() {
    const { plotsData } = this;

    while (this.$plotsList.firstChild) {
      this.$plotsList.removeChild(this.$plotsList.firstChild);
    }

    for (let i = 0; i < plotsData.length; i++) {
      const $item = document.createElement("div");
      $item.className = "tooltip-plots-data";
      $item.style = `color: ${plotsData[i].color}`;

      const $plotValue = document.createElement("div");
      $plotValue.className = "tooltip-plots-value";
      $plotValue.innerHTML = plotsData[i].value;

      const $plotName = document.createElement("div");
      $plotName.className = "tooltip-plots-name";
      $plotName.innerHTML = plotsData[i].name;

      $item.appendChild($plotValue);
      $item.appendChild($plotName);

      this.$plotsList.appendChild($item);
    }
  }

  setData({ plotsData, time }) {
    this.time = new Date(time);
    this.plotsData = plotsData;

    return this;
  }

  render() {
    this.$time.innerHTML = this.getFormattedTime();
    this.renderItems();

    return this;
  }

  show() {
    this.$tooltip.classList.add("shown");
  }

  hide() {
    this.$tooltip.classList.remove("shown");
  }
}

export default Tooltip;
