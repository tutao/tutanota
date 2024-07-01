import type { WindowManager } from "../DesktopWindowManager"
import type { DesktopIntegrator } from "./DesktopIntegrator"
import { Registry } from "winreg"

type Electron = typeof Electron.CrossProcessExports

export class DesktopIntegratorWin32 implements DesktopIntegrator {
	_electron: Electron
	_registry: WinregStatic
	_autoRunKey: Registry

	constructor(electron: Electron, registry: WinregStatic) {
		this._electron = electron
		this._registry = registry
		this._autoRunKey = new registry({
			hive: registry.HKCU,
			key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
		})
	}

	isAutoLaunchEnabled(): Promise<boolean> {
		// can't promisify here because it screws with autoRunKeys 'this' semantics
		return new Promise((resolve: (_: boolean) => void, reject) => {
			this._autoRunKey.get(this._electron.app.name, (err, item) => {
				if (err) {
					reject(err)
				} else {
					resolve(typeof item !== "undefined" && item !== null)
				}
			})
		}).catch(() => false)
	}

	async enableAutoLaunch(): Promise<void> {
		if (!(await this.isAutoLaunchEnabled())) {
			// can't promisify here because it screws with autoRunKeys 'this' semantics
			return new Promise((resolve, reject) => {
				this._autoRunKey.set(this._electron.app.name, this._registry.REG_SZ, `${process.execPath} -a`, (err) => {
					if (err) {
						reject(err)
					}

					resolve()
				})
			})
		}
	}

	async disableAutoLaunch(): Promise<void> {
		// can't promisify here because it screws with autoRunKeys 'this' semantics
		if (await this.isAutoLaunchEnabled()) {
			return new Promise((resolve, reject) => {
				this._autoRunKey.remove(this._electron.app.name, (err) => {
					if (err) {
						reject(err)
					}

					resolve()
				})
			})
		}
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
