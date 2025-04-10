import { assertNotNull, defer, DeferredObject } from "@tutao/tutanota-utils"
import type { DbFacade } from "./DbFacade"
import { DbEncryptionData } from "./SearchTypes"

/**
 * A small wrapper to aid in using encrypted IndexedDb database.
 * Provides access to {@link DbFacade} (right away) and {@link DbEncryptionData} (once initialized).
 */
export class EncryptedDbWrapper {
	private _encryptionData: DbEncryptionData | null = null
	private initDefer: DeferredObject<void> = defer()

	constructor(readonly dbFacade: DbFacade) {}

	init(encryptionData: DbEncryptionData) {
		this._encryptionData = encryptionData
		this.initDefer.resolve()
	}

	async encryptionData(): Promise<DbEncryptionData> {
		await this.initDefer.promise
		return assertNotNull(this._encryptionData)
	}
}
