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
  const isInitialThemeDark = true;
  const $switcher = document.getElementById("theme-switcher");
  let isDark = isInitialThemeDark;

  function setInnerText(target) {
    target.innerText = `Switch to ${isDark ? "Day Mode" : "Night Mode"}`;
  }

  setInnerText($switcher, !isInitialThemeDark);
  if (isInitialThemeDark) {
    document.body.classList.add("dark");
  }

  $switcher.addEventListener("click", () => {
    isDark = !isDark;

    setInnerText($switcher);

    document.body.classList.toggle("dark", isDark);
  });
}

class Grid {
  constructor({
    $gridContainer,
    handleGridMouseLeave,
    handleGridMouseMove,
    currentYMax,
    $grid
  }) {
    this.$gridContainer = $gridContainer;

    this.currentYMax = currentYMax;
    this.currentGridMax = undefined;

    $grid.addEventListener("mouseleave", handleGridMouseLeave);
    $grid.addEventListener("mousemove", handleGridMouseMove);
    $grid.addEventListener("touchmove", handleGridMouseMove);
  }

  updateMaxY(maxY) {
    this.currentYMax = maxY;
    return this;
  }

  render() {
    const { $gridContainer, currentYMax } = this;
    if ($gridContainer.children.length > 1) {
      $gridContainer.children[0].remove();
    }
    const $grid = document.createElement("div");
    $grid.className = "y-grid";
    const itemHeight = ($gridContainer.offsetHeight * 0.9) / 5 - 1;

    const max = currentYMax * 0.9;

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
    $gridContainer.appendChild($grid);

    if ($gridContainer.children.length > 1) {
      if (currentYMax < this.currentGridMax) {
        $gridContainer.children[0].classList.add("animate-up");
        $gridContainer.children[1].classList.add("animate-down");

        $grid.offsetWidth;
        $gridContainer.children[1].classList.remove("animate-down");
      } else {
        $gridContainer.children[0].classList.add("animate-down");
        $gridContainer.children[1].classList.add("animate-up");

        $grid.offsetWidth;
        $gridContainer.children[1].classList.remove("animate-up");
      }
    }

    this.currentGridMax = currentYMax;
  }
}

export { renderButtons, renderThemeSwitcher, Grid };
