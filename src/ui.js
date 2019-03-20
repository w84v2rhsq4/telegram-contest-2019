function renderButtons({ plotId, data, checked, handleVisibilityToggle }) {
  const { colors, names } = data;

  const buttonsContainer = document.getElementById(`buttons-${plotId}`);
  const plots = Object.keys(names);
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const button = document.createElement("button");
    button.setAttribute("data-id", i);
    button.classList.add("button");
    if (checked[i]) {
      button.classList.add("checked");
    }
    button.innerHTML = `<i class="tick-icon" style="background-color:${
      colors[plot]
    }"></i>${names[plot]}`;
    buttonsContainer.appendChild(button);
  }

  buttonsContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") {
      if (e.target.classList.contains("checked")) {
        //   e.target.classList.remove("checked");
        handleVisibilityToggle(e.target.getAttribute("data-id"), false);
      } else {
        // e.target.classList.add("checked");
        handleVisibilityToggle(e.target.getAttribute("data-id"), true);
      }

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
