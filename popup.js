// Interface elements
const list = document.getElementById("extensionsList");
const updateAllBtn = document.getElementById("updateAll");
const updateAllReloadTabsBtn = document.getElementById("updateAllReloadTabs");

// Default fallback icon - استخدام الصورة المخصصة
const defaultIcon = chrome.runtime.getURL("Image/icon.png");

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ])
  );
}

// position the menu so it never overflows the viewport
function positionMenu(menu, anchor) {
  menu.style.visibility = "hidden";
  menu.style.display = "block";
  menu.style.position = "fixed";
  menu.style.maxWidth = "260px";
  menu.style.boxSizing = "border-box";

  const mRect = menu.getBoundingClientRect();
  const aRect = anchor.getBoundingClientRect();
  const margin = 8;

  let left = aRect.right - mRect.width;
  if (left < margin)
    left = Math.min(margin, window.innerWidth - mRect.width - margin);

  let top = aRect.bottom;
  if (top + mRect.height > window.innerHeight - margin) {
    top = aRect.top - mRect.height;
    if (top < margin)
      top = Math.max(margin, window.innerHeight - mRect.height - margin);
  }

  if (left + mRect.width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - mRect.width - margin);
  }

  menu.style.left = Math.round(left) + "px";
  menu.style.top = Math.round(top) + "px";
  menu.style.visibility = "visible";
}

// Get all extensions except this extension itself
chrome.management.getAll(function (extensions) {
  const shownExtensions = extensions.filter(
    (ext) => ext.id !== chrome.runtime.id
  );

  if (shownExtensions.length === 0) {
    list.innerHTML = '<p>No extensions found (except this extension).</p>';
    return;
  }

  shownExtensions.forEach((ext) => {
    const bestIcon =
      ext.icons && ext.icons.length
        ? ext.icons.sort((a, b) => (b.size || 0) - (a.size || 0))[0].url
        : defaultIcon;

    // Create extension element
    const extensionElement = document.createElement("div");
    extensionElement.className = "extension";
    extensionElement.style.position = "relative";
    extensionElement.dataset.extId = ext.id;
    extensionElement.dataset.enabled = ext.enabled; // Store enabled status

    extensionElement.innerHTML = `
      <!-- LEFT SIDE -->
      <div class="ext-left">
        <img src="${bestIcon}" width="20" height="20" class="ext-icon" alt=""
            onerror="if(this.src !== '${defaultIcon}') this.src='${defaultIcon}'">
        <span class="ext-name">${escapeHtml(ext.name)}</span>
        <span class="status"></span>
      </div>

      <!-- Options button -->
      <button class="options-btn Wave-center">
        <img src="https://unpkg.com/ionicons@7.1.0/dist/svg/ellipsis-vertical.svg" width="18" height="18">
      </button>

      <!-- Simple dropdown menu -->
      <div class="menu" style="display: none;">
        <button class="update-opt" ${!ext.enabled ? "disabled" : ""}>Update</button>
        <button class="more-opt">More</button>
      </div>

      <!-- Expanded panel -->
      <div class="expanded-panel" style="display: none;">
        <div class="panel-header">
          <div id="panel-div">
            <img src="${bestIcon}" alt=""
                onerror="if(this.src !== '${defaultIcon}') this.src='${defaultIcon}'">
            <div class="header-info">
              <span class="header-name">${escapeHtml(ext.name)}</span>
              <span class="extension-id">ID: ${ext.id}</span>
            </div>
          </div>
          <div class="vvvvf Wave-all">
            <button id="DisableExtension">${ext.enabled ? "Disable" : "Enable"}</button>
            <button id="DeleteExtension">
              <img src="https://unpkg.com/ionicons@7.1.0/dist/svg/trash-outline.svg">
            </button>
          </div>
        </div>

        <div class="panel-actions">
          <button class="close-panel-btn Wave-cloud">Back</button>
          <button class="update-with-tabs-btn Wave-cloud" ${!ext.enabled ? "disabled" : ""}>Update all</button>
        </div>

        <div class="tabs-list" style="${!ext.enabled ? "display: none;" : ""}"></div>
      </div>
    `;

    list.appendChild(extensionElement);

    // Get references
    const status = extensionElement.querySelector(".status");
    const optionsBtn = extensionElement.querySelector(".options-btn");
    const menu = extensionElement.querySelector(".menu");
    const updateOpt = extensionElement.querySelector(".update-opt");
    const moreOpt = extensionElement.querySelector(".more-opt");
    const panel = extensionElement.querySelector(".expanded-panel");
    const closePanelBtn = extensionElement.querySelector(".close-panel-btn");
    const updateWithTabsBtn = extensionElement.querySelector(".update-with-tabs-btn");
    const tabsListDiv = extensionElement.querySelector(".tabs-list");
    const extLeftDiv = extensionElement.querySelector(".ext-left");

    // ===== ADDED: Disable & Delete buttons =====
    const disableBtn = extensionElement.querySelector("#DisableExtension");
    const deleteBtn = extensionElement.querySelector("#DeleteExtension");

    // إضافة xoox تلقائي عند تحميل الإضافة إذا كانت معطلة
    if (!ext.enabled) {
      updateOpt.classList.add("xoox");
      updateWithTabsBtn.classList.add("xoox");
      extLeftDiv.classList.add("xoox");
    }

    // Disable / Enable Toggle
    disableBtn.addEventListener("click", () => {
      chrome.management.get(ext.id, (info) => {
        const newState = !info.enabled;

        chrome.management.setEnabled(ext.id, newState, () => {
          // تحديث نص الزر
          disableBtn.textContent = newState ? "Disable" : "Enable";

          // تحديث حالة status
          status.textContent = newState ? "Enabled" : "Disabled";

          // تحديث dataset
          extensionElement.dataset.enabled = newState;

          // تمكين / تعطيل الأزرار المرتبطة
          updateOpt.disabled = !newState;
          updateWithTabsBtn.disabled = !newState;

          // إضافة أو إزالة كلاس xoox عند التعطيل/إعادة التفعيل
          if (!newState) {
            updateOpt.classList.add("xoox");
            updateWithTabsBtn.classList.add("xoox");
            extLeftDiv.classList.add("xoox");
          } else {
            updateOpt.classList.remove("xoox");
            updateWithTabsBtn.classList.remove("xoox");
            extLeftDiv.classList.remove("xoox");
          }

          // إظهار أو إخفاء tabs-list مع إزالة محتواه عند التعطيل
          if (!newState) {
            tabsListDiv.style.display = "none";
            tabsListDiv.innerHTML = "";
            panelContentLoaded = false;
          } else {
            tabsListDiv.style.display = "";
            // تحقق مما إذا كان اللوحة مرئية وقم بتحميل المحتوى
            if (panel.style.display === "flex" && !panelContentLoaded) {
              loadTabsIntoPanel(tabsListDiv, ext, status, panel);
              panelContentLoaded = true;
            }
          }

          // إزالة رسالة الحالة بعد فترة
          setTimeout(() => (status.textContent = ""), 1200);
        });
      });
    });

    // Delete Extension
    deleteBtn.addEventListener("click", () => {
      if (!confirm(`Are you sure you want to delete "${ext.name}" ?`)) return;

      chrome.management.uninstall(ext.id, { showConfirmDialog: true }, () => {
        extensionElement.remove();
      });
    });
    // ============================================

    function updateExtensionById(extId, statusEl, onDone) {
      statusEl.textContent = "Updating...";
      chrome.management.setEnabled(extId, false, () => {
        chrome.management.setEnabled(extId, true, () => {
          statusEl.textContent = "Updated";
          setTimeout(() => {
            statusEl.textContent = "";
            if (typeof onDone === "function") onDone();
          }, 1500);
        });
      });
    }

    optionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".menu").forEach((m) => {
        if (m !== menu) m.style.display = "none";
      });
      document.querySelectorAll(".expanded-panel").forEach((p) => (p.style.display = "none"));

      const isShown = menu.style.display === "block";
      menu.style.display = isShown ? "none" : "block";
      if (!isShown) positionMenu(menu, optionsBtn);
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".menu").forEach((m) => (m.style.display = "none"));
    });

    // إضافة حدث لإخفاء القائمة عند تحريك عجلة الفأرة
    document.addEventListener("wheel", () => {
      document.querySelectorAll(".menu").forEach((m) => (m.style.display = "none"));
    }, { passive: true });

    updateOpt.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!ext.enabled) return; // Don't update if extension is disabled
      menu.style.display = "none";
      updateExtensionById(ext.id, status);
    });

    let panelContentLoaded = false;
    let tabsLoadingInProgress = false;

    moreOpt.addEventListener("click", (ev) => {
      ev.stopPropagation();
      menu.style.display = "none";

      document.querySelectorAll(".expanded-panel").forEach((p) => {
        p.style.display = "none";
        const tabsList = p.querySelector(".tabs-list");
        if (tabsList) {
          tabsList.innerHTML = "";
          const loadMoreBtn = tabsList.querySelector(".load-more-btn");
          if (loadMoreBtn) loadMoreBtn.remove();
        }
      });

      panel.style.display = "flex";
      panelContentLoaded = false;

      // تحقق مما إذا كانت الإضافة مفعلة وقم بتحميل المحتوى
      if (ext.enabled && !panelContentLoaded && !tabsLoadingInProgress) {
        loadTabsIntoPanel(tabsListDiv, ext, status, panel);
        panelContentLoaded = true;
      }
    });

    closePanelBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      panel.style.display = "none";
      tabsListDiv.innerHTML = "";
      panelContentLoaded = false;
      tabsLoadingInProgress = false;
    });

    updateWithTabsBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!ext.enabled) return; // Don't update if extension is disabled
      updateExtensionById(ext.id, status, () => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((t) => {
            try {
              chrome.tabs.reload(t.id);
            } catch {}
          });
        });
      });

      panel.style.display = "none";
      tabsListDiv.innerHTML = "";
      panelContentLoaded = false;
      tabsLoadingInProgress = false;
    });
  });

  updateAllBtn.addEventListener("click", () => {
    Array.from(list.querySelectorAll(".extension")).forEach((div) => {
      const statusEl = div.querySelector(".status");
      const extId = div.dataset.extId;
      const isEnabled = div.dataset.enabled === "true"; // Check if extension is enabled
      
      if (!extId || !isEnabled) return; // Skip if no ID or extension is disabled

      statusEl.textContent = "Updating...";
      chrome.management.setEnabled(extId, false, () => {
        chrome.management.setEnabled(extId, true, () => {
          statusEl.textContent = "Updated";
          setTimeout(() => (statusEl.textContent = ""), 1200);
        });
      });
    });
  });

  updateAllReloadTabsBtn.addEventListener("click", () => {
    updateAllBtn.click();
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((t) => {
        try {
          chrome.tabs.reload(t.id);
        } catch {}
      });
    });
  });
});

// Load tabs into panel with sequential loading and pagination
function loadTabsIntoPanel(container, extObject, statusElement, panelEl) {
  container.innerHTML =
    '<div style="font-size:13px; color:#6b7280; padding:6px 0 8px 0;">Loading tabs...</div>';

  const parentExtension = container.closest(".extension");
  parentExtension.dataset.tabsLoading = "true";

  chrome.tabs.query({}, function (tabs) {
    container.innerHTML = "";

    if (!tabs || tabs.length === 0) {
      container.innerHTML =
        '<div style="color:#6b7280; font-size:13px;">No open tabs.</div>';
      parentExtension.dataset.tabsLoading = "false";
      return;
    }

    const filteredTabs = tabs.filter(
      (tab) => !tab.url.startsWith(`chrome-extension://${chrome.runtime.id}/`)
    );

    if (filteredTabs.length === 0) {
      container.innerHTML =
        '<div style="color:#6b7280; font-size:13px;">No open tabs.</div>';
      parentExtension.dataset.tabsLoading = "false";
      return;
    }

    if (!panelEl.tabsData) {
      panelEl.tabsData = {
        allTabs: filteredTabs,
        currentIndex: 0,
        batchSize: 10,
        loadedTabs: 0,
      };
    } else {
      panelEl.tabsData.allTabs = filteredTabs;
      panelEl.tabsData.currentIndex = 0;
      panelEl.tabsData.loadedTabs = 0;
    }

    loadTabBatch(container, extObject, statusElement, panelEl);
  });
}

function loadTabBatch(container, extObject, statusElement, panelEl) {
  const tabsData = panelEl.tabsData;
  const startIndex = tabsData.currentIndex;
  const endIndex = Math.min(
    startIndex + tabsData.batchSize,
    tabsData.allTabs.length
  );

  for (let i = startIndex; i < endIndex; i++) {
    const tab = tabsData.allTabs[i];
    addTabToContainer(container, tab, extObject, statusElement, panelEl);
    tabsData.currentIndex++;
    tabsData.loadedTabs++;
  }

  const oldLoadMoreBtn = container.querySelector(".load-more-btn");
  if (oldLoadMoreBtn) oldLoadMoreBtn.remove();

  if (tabsData.currentIndex < tabsData.allTabs.length) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.className = "load-more-btn Wave-cloud"; // تم إضافة الكلاس Wave-cloud هنا
    loadMoreBtn.textContent = `Load more (${
      tabsData.allTabs.length - tabsData.loadedTabs
    } remaining)`;

    loadMoreBtn.addEventListener("click", () => {
      loadMoreBtn.textContent = "Loading...";
      loadMoreBtn.disabled = true;

      setTimeout(() => {
        loadTabBatch(container, extObject, statusElement, panelEl);
      }, 50);
    });

    container.appendChild(loadMoreBtn);
  }

  const parentExtension = container.closest(".extension");
  parentExtension.dataset.tabsLoading = "false";
}

function addTabToContainer(container, tab, extObject, statusElement, panelEl) {
  const tabItem = document.createElement('div');
  tabItem.className = "tab-item";
  tabItem.style.opacity = "0";
  tabItem.style.transform = "translateY(-5px)";
  tabItem.title = tab.title || tab.url || "No title";

  tabItem.innerHTML = `
    <img src="${tab.favIconUrl || defaultIcon}" width="20" height="20" alt=""
        onerror="if(this.src !== '${defaultIcon}') this.src='${defaultIcon}'">
    <span class="tab-title">${escapeHtml(tab.title || tab.url || "(No title)")}</span>
  `;

  tabItem.addEventListener("click", () => {
    panelEl.style.display = "none";
    statusElement.textContent = "Updating...";

    chrome.management.setEnabled(extObject.id, false, () => {
      chrome.management.setEnabled(extObject.id, true, () => {
        statusElement.textContent = "Updated";

        try {
          chrome.tabs.reload(tab.id, {}, () => {
            chrome.tabs.update(tab.id, { active: true });
          });
        } catch {}

        setTimeout(() => {
          statusElement.textContent = "";
        }, 1000);
      });
    });

    container.innerHTML = "";
    const parentExtension = container.closest(".extension");
    parentExtension.dataset.tabsLoading = "false";

    if (panelEl.tabsData) delete panelEl.tabsData;
  });

  container.appendChild(tabItem);

  setTimeout(() => {
    tabItem.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    tabItem.style.opacity = "1";
    tabItem.style.transform = "translateY(0)";
  }, 10);
}

(function () {
  const params = new URLSearchParams(window.location.search);
  const browserName = params.get("browser");

  if (!browserName) return;

  document.body.classList.add(browserName);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = `web css/${browserName}.css`;
  document.head.appendChild(link);
})();