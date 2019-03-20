function renderButtons({ plotId, data }) {
  const { colors, names } = data;

  const buttonsContainer = document.getElementById(`buttons-${plotId}`);
  const plots = Object.keys(names);
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const button = document.createElement("button");
    button.classList.add("button");
    button.innerHTML = `<i class="tick-icon" style="background-color:${
      colors[plot]
    }"></i>${names[plot]}`;
    buttonsContainer.appendChild(button);
  }

  buttonsContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") {
      e.target.classList.toggle("checked");
    }
  });
}

function renderThemeSwitcher() {
  document.getElementById("theme-switcher").addEventListener("click", e => {
    const nightMode = document.body.classList.contains("dark");

    e.target.innerText = `Switch to ${nightMode ? "Night Mode" : "Day Mode"}`;

    document.body.classList.toggle("dark");
  });
}

export { renderButtons, renderThemeSwitcher };
