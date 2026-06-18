export interface CacheStorageInitReturn {
	/** If the created storage is an OfflineStorage */
	isPersistent: boolean
	/** If a OfflineStorage was created, whether or not the backing database was created fresh or already existed */
	isNewOfflineDb: boolean
}

export abstract class StorageArgs {
	__brand: null = null
}

export class EphemeralStorageArgs extends StorageArgs {
	constructor(readonly userId: Id) {
		super()
	}
}

export class OfflineStorageArgs extends StorageArgs {
	constructor(
		readonly userId: Id,
		readonly databaseKey: Uint8Array,
		readonly forceNewDatabase: boolean,
	) {
		super()
	}
}

export interface CacheStorageLateInitializer {
	initialize(args: StorageArgs): Promise<CacheStorageInitReturn>

	deInitialize(): Promise<void>
}
