// دعم Firefox
if (typeof browser === "undefined") {
  var browser = chrome;
}

// تحديد اسم المتصفح لإرساله للصفحة
function detectBrowserName() {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("firefox")) return "firefox";
  if (ua.includes("edg/") || ua.includes("edge")) return "edge";
  if (ua.includes("opr") || ua.includes("opera")) return "opera";
  if (ua.includes("brave")) return "brave";
  if (ua.includes("vivaldi")) return "vivaldi";
  if (ua.includes("chrome")) return "chrome";
  return "unknown";
}

// إنشاء عنصر في قائمة كليك يمين
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "openLocalExtensions",
    title: "Open Add-ons update",
    contexts: ["all"],
  });
});

// الحجم الافتراضي / الحد الأدنى للنافذة
const MIN_WIDTH = 400;
const MIN_HEIGHT = 600;

// الضغط على القائمة
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "openLocalExtensions") return;

  const browserName = detectBrowserName();
  const popupUrl = `chrome-extension://${browser.runtime.id}/popup.html?browser=${browserName}`;

  browser.windows
    .getAll({ populate: true })
    .then((windows) => {
      const matches = windows.filter(
        (win) =>
          win.tabs &&
          win.tabs.some(
            (t) =>
              t.url &&
              t.url.startsWith(
                `chrome-extension://${browser.runtime.id}/popup.html`
              )
          )
      );

      if (matches.length > 0) {
        const target = matches[0];

        if (matches.length > 1) {
          matches.slice(1).forEach((w) => {
            browser.windows.remove(w.id).catch(() => {});
          });
        }

        browser.windows.update(target.id, { focused: true }).then(() => {
          const popupTab = target.tabs.find(
            (t) =>
              t.url &&
              t.url.startsWith(
                `chrome-extension://${browser.runtime.id}/popup.html`
              )
          );
          if (popupTab)
            browser.tabs.update(popupTab.id, { active: true }).catch(() => {});
        });
      } else {
        createCenteredWindow(browserName);
      }
    })
    .catch(() => {
      createCenteredWindow(browserName);
    });
});

// إنشاء نافذة متمركزة
function createCenteredWindow(browserName) {
  const urlWithBrowser = `popup.html?browser=${browserName}`;

  browser.windows
    .getCurrent({ populate: true })
    .then((currentWindow) => {
      const leftPosition = Math.max(
        0,
        Math.round((currentWindow.width - MIN_WIDTH) / 2)
      );

      browser.windows.create({
        url: urlWithBrowser,
        type: "popup",
        width: MIN_WIDTH,
        height: MIN_HEIGHT,
        left: leftPosition,
        top: 100,
      });
    })
    .catch(() => {
      browser.windows.create({
        url: urlWithBrowser,
        type: "popup",
        width: MIN_WIDTH,
        height: MIN_HEIGHT,
      });
    });
}

// منع تصغير النافذة أقل من الحد الأدنى
browser.windows.onBoundsChanged.addListener((win) => {
  browser.windows
    .get(win.id)
    .then((w) => {
      if (!w || w.type !== "popup") return;

      let update = {};
      let changed = false;

      if (w.width < MIN_WIDTH) {
        update.width = MIN_WIDTH;
        changed = true;
      }
      if (w.height < MIN_HEIGHT) {
        update.height = MIN_HEIGHT;
        changed = true;
      }

      if (changed) browser.windows.update(w.id, update).catch(() => {});
    })
    .catch(() => {});
});
