import "./styles.css";
import Chart from "./chart";

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

async function main() {
  const json = await fetchJson();
  const textureImg = await fetchTextureImg();

  const $content = document.getElementById("content");
  for (let id = 0; id < json.length; id++) {
    $content.innerHTML += `
      <div class="chart-container">
        <h2 class="chart-header">Chart #${id}</h2>
        <div class="canvas-container">
          <div id="tooltip-${id}" class="tooltip"></div>
          <canvas id="chart-canvas-${id}" class="chart-canvas"></canvas>
          <div id="grid-${id}" class="y-grid-container"></div>
          <div id="timeline-${id}" class="timeline-container"></div>
        </div>
        <div id="overall-${id}" class="overall">
          <div id="left-overlay-${id}" class="overlay overlay-left"></div>
          <div id="right-overlay-${id}" class="overlay overlay-right"></div>
          <div id="frame-${id}" class="frame">
            <div id="left-grabber-${id}" class="grabber grabber-left"></div>
            <div id="right-grabber-${id}" class="grabber grabber-right"></div>
          </div>
          <canvas id="overall-canvas-${id}"></canvas>
        </div>
        <div id="buttons-${id}" class="buttons"></div>
      </div>`;
  }

  $content.innerHTML += `<div class="theme-switcher-container">
      <button id="theme-switcher" class="theme-switcher"></button>
    </div>`;

  for (let id = 0; id < json.length; id++) {
    new Chart({ id, data: json[id], textureImg }).render();
  }
}

main();
