import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopIntegrator } from "./DesktopIntegrator"
import { RegistryHive, WindowsRegistryFacade, WindowsRegistryKey } from "./WindowsRegistryFacade"

type Electron = typeof Electron.CrossProcessExports

export class DesktopIntegratorWin32 implements DesktopIntegrator {
	private readonly autoRunKey: WindowsRegistryKey

	constructor(
		private readonly electron: Electron,
		registry: WindowsRegistryFacade,
	) {
		this.autoRunKey = registry.entry(RegistryHive.HKEY_CURRENT_USER, "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")
	}

	async isAutoLaunchEnabled(): Promise<boolean> {
		try {
			return (await this.autoRunKey.get(this.electron.app.name)) != null
		} catch (e) {
			console.error(`Error when trying to query auto launch: ${e}`)
			return false
		}
	}

	async enableAutoLaunch(): Promise<void> {
		if (!(await this.isAutoLaunchEnabled())) {
			return this.autoRunKey.set(this.electron.app.name, `${process.execPath} -a`)
		}
	}

	async disableAutoLaunch(): Promise<void> {
		await this.autoRunKey.remove(this.electron.app.name)
	}

	runIntegration(wm: WindowManager): Promise<void> {
		return Promise.resolve()
	}

	isIntegrated(): Promise<boolean> {
		return Promise.resolve(true)
	}

	integrate(): Promise<void> {
		return Promise.resolve()
	}

	unintegrate(): Promise<void> {
		return Promise.resolve()
	}
}
