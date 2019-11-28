// @flow
import type {MenuItemConstructorOptions} from "electron"
import {app, Menu} from 'electron'

// We need menu on macOS, otherwise there are no shortcuts defined even for things like copy/paste or hiding window
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
			{role: 'front'}
		]
	},
]
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

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

export function runIntegration(): Promise<void> {
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