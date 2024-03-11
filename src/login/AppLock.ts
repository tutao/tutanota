import { MobileSystemFacade } from "../native/common/generatedipc/MobileSystemFacade.js"
import { NativeCredentialsFacade } from "../native/common/generatedipc/NativeCredentialsFacade.js"
import { CredentialEncryptionMode } from "../misc/credentials/CredentialEncryptionMode.js"

/**
 * Enforces app authentication via system mechanism e.g. system password or biometrics.
 */
export interface AppLock {
	/** @throws CredentialAuthenticationError */
	enforce(): Promise<void>
}

export class NoOpAppLock implements AppLock {
	async enforce(): Promise<void> {}
}

export class MobileAppLock implements AppLock {
	constructor(private readonly mobileSystemFacade: MobileSystemFacade, private readonly credentialsFacade: NativeCredentialsFacade) {}

	async enforce(): Promise<void> {
		if ((await this.credentialsFacade.getCredentialEncryptionMode()) != CredentialEncryptionMode.DEVICE_LOCK) {
			// for migration: do not display the lock twice
			return
		}
		return this.mobileSystemFacade.enforceAppLock(await this.mobileSystemFacade.getAppLockMethod())
	}
}
