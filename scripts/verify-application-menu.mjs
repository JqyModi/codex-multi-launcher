const { buildApplicationMenuTemplate } = await import("../dist-electron/main/application-menu.js");

const labels = {
  file: "File",
  edit: "Edit",
  view: "View",
  window: "Window",
  help: "Help",
  close: "Close",
  quit: "Quit",
  undo: "Undo",
  redo: "Redo",
  cut: "Cut",
  copy: "Copy",
  paste: "Paste",
  selectAll: "Select All",
  reload: "Reload",
  forceReload: "Force Reload",
  toggleDevTools: "Toggle Developer Tools",
  minimize: "Minimize",
  zoom: "Zoom",
  about: "About"
};

const expectedStandardLabels = ["File", "Edit", "View", "Window", "Help"];
const macTemplate = buildApplicationMenuTemplate(labels, "darwin");
const windowsTemplate = buildApplicationMenuTemplate(labels, "win32");

assert(macTemplate[0]?.role === "appMenu", "macOS menu must begin with the native application menu");
assert(
  JSON.stringify(macTemplate.slice(1).map((item) => item.label)) === JSON.stringify(expectedStandardLabels),
  "macOS standard menus must follow the native application menu"
);
assert(
  macTemplate.filter((item) => item.role === "appMenu").length === 1,
  "macOS menu must contain exactly one native application menu"
);
assert(
  JSON.stringify(windowsTemplate.map((item) => item.label)) === JSON.stringify(expectedStandardLabels),
  "Windows menu order must remain unchanged"
);
assert(
  windowsTemplate.every((item) => item.role !== "appMenu"),
  "Windows menu must not contain the macOS application menu"
);

console.log("Application menu verification passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
