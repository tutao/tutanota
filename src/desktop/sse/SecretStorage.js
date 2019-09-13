//@flow

import {findPassword, setPassword} from "keytar"

export interface SecretStorage {
	findPassword(service: string): Promise<?string>;

	setPassword(service: string, account: string, password: string): Promise<void>;
}

export class KeytarSecretStorage implements SecretStorage {
	findPassword(service: string): Promise<?string> {
		return findPassword(service)
	}

	setPassword(service: string, account: string, password: string): Promise<void> {
		return setPassword(service, account, password);
	}
}