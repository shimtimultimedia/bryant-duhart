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
        const preview = panel.querySelector("img[data-preview-src]");

        if (isOpen && preview && !preview.dataset.previewLoaded) {
          // This swap IS the deferral. loading="lazy" must not survive it:
          // inside the transformed/opacity-driven tab subtree the browser's
          // native lazy heuristic never fires, so a lazy image here would
          // stay blank forever.
          preview.loading = "eager";
          preview.src = preview.dataset.previewSrc;
          preview.dataset.previewLoaded = "true";
        }

        panel.classList.toggle("is-open", isOpen);
        panel.setAttribute("aria-hidden", String(!isOpen));
        panel.inert = !isOpen;
      });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        setActivePanel(trigger.dataset.plaqueTrigger);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
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

    setActivePanel("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-plaque-interface]").forEach(initPlaqueInterface);
  });
})();
