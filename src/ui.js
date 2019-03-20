function renderButtons({ plotId, data, checked, handleVisibilityToggle }) {
  const { colors, names } = data;
  const containerId = `buttons-${plotId}`;
  const $container = document.getElementById(containerId);
  const plots = Object.keys(names);
  const checkedClassName = "checked";
  const idAttrName = "data-id";

  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    const button = document.createElement("button");
    button.setAttribute(idAttrName, i);

    button.classList.add("button");
    if (checked[i]) {
      button.classList.add(checkedClassName);
    }
    button.innerHTML = `<i class="tick-icon" style="background-color:${
      colors[plot]
    }"></i>${names[plot]}`;
    $container.appendChild(button);
  }

  $container.addEventListener("click", function(e) {
    const { target } = e;
    if (target.tagName === "BUTTON") {
      const id = target.getAttribute(idAttrName);
      handleVisibilityToggle(id, !target.classList.contains(checkedClassName));
      target.classList.toggle(checkedClassName);

      if (checked.filter(i => i === true).length === 1) {
        const $lastCheckedButton = [...$container.children].find(el =>
          el.classList.contains(checkedClassName)
        );

        $lastCheckedButton.disabled = true;
      } else {
        [...$container.children].forEach(el => (el.disabled = false));
      }
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
