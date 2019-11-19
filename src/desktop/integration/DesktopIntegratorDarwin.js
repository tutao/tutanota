// @flow
import {app} from 'electron'

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

export function runIntegration() {
	//nothing here yet
}