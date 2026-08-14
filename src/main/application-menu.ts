import type { MenuItemConstructorOptions } from "electron";

export interface ApplicationMenuLabels {
  file: string;
  edit: string;
  view: string;
  window: string;
  help: string;
  close: string;
  quit: string;
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  selectAll: string;
  reload: string;
  forceReload: string;
  toggleDevTools: string;
  minimize: string;
  zoom: string;
  about: string;
}

export function buildApplicationMenuTemplate(
  labels: ApplicationMenuLabels,
  platform: NodeJS.Platform
): MenuItemConstructorOptions[] {
  const standardMenus: MenuItemConstructorOptions[] = [
    {
      label: labels.file,
      submenu: [
        { label: labels.close, role: "close" },
        { type: "separator" },
        { label: labels.quit, role: "quit" }
      ]
    },
    {
      label: labels.edit,
      submenu: [
        { label: labels.undo, role: "undo" },
        { label: labels.redo, role: "redo" },
        { type: "separator" },
        { label: labels.cut, role: "cut" },
        { label: labels.copy, role: "copy" },
        { label: labels.paste, role: "paste" },
        { label: labels.selectAll, role: "selectAll" }
      ]
    },
    {
      label: labels.view,
      submenu: [
        { label: labels.reload, role: "reload" },
        { label: labels.forceReload, role: "forceReload" },
        { label: labels.toggleDevTools, role: "toggleDevTools" }
      ]
    },
    {
      label: labels.window,
      submenu: [
        { label: labels.minimize, role: "minimize" },
        { label: labels.zoom, role: "zoom" },
        { label: labels.close, role: "close" }
      ]
    },
    {
      label: labels.help,
      submenu: [{ label: labels.about, role: "about" }]
    }
  ];

  return platform === "darwin"
    ? [{ role: "appMenu" }, ...standardMenus]
    : standardMenus;
}
