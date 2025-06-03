/**
 * This file provides the functionality used by DesktopTray on mac
 */
import type { NativeImage } from "electron"
import { app, Menu, MenuItem, Tray } from "electron"
import type { WindowManager } from "../DesktopWindowManager"
import os from "node:os"
import { getResourcePath } from "../resources"
import type { PlatformTray } from "./DesktopTray"
import { assertNotNull } from "@tutao/tutanota-utils"

export class MacTray implements PlatformTray {
	private readonly dock: Electron.Dock = assertNotNull(app.dock)

	needsWindowListInMenu(): boolean {
		//MacOs Catalina started showing the window list on its own
		return Number(os.release().slice(0, 2)) < 19
	}

	attachMenuToTray(m: Menu, tray: Tray | null): void {
		this.dock.setMenu(m)
	}

	getPlatformMenuItems(): Array<MenuItem> {
		return []
	}

	getTray(wm: WindowManager, icon: NativeImage): Tray | null {
		if (!this.dock.isVisible()) {
			this.dock.show()
		}

		return null
	}

	setBadge() {
		this.dock.bounce()
		this.dock.setBadge("●")
	}

	clearBadge() {
		this.dock.setBadge("")
	}

	getAppIconPathFromName(iconName: string): string {
		return getResourcePath(`icons/${iconName}.icns`)
	}
}
