(function () {
  function initPlaqueInterface(root) {
    const triggers = Array.from(root.querySelectorAll("[data-plaque-trigger]"));
    const panels = Array.from(root.querySelectorAll("[data-plaque-panel]"));

    if (!triggers.length || !panels.length) return;

    function setActivePanel(nextId) {
      const currentId = root.dataset.activePanel || "";
      const activeId = currentId === nextId ? "" : nextId;

      root.dataset.activePanel = activeId;

      triggers.forEach((trigger) => {
        const isActive = trigger.dataset.plaqueTrigger === activeId;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-expanded", String(isActive));
        trigger.closest(".plaque-dock-item")?.classList.toggle("is-active", isActive);
      });

      panels.forEach((panel) => {
        const isOpen = panel.dataset.plaquePanel === activeId;
        panel.classList.toggle("is-open", isOpen);
        panel.setAttribute("aria-hidden", String(!isOpen));
      });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        setActivePanel(trigger.dataset.plaqueTrigger);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.dataset.activePanel) {
        setActivePanel("");
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (root.dataset.activePanel && !root.contains(event.target)) {
        setActivePanel("");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-plaque-interface]").forEach(initPlaqueInterface);
  });
})();
