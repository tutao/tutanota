// @flow

import type {NativeImage} from "electron"
import {app, Menu, MenuItem, Tray} from "electron"
import type {PlatformTray} from "./DesktopTray"
import type {WindowManager} from "../DesktopWindowManager"
import path from "path"
import os from 'os'

/*
* This file provides the functionality used by DesktopTray on mac
 */

function needsWindowListInMenu() {
	//MacOs Catalina started showing the window list on its own
	return Number(os.release().slice(0,2)) < 19
}

function attachMenuToTray(m: Menu, tray: ?Tray): void {
	app.dock.setMenu(m)
}

function getPlatformMenuItems(): Array<MenuItem> {
	return []
}

function getTray(wm: WindowManager, icon: NativeImage): ?Tray {
	if (!app.dock.isVisible()) {
		app.dock.show()
	}
	return null
}

function setBadge() {
	app.dock.bounce()
	app.dock.setBadge("●")
}

function clearBadge() {
	app.dock.setBadge("")
}

function iconPath(iconName: string): string {
	return path.join((process: any).resourcesPath, `icons/${iconName}.icns`)
}

const platformTray: PlatformTray = {
	getPlatformMenuItems,
	getTray,
	attachMenuToTray,
	setBadge,
	clearBadge,
	iconPath,
	needsWindowListInMenu
}

export default platformTray