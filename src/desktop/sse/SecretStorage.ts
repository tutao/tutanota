import { default as keytar } from "keytar"
import { CancelledError } from "../../api/common/error/CancelledError"
import { noOp } from "@tutao/tutanota-utils"

const { CANCELLED, getPassword, setPassword } = keytar

export interface SecretStorage {
	getPassword(service: string, account: string): Promise<string | null>

	setPassword(service: string, account: string, password: string): Promise<void>
}

export class KeytarSecretStorage implements SecretStorage {
	/**
	 * keytar can't handle concurrent accesses to the keychain, so we need to sequence
	 * calls to getPassword and setPassword.
	 * this promise chain stores pending operations.
	 */
	private lastOp: Promise<unknown> = Promise.resolve()

	getPassword(service: string, account: string): Promise<string | null> {
		const newOp = this.lastOp.catch(noOp).then(() =>
			getPassword(service, account).catch((e) => {
				if (e.message === CANCELLED) {
					throw new CancelledError("user cancelled keychain unlock")
				}
				throw e
			}),
		)
		this.lastOp = newOp

		return newOp
	}

	setPassword(service: string, account: string, password: string): Promise<void> {
		const newOp = this.lastOp.catch(noOp).then(() => setPassword(service, account, password))
		this.lastOp = newOp
		return newOp
	}
}
