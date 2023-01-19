import type { NativeImage } from "electron"
import { app, Menu, MenuItem, Tray } from "electron"
import type { WindowManager } from "../DesktopWindowManager"
import { lang } from "../../misc/LanguageViewModel"
import type { PlatformTray } from "./DesktopTray"
import { getResourcePath } from "../resources"

/**
 * This file provides the functionality used by DesktopTray on windows & linux.
 */
export class NonMacTray implements PlatformTray {
	attachMenuToTray(m: Menu, tray: Tray | null): void {
		if (tray) tray.setContextMenu(m)
	}

	needsWindowListInMenu(): boolean {
		return true
	}

	getPlatformMenuItems(): Array<MenuItem> {
		return [
			new MenuItem({
				type: "separator",
			}),
			new MenuItem({
				label: lang.get("quit_action"),
				accelerator: "CmdOrCtrl+Shift+Q",
				click: () => app.quit(),
			}),
		]
	}

	getTray(wm: WindowManager, icon: NativeImage): Tray {
		const tray = new Tray(icon)

		/*
		setting the context menu is necessary to prevent electron from segfaulting shortly after creating the tray.
		workaround from: https://github.com/electron/electron/issues/22137#issuecomment-586105622
		issue: https://github.com/electron/electron/issues/22215
	 */
		tray.setContextMenu(null)
		tray.on("click", (ev) => {
			wm.getLastFocused(true)
		})
		return tray
	}

	setBadge() {}

	clearBadge() {}

	getAppIconPathFromName(iconName: string): string {
		return getResourcePath(`icons/${iconName}`)
	}
}
