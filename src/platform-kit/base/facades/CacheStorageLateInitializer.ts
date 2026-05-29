export interface CacheStorageInitReturn {
	/** If the created storage is an OfflineStorage */
	isPersistent: boolean
	/** If a OfflineStorage was created, whether or not the backing database was created fresh or already existed */
	isNewOfflineDb: boolean
}

export interface EphemeralStorageArgs extends EphemeralStorageInitArgs {
	type: "ephemeral"
}

export interface OfflineStorageInitArgs {
	userId: Id
	databaseKey: Uint8Array
	timeRangeDate: Date | null
	forceNewDatabase: boolean
}

export type OfflineStorageArgs = OfflineStorageInitArgs & {
	type: "offline"
}

export interface CacheStorageLateInitializer {
	initialize(args: OfflineStorageArgs | EphemeralStorageArgs): Promise<CacheStorageInitReturn>

	deInitialize(): Promise<void>
}

export interface EphemeralStorageInitArgs {
	userId: Id
}
