// @flow

let platformAutoLauncher
switch (process.platform) {
	case 'win32':
		platformAutoLauncher = require('./AutoLauncherWin32.js')
		break
	case 'darwin':
		platformAutoLauncher = require('./AutoLauncherDarwin.js')
		break
	case 'linux':
		platformAutoLauncher = require('./AutoLauncherLinux.js')
		break
	default:
		throw new Error('Invalid Platform')
}

export function enableAutoLaunch(): Promise<void> {
	return platformAutoLauncher.enableAutoLaunch()
}

export function disableAutoLaunch(): Promise<void> {
	return platformAutoLauncher.disableAutoLaunch()
}

export function isAutoLaunchEnabled(): Promise<boolean> {
	return platformAutoLauncher.isAutoLaunchEnabled().catch(e => {
		console.error("could not check auto launch status:", e)
		return false
	})
}