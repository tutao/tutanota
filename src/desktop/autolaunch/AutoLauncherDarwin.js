// @flow
import DesktopUtils from "../DesktopUtils"
import {noOp} from "../../api/common/utils/Utils"

const appName = "Tutanota Desktop"
const index = process.execPath.indexOf('.app')
if (index === -1) {
	throw new Error("could not find executable path")
}
const autoStartPath = process.execPath.slice(0, process.execPath.indexOf('.app') + 4)


export function isAutoLaunchEnabled(): Promise<boolean> {
	return DesktopUtils
		.executeAppleScript('tell application "System Events" to get the name of every login item')
		.then(stdio => {
			const name = stdio
				.stdout
				.split(",")
				.map(n => n.trim())
				.find(n => n === appName)

			console.log("name", name)
			return typeof name === 'string'
		})
		.catch(e => {
			console.error("could not check login items: ", e)
			return false
		})
}

export function enableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (enabled) {
			return
		}
		return DesktopUtils
			.executeAppleScript(`tell application "System Events" to make login item at end with properties {path:"${autoStartPath}", name:"${appName}", hidden: false}`)
			.then(noOp)
	})
}

export function disableAutoLaunch(): Promise<void> {
	return isAutoLaunchEnabled().then(enabled => {
		if (!enabled) {
			return
		}

		return DesktopUtils
			.executeAppleScript(`tell application "System Events" to delete login item "${appName}"`)
			.then(noOp)
	})
}