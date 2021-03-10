//@flow

import {getPassword, setPassword} from "keytar"

export interface SecretStorage {
	getPassword(service: string, account: string): Promise<?string>;

	setPassword(service: string, account: string, password: string): Promise<void>;
}

export class KeytarSecretStorage implements SecretStorage {
	getPassword(service: string, account: string): Promise<?string> {
		return getPassword(service, account)
	}

	setPassword(service: string, account: string, password: string): Promise<void> {
		return setPassword(service, account, password);
	}
}