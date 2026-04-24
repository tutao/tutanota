import { AppLockMethod, MobileSystemFacade, NativeCredentialsFacade } from "@tutao/native-bridge"
import { CredentialEncryptionMode } from "@tutao/app-env"

/**
 * Enforces app authentication via system mechanism e.g. system password or biometrics.
 */
export interface AppLock {
	/** @throws CredentialAuthenticationError */
	enforce(): Promise<void>
	resetAppLockMethod(): Promise<void>
}

export class NoOpAppLock implements AppLock {
	async enforce(): Promise<void> {}
	async resetAppLockMethod(): Promise<void> {}
}

export class MobileAppLock implements AppLock {
	constructor(
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly credentialsFacade: NativeCredentialsFacade,
	) {}

	async enforce(): Promise<void> {
		if ((await this.credentialsFacade.getCredentialEncryptionMode()) !== CredentialEncryptionMode.DEVICE_LOCK) {
			// for migration: do not display the lock twice
			return
		}
		return this.mobileSystemFacade.enforceAppLock(await this.mobileSystemFacade.getAppLockMethod())
	}

	/**
	 * If the selected AppLockMethod is not present in supportedAppLockMethods allow fallback to `None`, otherwise
	 * it will keep on restricting user from loggingIn
	 */
	async resetAppLockMethod() {
		await this.mobileSystemFacade.setAppLockMethod(AppLockMethod.None)
	}
}
