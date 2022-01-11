import {CANCELLED, getPassword, setPassword} from "keytar"
import {CancelledError} from "../../api/common/error/CancelledError"

export interface SecretStorage {
	getPassword(service: string, account: string): Promise<string | null>

	setPassword(service: string, account: string, password: string): Promise<void>
}

export class KeytarSecretStorage implements SecretStorage {
	getPassword(service: string, account: string): Promise<string | null> {
		return getPassword(service, account)
			.catch(e => {
				if (e.message === CANCELLED) throw new CancelledError("user cancelled keychain unlock")
				throw e
			})
	}

	setPassword(service: string, account: string, password: string): Promise<void> {
		return setPassword(service, account, password)
	}
}