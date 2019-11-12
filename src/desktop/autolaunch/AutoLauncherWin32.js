// @flow

import Registry from "winreg"
import {app} from "electron"

const autoRunKey = new Registry({
	hive: Registry.HKCU,
	key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
})

export function isAutoLaunchEnabled(): Promise<boolean> {
	// can't promisify here because it screws with autoRunKeys 'this' semantics
	return new Promise((resolve, reject) => {
		autoRunKey.get(app.name, (err, item) => {
			if (err) {
				reject(err)
			} else {
				resolve(typeof item !== "undefined" && item !== null)
			}
		})
	}).catch(() => false)
}

export function enableAutoLaunch(): Promise<void> {
	// can't promisify here because it screws with autoRunKeys 'this' semantics
	return isAutoLaunchEnabled().then(enabled => enabled
		? Promise.resolve()
		: new Promise((resolve, reject) => {
			autoRunKey.set(app.name, Registry.REG_SZ, `${process.execPath} -a`, (err) => {
				if (err) {
					reject(err)
				}
				resolve()
			})
		}))
}

export function disableAutoLaunch(): Promise<void> {
	// can't promisify here because it screws with autoRunKeys 'this' semantics
	return isAutoLaunchEnabled().then(enabled => enabled
		? new Promise((resolve, reject) => {
			autoRunKey.remove(app.name, (err) => {
				if (err) {
					reject(err)
				}
				resolve()
			})
		})
		: Promise.resolve())
}