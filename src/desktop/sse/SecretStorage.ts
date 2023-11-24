import { CancelledError } from "../../api/common/error/CancelledError"
import { noOp } from "@tutao/tutanota-utils"
import * as PathModule from "node:path"
import * as FsModule from "node:fs"
import { DeviceStorageUnavailableError } from "../../api/common/error/DeviceStorageUnavailableError.js"
import type { default as Keytar } from "keytar"
import os from "node:os"

export async function buildSecretStorage(electron: typeof Electron.CrossProcessExports, fs: typeof FsModule, path: typeof PathModule): Promise<SecretStorage> {
	const mode = determineMode(electron)
	switch (mode) {
		case "dummy":
			return new SafeStorageSecretStorage(electron, fs, path, new DummySecretStorage())
		case "quit":
			electron.app.quit()
			return new SafeStorageSecretStorage(electron, fs, path, new DummySecretStorage())
		case "keytar": {
			const { default: keytar } = await import("keytar")
			const secretStorage = new KeytarSecretStorage(keytar)
			return new SafeStorageSecretStorage(electron, fs, path, secretStorage)
		}
	}
}

function determineMode(electron: typeof Electron.CrossProcessExports): "dummy" | "keytar" | "quit" {
	const release = Number(os.release().split(".")[0])
	// on macos, the last working keytar build was for 3.118.13, which
	// only supported x64. we cannot get a working keytar for old macos
	// on arm64 devices, but all of them can upgrade and use the new arm64 binary.
	const isBroken =
		process.platform === "darwin" &&
		// only arm64 must use a keytar.node post-breakage
		process.arch === "arm64" &&
		// basically big sur (do M1s even come with catalina?)
		release < 21

	if (!isBroken) return "keytar"

	switch (
		electron.dialog.showMessageBoxSync({
			buttons: ["Don't decrypt", "Decrypt anyway", "Quit Tuta"],
			cancelId: 2,
			defaultId: 0,
			message: "Your MacOS version is outdated and decrypting stored credentials may crash Tuta.",
			title: "SecretStorage",
		})
	) {
		case 0:
			return "dummy"
		case 1:
			return "keytar"
		default:
			return "quit"
	}
}

export interface SecretStorage {
	getPassword(service: string, account: string): Promise<string | null>

	setPassword(service: string, account: string, password: string): Promise<void>
}

export class KeytarSecretStorage implements SecretStorage {
	private readonly CANCELLED: string
	private readonly _getPassword: (service: string, account: string) => Promise<string | null>
	private readonly _setPassword: (service: string, account: string, password: string) => Promise<void>

	/**
	 * keytar can't handle concurrent accesses to the keychain, so we need to sequence
	 * calls to getPassword and setPassword.
	 * this promise chain stores pending operations.
	 */

	constructor(keytar: typeof Keytar) {
		this.CANCELLED = keytar.CANCELLED
		this._getPassword = keytar.getPassword
		this._setPassword = keytar.setPassword
	}

	private lastOp: Promise<unknown> = Promise.resolve()

	getPassword(service: string, account: string): Promise<string | null> {
		const newOp = this.lastOp.catch(noOp).then(() =>
			this._getPassword(service, account).catch((e) => {
				if (e.message === this.CANCELLED) {
					throw new CancelledError("user cancelled keychain unlock")
				}
				throw e
			}),
		)
		this.lastOp = newOp

		return newOp
	}

	setPassword(service: string, account: string, password: string): Promise<void> {
		const newOp = this.lastOp.catch(noOp).then(() => this._setPassword(service, account, password))
		this.lastOp = newOp
		return newOp
	}
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
		private readonly keytarSecretStorage: SecretStorage,
	) {}

	async getPassword(service: string, account: string): Promise<string | null> {
		await this.assertAvailable()
		const keyPath = this.getKeyPath(service, account)
		try {
			const encPwBuffer = await this.fs.promises.readFile(keyPath)
			return this.electron.safeStorage.decryptString(encPwBuffer)
		} catch (e) {
			if (e.code === "ENOENT") {
				// we might not have the key in safeStorage yet, but we might have it in the keytar storage.
				return await this.migrateKeytarPassword(service, account)
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

	/**
	 * most devices will have stored a deviceKey with keytar, which we can move
	 * to the safeStorage impl.
	 *
	 * @private
	 */
	private async migrateKeytarPassword(service: string, account: string): Promise<string | null> {
		let keytarPw: string | null = null
		try {
			keytarPw = await this.keytarSecretStorage.getPassword(service, account)
		} catch (e) {
			console.log("keytar failed, assuming there's no pw stored")
		}
		if (keytarPw != null) {
			await this.setPassword(service, account, keytarPw)
		}

		return keytarPw
	}
}

/**
 * used as an ephemeral storage that prevets outdated arm64 macs
 * from crashing when they attempt to load keytar.
 * */
class DummySecretStorage implements SecretStorage {
	private readonly map: Map<string, string> = new Map()

	async getPassword(service: string, account: string): Promise<string | null> {
		return this.map.get(DummySecretStorage.getName(service, account)) ?? null
	}

	async setPassword(service: string, account: string, password: string): Promise<void> {
		this.map.set(DummySecretStorage.getName(service, account), password)
	}

	private static getName(service: string, account: string): string {
		return service.concat("-", account)
	}
}
