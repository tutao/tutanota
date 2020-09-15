// @flow
import type {MenuItemConstructorOptions} from "electron"
import {app, Menu} from 'electron'
import type {WindowManager} from "../DesktopWindowManager"
import {lang} from "../../misc/LanguageViewModel"

export function isAutoLaunchEnabled(): Promise<boolean> {
	return Promise.resolve(app.getLoginItemSettings().openAtLogin)
}

export function enableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (!enabled) app.setLoginItemSettings({openAtLogin: true})
	})
}

export function disableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (enabled) app.setLoginItemSettings({openAtLogin: false})
	})
}

export function runIntegration(wm: WindowManager): Promise<void> {
	// We need menu on macOS, otherwise there are no shortcuts defined even for things like copy/paste or hiding window
	// this needs to be registered here because it's called after the app ready event
	let template: MenuItemConstructorOptions[] = [
		{
			// Skip individual definitions because appMenu can do it automatically
			role: "appMenu"
		},
		{
			label: 'Edit',
			submenu: [
				{role: 'undo'},
				{role: 'redo'},
				{type: 'separator'},
				{role: 'cut'},
				{role: 'copy'},
				{role: 'paste'},
				{role: 'pasteAndMatchStyle'},
				{role: 'delete'},
				{role: 'selectAll'},
				{type: 'separator'},
				{
					label: 'Speech',
					submenu: [
						{role: 'startSpeaking'},
						{role: 'stopSpeaking'}
					]
				}
			]
		},
		{
			label: 'View',
			submenu: [
				{role: 'togglefullscreen'}
			]
		},
		{
			role: 'window',
			submenu: [
				{role: 'minimize'},
				{role: 'close'},
				{role: 'minimize'},
				{role: 'zoom'},
				{type: 'separator'},
				{role: 'front'},
				{
					click: () => {wm.newWindow(true)},
					label: lang.get("openNewWindow_action"),
					accelerator: "Command+N",
					enabled: true
				}
			]
		},
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
	return Promise.resolve()
}

export function isIntegrated(): Promise<boolean> {
	return Promise.resolve(true)
}

export function integrate(): Promise<void> {
	return Promise.resolve()
}

export function unintegrate(): Promise<void> {
	return Promise.resolve()
}