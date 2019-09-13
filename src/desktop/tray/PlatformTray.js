// @flow
import type {NativeImage} from 'electron'
import {app, Menu, MenuItem, Tray} from "electron"
import type {WindowManager} from "../DesktopWindowManager"
import {lang} from "../../misc/LanguageViewModel"
import type {PlatformTray} from './DesktopTray'
import path from "path"

/*
* This file provides the functionality used by DesktopTray on windows & linux.
 */

function attachMenuToTray(m: Menu, tray: ?Tray): void {
	if (tray) tray.setContextMenu(m)
}

function needsWindowListInMenu() {
	return true
}

function getPlatformMenuItems(): Array<MenuItem> {
	return [
		new MenuItem({type: 'separator'}),
		new MenuItem({
			label: lang.get("quit_action"),
			accelerator: "CmdOrCtrl+Q",
			click: app.quit
		})
	]
}

function getTray(wm: WindowManager, icon: NativeImage): Tray {
	const tray = new Tray(icon)
	/*
		setting the context menu is necessary to prevent electron from segfaulting shortly after creating the tray.
		workaround from: https://github.com/electron/electron/issues/22137#issuecomment-586105622
		issue: https://github.com/electron/electron/issues/22215
	 */
	tray.setContextMenu(null)
	tray.on('click', ev => {
		wm.getLastFocused(true)
	})
	return tray
}



function setBadge() {}

function clearBadge() {}

function iconPath(iconName: string): string {
	return path.join((process: any).resourcesPath, `icons/${iconName}`)
}

export const platformTray: PlatformTray = {
	getPlatformMenuItems,
	getTray,
	attachMenuToTray,
	setBadge,
	clearBadge,
	iconPath,
	needsWindowListInMenu
}

export default platformTray