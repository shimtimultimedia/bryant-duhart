(function () {
  /*
   * Side-plate titles are single brand words set large in capitals, and a word cannot
   * wrap, so a long one ("SKETCHFAB") ran past the plate's text column and behind the
   * main plaque. Each title is shrunk only by the amount it overflows; titles that fit
   * keep their designed size. Re-run once the web font loads, on width changes, and
   * when a plate opens, because a hidden plate may not have been measurable before.
   */
  function fitPlateTitles(root) {
    root.querySelectorAll(".plaque-tab-title").forEach((title) => {
      title.style.fontSize = "";
      if (!title.clientWidth) return;
      for (let pass = 0; pass < 4 && title.scrollWidth > title.clientWidth + 1; pass += 1) {
        const size = parseFloat(getComputedStyle(title).fontSize);
        title.style.fontSize = `${Math.floor(size * (title.clientWidth / title.scrollWidth) * 0.98 * 10) / 10}px`;
      }
    });
  }

  /*
   * Edge sheets. On phones each dock panel slides in from the right screen edge (like
   * Samsung's Edge Panel) instead of sliding out beside the plaque. The panels stay where
   * they are in the page, next to their buttons, but become manual popovers so they render
   * in the top layer: when the 3D plaque is drawn, hero-3d.js transforms #plaque-stack with
   * matrix3d, and a transformed ancestor would otherwise trap a fixed panel inside the
   * plaque. Browsers without the Popover API keep the panel in place; it still opens, but
   * over the plaque when the 3D is running.
   */
  const phoneLayout = window.matchMedia("(max-width: 720px), (max-width: 900px) and (orientation: portrait)");
  const supportsPopover = typeof HTMLElement === "function" && "popover" in HTMLElement.prototype;
  const SWIPE_CLOSE_PX = 48;

  function initPlaqueInterface(root) {
    const triggers = Array.from(root.querySelectorAll("[data-plaque-trigger]"));
    const panels = Array.from(root.querySelectorAll("[data-plaque-panel]"));

    if (!triggers.length || !panels.length) return;

    const isSheetMode = () => root.classList.contains("edge-sheets");

    function syncPopover(panel, isOpen) {
      if (!supportsPopover || !panel.hasAttribute("popover")) return;
      const showing = panel.matches(":popover-open");
      if (isOpen && !showing) panel.showPopover();
      else if (!isOpen && showing) panel.hidePopover();
    }

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
        syncPopover(panel, isOpen);
      });

      // The theme handle shares the right screen edge with the sheets; it steps aside.
      document.documentElement.classList.toggle("edge-sheet-open", Boolean(activeId) && isSheetMode());

      if (activeId) fitPlateTitles(root);
    }

    function setSheetMode(on) {
      root.classList.toggle("edge-sheets", on);
      panels.forEach((panel) => {
        if (!supportsPopover) return;
        if (on) {
          panel.setAttribute("popover", "manual");
          syncPopover(panel, panel.classList.contains("is-open"));
        } else if (panel.hasAttribute("popover")) {
          syncPopover(panel, false);
          panel.removeAttribute("popover");
        }
      });
      document.documentElement.classList.toggle(
        "edge-sheet-open", on && Boolean(root.dataset.activePanel));
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
      if (event.key !== "Escape" || !root.dataset.activePanel) return;
      // Closing makes the panel inert; focus inside it would drop to <body>.
      const openPanel = panels.find((panel) => panel.classList.contains("is-open"));
      const returnFocus = openPanel && openPanel.contains(document.activeElement);
      const activeId = root.dataset.activePanel;
      setActivePanel("");
      if (returnFocus) {
        triggers.find((trigger) => trigger.dataset.plaqueTrigger === activeId)?.focus();
      }
    });

    // A desktop plate belongs to the plaque, so only a tap off the plaque closes it. A
    // phone sheet is a surface of its own: a tap anywhere but the sheet or a dock button
    // (which switches sheets) puts it away, the plaque included.
    document.addEventListener("pointerdown", (event) => {
      if (!root.dataset.activePanel) return;
      const target = event.target instanceof Element ? event.target : null;
      const inside = target && root.contains(target) && (!isSheetMode()
        || target.closest("[data-plaque-panel], [data-plaque-trigger]"));
      if (!inside) setActivePanel("");
    });

    // A swipe toward the screen edge puts the sheet away. Vertical drags scroll the sheet
    // (touch-action: pan-y), which cancels the pointer, so they never close it.
    panels.forEach((panel) => {
      let start = null;
      panel.addEventListener("pointerdown", (event) => {
        start = isSheetMode() ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null;
      });
      panel.addEventListener("pointerup", (event) => {
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        start = null;
        if (dx > SWIPE_CLOSE_PX && Math.abs(dy) < dx) setActivePanel("");
      });
      panel.addEventListener("pointercancel", () => { start = null; });
      // pan-y alone did not stop the browser from starting a sideways fling, and a live
      // fling swallows the next tap - the visitor's tap on another dock icon did nothing.
      // A drag that is more sideways than vertical is the close swipe, so the sheet claims
      // it; vertical drags are left to scroll the sheet.
      panel.addEventListener("touchmove", (event) => {
        if (!start || !event.cancelable || event.touches.length !== 1) return;
        const touch = event.touches[0];
        if (Math.abs(touch.clientX - start.x) > Math.abs(touch.clientY - start.y)) event.preventDefault();
      }, { passive: false });
    });

    setActivePanel("");
    setSheetMode(phoneLayout.matches);
    phoneLayout.addEventListener("change", (event) => setSheetMode(event.matches));

    fitPlateTitles(root);
    document.fonts?.ready.then(() => fitPlateTitles(root));
    document.addEventListener('portfolio-languagechange', () => fitPlateTitles(root));
    let width = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      fitPlateTitles(root);
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-plaque-interface]").forEach(initPlaqueInterface);
  });
})();
