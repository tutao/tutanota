// @flow

let platformIntegrator: {
	enableAutoLaunch: ()=>Promise<void>,
	disableAutoLaunch: ()=>Promise<void>,
	isAutoLaunchEnabled: ()=>Promise<boolean>,
	runIntegration: ()=>void
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
		console.log("could not enable auto launch:", e)
	})
}

export function disableAutoLaunch(): Promise<void> {
	return platformIntegrator.disableAutoLaunch().catch(e => {
		console.log("could not disable auto launch:", e)
	})
}

export function isAutoLaunchEnabled(): Promise<boolean> {
	return platformIntegrator.isAutoLaunchEnabled().catch(e => {
		console.error("could not check auto launch status:", e)
		return false
	})
}

export function runIntegration(): void {
	platformIntegrator.runIntegration()
}