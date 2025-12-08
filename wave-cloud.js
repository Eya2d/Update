(function () {
  // === Automatically add the wave style inside <head> ===
  const waveStyle = `
  .Wave-cloud {
    position: relative;
    overflow: hidden;
  }
  .Wave-center {
    position: relative;
    overflow: hidden;
  }
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(122, 122, 122, 0.116);
    pointer-events: none;
    transform: scale(0);
    opacity: 1;
    transition: transform 0.4s ease-out;
  }
  .ripple.expand {
    transform: scale(4);
  }
  .ripple.fade-out {
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }`;

  const styleTag = document.createElement("style");
  styleTag.textContent = waveStyle;
  document.head.appendChild(styleTag);

  // === Wave effect function ===
  function applyWaveEffect(element) {
    let ripple = null;

    const create = (e) => {
      if (e.button === 2) return;
      if (ripple) return;

      try {
        const r = element.getBoundingClientRect();
        const s = Math.max(r.width, r.height) * 0.5;

        let clientX = e.clientX || 0,
          clientY = e.clientY || 0;

        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX || 0;
          clientY = e.touches[0].clientY || 0;
        }

        let leftPos, topPos;
        if (element.classList.contains("Wave-center")) {                                                // Start from the center of the element
          leftPos = r.width / 2 - s / 2;
          topPos = r.height / 2 - s / 2;
        } else {
          const startFromTopPercentage = 0.8;
          leftPos = clientX - r.left - s / 2;
          topPos = (clientY - r.top - s / 2) * startFromTopPercentage;
        }

        ripple = Object.assign(document.createElement("span"), {
          className: "ripple",
          style: `width:${s}px;height:${s}px;left:${leftPos}px;top:${topPos}px`,
        });

        if (element && element.parentNode) {
          element.appendChild(ripple);
          requestAnimationFrame(() => {
            if (ripple && ripple.classList) ripple.classList.add("expand");
          });
        }
      } catch (error) {
        console.warn("Error creating ripple effect:", error);
        ripple = null;
      }
    };

    const release = () => {
      if (!ripple) return;

      try {
        const current = ripple;
        ripple = null;

        if (current && current.classList) {
          setTimeout(() => {
            if (current && current.classList) {
              current.classList.add("fade-out");

              const transitionEndHandler = () => {
                if (current && current.parentNode) current.remove();
              };

              current.addEventListener("transitionend", transitionEndHandler, {
                once: true,
              });

              setTimeout(() => {
                current.removeEventListener(
                  "transitionend",
                  transitionEndHandler
                );
                if (current && current.parentNode) current.remove();
              }, 1000);
            }
          }, 400);
        }
      } catch (error) {
        console.warn("Error in release ripple effect:", error);
        if (ripple && ripple.parentNode) ripple.remove();
        ripple = null;
      }
    };

    const startEvents = ["mousedown", "touchstart"];
    const endEvents = ["mouseup", "touchend", "mouseleave", "touchcancel"];

    startEvents.forEach((event) => {
      element.removeEventListener(event, create);
      element.addEventListener(event, create, { passive: true });
    });

    endEvents.forEach((event) => {
      element.removeEventListener(event, release);
      element.addEventListener(event, release, { passive: true });
    });
  }

  // === Function to add class Wave-cloud to elements inside any Wave-all ===
  function addWaveClassInsideWaveAll(root) {
    if (!root) return;
    root
      .querySelectorAll(".Wave-all a, .Wave-all button, .Wave-all label")
      .forEach((el) => {
        if (!el.classList.contains("Wave-cloud") && !el.classList.contains("Wave-center")) {
          el.classList.add("Wave-cloud");
        }
      });
  }

  // === Function to add class Wave-center to elements inside any Wave-all-center ===
  function addWaveCenterClassInsideWaveAllCenter(root) {
    if (!root) return;
    root
      .querySelectorAll(".Wave-all-center a, .Wave-all-center button, .Wave-all-center label")
      .forEach((el) => {
        if (!el.classList.contains("Wave-center") && !el.classList.contains("Wave-cloud")) {
          el.classList.add("Wave-center");
        }
      });
  }

  // === Apply the effect when the page loads ===
  document.addEventListener("DOMContentLoaded", function () {
    try {
      document.querySelectorAll(".Wave-all").forEach((div) => {
        addWaveClassInsideWaveAll(div);
      });

      document.querySelectorAll(".Wave-all-center").forEach((div) => {
        addWaveCenterClassInsideWaveAllCenter(div);
      });

      document.querySelectorAll(".Wave-cloud, .Wave-center").forEach((btn) => {
        if (btn && !btn._waveEffectApplied) {
          applyWaveEffect(btn);
          btn._waveEffectApplied = true;
        }
      });
    } catch (error) {
      console.warn("Error applying wave effect on load:", error);
    }
  });

  // === Observe the DOM to update new elements ===
  const observer = new MutationObserver((mutations) => {
    try {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.classList && node.classList.contains("Wave-all")) {
                addWaveClassInsideWaveAll(node);
              }

              if (node.classList && node.classList.contains("Wave-all-center")) {
                addWaveCenterClassInsideWaveAllCenter(node);
              }

              if (node.closest && node.closest(".Wave-all")) {
                addWaveClassInsideWaveAll(node.closest(".Wave-all"));
              }

              if (node.closest && node.closest(".Wave-all-center")) {
                addWaveCenterClassInsideWaveAllCenter(node.closest(".Wave-all-center"));
              }

              if (
                node.classList &&
                (node.classList.contains("Wave-cloud") || node.classList.contains("Wave-center")) &&
                !node._waveEffectApplied
              ) {
                applyWaveEffect(node);
                node._waveEffectApplied = true;
              }

              if (node.querySelectorAll) {
                const waveAlls = node.querySelectorAll(".Wave-all");
                waveAlls.forEach((div) => addWaveClassInsideWaveAll(div));

                const waveAllCenters = node.querySelectorAll(".Wave-all-center");
                waveAllCenters.forEach((div) => addWaveCenterClassInsideWaveAllCenter(div));

                const waveElements = node.querySelectorAll(".Wave-cloud, .Wave-center");
                waveElements.forEach((el) => {
                  if (el && !el._waveEffectApplied) {
                    applyWaveEffect(el);
                    el._waveEffectApplied = true;
                  }
                });
              }
            }
          });
        }
      });
    } catch (error) {
      console.warn("Error in MutationObserver:", error);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body)
        observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  window.addEventListener("beforeunload", () => {
    observer.disconnect();
  });
})();

