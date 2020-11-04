// @flow
import {log} from "../DesktopUtils"

import type {WindowManager} from "../DesktopWindowManager"

let platformIntegrator: {
	enableAutoLaunch: ()=>Promise<void>,
	disableAutoLaunch: ()=>Promise<void>,
	isAutoLaunchEnabled: ()=>Promise<boolean>,
	runIntegration: (wm: WindowManager)=>Promise<void>,
	isIntegrated: ()=>Promise<boolean>,
	integrate: ()=>Promise<void>;
	unintegrate: ()=>Promise<void>;
}

switch (process.platform) {
	case 'win32':
		platformIntegrator = require('./DesktopIntegratorWin32.js')
		break
	case 'darwin':
		platformIntegrator = require('./DesktopIntegratorDarwin.js')
		break
	case 'linux':
		platformIntegrator = require('./DesktopIntegratorLinux.js')
		break
	default:
		throw new Error('Invalid Platform')
}

export function enableAutoLaunch(): Promise<void> {
	return platformIntegrator.enableAutoLaunch().catch(e => {
		log.debug("could not enable auto launch:", e)
	})
}

export function disableAutoLaunch(): Promise<void> {
	return platformIntegrator.disableAutoLaunch().catch(e => {
		log.debug("could not disable auto launch:", e)
	})
}

export function isAutoLaunchEnabled(): Promise<boolean> {
	return platformIntegrator.isAutoLaunchEnabled().catch(e => {
		console.error("could not check auto launch status:", e)
		return false
	})
}

export function runIntegration(wm: WindowManager): Promise<void> {
	return platformIntegrator.runIntegration(wm)
}

export function isIntegrated(): Promise<boolean> {
	return platformIntegrator.isIntegrated()
}

export function integrate(): Promise<void> {
	return platformIntegrator.integrate()
}

export function unintegrate(): Promise<void> {
	return platformIntegrator.unintegrate()
}