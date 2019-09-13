// @flow
import {log} from "../DesktopLog"

import type {WindowManager} from "../DesktopWindowManager"

export class DesktopIntegrator {
	platformIntegrator: Promise<{
		+enableAutoLaunch: ()=>Promise<void>,
		+disableAutoLaunch: ()=>Promise<void>,
		+isAutoLaunchEnabled: ()=>Promise<boolean>,
		+runIntegration: (wm: WindowManager)=>Promise<void>,
		+isIntegrated: () => Promise<boolean>,
		+integrate: ()=>Promise<void>,
		+unintegrate: ()=>Promise<void>,
	}>

	constructor(electron: $Exports<"electron">, fs: $Exports<"fs">, childProcess: $Exports<"child_process">,
	            winreg: () => Promise<$Exports<"winreg">>) {
		switch (process.platform) {
			case 'win32':
				this.platformIntegrator = Promise.all([import('./DesktopIntegratorWin32.js'), winreg()])
				                                 .then(([integrator, winreg]) => new integrator.DesktopIntegratorWin32(electron, winreg))
				break
			case 'darwin':
				this.platformIntegrator = import('./DesktopIntegratorDarwin.js')
					.then(({DesktopIntegratorDarwin}) => new DesktopIntegratorDarwin(electron))
				break
			case 'linux':
				this.platformIntegrator = import('./DesktopIntegratorLinux.js')
					.then(({DesktopIntegratorLinux}) => new DesktopIntegratorLinux(electron, fs, childProcess))
				break
			default:
				throw new Error('Invalid Platform')
		}
	}

	async enableAutoLaunch(): Promise<void> {
		return (await this.platformIntegrator).enableAutoLaunch().catch(e => {
			log.debug("could not enable auto launch:", e)
		})
	}

	async disableAutoLaunch(): Promise<void> {
		return (await this.platformIntegrator).disableAutoLaunch().catch(e => {
			log.debug("could not disable auto launch:", e)
		})
	}

	async isAutoLaunchEnabled(): Promise<boolean> {
		return (await this.platformIntegrator).isAutoLaunchEnabled().catch(e => {
			console.error("could not check auto launch status:", e)
			return false
		})
	}

	async runIntegration(wm: WindowManager): Promise<void> {
		return (await this.platformIntegrator).runIntegration(wm)
	}

	async isIntegrated(): Promise<boolean> {
		return (await this.platformIntegrator).isIntegrated()
	}

	async integrate(): Promise<void> {
		return (await this.platformIntegrator).integrate()
	}

	async unintegrate(): Promise<void> {
		return (await this.platformIntegrator).unintegrate()
	}
}
