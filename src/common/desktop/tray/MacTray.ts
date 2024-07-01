/**
 * This file provides the functionality used by DesktopTray on mac
 */
import type { NativeImage } from "electron"
import { app, Menu, MenuItem, Tray } from "electron"
import type { WindowManager } from "../DesktopWindowManager"
import os from "node:os"
import { getResourcePath } from "../resources"
import type { PlatformTray } from "./DesktopTray"

export class MacTray implements PlatformTray {
	needsWindowListInMenu(): boolean {
		//MacOs Catalina started showing the window list on its own
		return Number(os.release().slice(0, 2)) < 19
	}

	attachMenuToTray(m: Menu, tray: Tray | null): void {
		app.dock.setMenu(m)
	}

	getPlatformMenuItems(): Array<MenuItem> {
		return []
	}

	getTray(wm: WindowManager, icon: NativeImage): Tray | null {
		if (!app.dock.isVisible()) {
			app.dock.show()
		}

		return null
	}

	setBadge() {
		app.dock.bounce()
		app.dock.setBadge("●")
	}

	clearBadge() {
		app.dock.setBadge("")
	}

	getAppIconPathFromName(iconName: string): string {
		return getResourcePath(`icons/${iconName}.icns`)
	}
}
