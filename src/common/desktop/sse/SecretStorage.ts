import * as PathModule from "node:path"
import * as FsModule from "node:fs"
import { DeviceStorageUnavailableError } from "../../api/common/error/DeviceStorageUnavailableError.js"

export function preselectGnomeLibsecret(electron: typeof Electron.CrossProcessExports) {
	// this is how chromium selects a backend:
	// https://chromium.googlesource.com/chromium/src/+/main/components/os_crypt/sync/key_storage_util_linux.cc
	// also for DE detection, which happens before:
	// https://chromium.googlesource.com/chromium/src/+/main/base/nix/xdg_util.cc
	// I'm 90% sure that it's the deprecated "GNOME_DESKTOP_SESSION_ID" env var that's set once you have logged into gnome
	// and back out that makes it suddenly work with i3 since chromium falls back to that if none of the more modern vars
	// contain something it recognizes.
	// if no explicit backend is given, we default to trying gnome-libsecret since that was what we required before.
	if (process.platform === "linux" && !process.argv.some((a) => a.startsWith("--password-store="))) {
		electron.app.commandLine.appendSwitch("password-store", "gnome-libsecret")
	}
}

export interface SecretStorage {
	getPassword(service: string, account: string): Promise<string | null>

	setPassword(service: string, account: string, password: string): Promise<void>
}

/**
 * Secret Storage impl using the electron 15+ SafeStorage API
 *
 * Note: the main thread will be blocked while the keychain is being unlocked,
 * potentially for as long as the user takes to enter a password.
 * We're asking for access before any windows are created, which should prevent
 * any weirdness arising from that.
 */
export class SafeStorageSecretStorage implements SecretStorage {
	private initialized = false

	constructor(
		private readonly electron: typeof Electron.CrossProcessExports,
		private readonly fs: typeof FsModule,
		private readonly path: typeof PathModule,
	) {}

	async getPassword(service: string, account: string): Promise<string | null> {
		await this.assertAvailable()
		const keyPath = this.getKeyPath(service, account)
		try {
			const encPwBuffer = await this.fs.promises.readFile(keyPath)
			return this.electron.safeStorage.decryptString(encPwBuffer)
		} catch (e) {
			if (e.code === "ENOENT") {
				// the key wasn't created yet
				return null
			}
			throw e
		}
	}

	async setPassword(service: string, account: string, password: string): Promise<void> {
		await this.assertAvailable()
		const keyPath = this.getKeyPath(service, account)
		const cypherBuffer = this.electron.safeStorage.encryptString(password)
		return this.fs.promises.writeFile(keyPath, cypherBuffer)
	}

	private getKeyPath(service: string, account: string): string {
		const fname = service.concat("-", account)
		const safeStoragePath = this.getSafeStoragePath()
		return this.path.join(safeStoragePath, fname)
	}

	/**
	 * this should always be a path inside the user's home directory (or equivalent)
	 * @private
	 */
	private getSafeStoragePath(): string {
		return this.path.join(this.electron.app.getPath("userData"), "safe_storage")
	}

	/**
	 * ensures that the safe_storage directory exists and that we can use the
	 * safeStorage API
	 * @private
	 */
	private async assertAvailable(): Promise<void> {
		await this.electron.app.whenReady()
		await this.fs.promises.mkdir(this.getSafeStoragePath(), { recursive: true })
		if (this.electron.safeStorage.isEncryptionAvailable()) {
			if (!this.initialized && process.platform === "linux") {
				// only linux has variable backends
				this.initialized = true
				console.log("using safeStorage with backend", this.electron.safeStorage.getSelectedStorageBackend())
			}
			return
		}
		throw new DeviceStorageUnavailableError("safeStorage API is not available", null)
	}
}
