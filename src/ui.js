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

export { renderButtons, renderThemeSwitcher };
