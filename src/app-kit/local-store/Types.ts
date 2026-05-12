import { SessionType } from "../../platform-kit/app-env"

export interface SessionTypeProvider {
	getSessionType(): Promise<SessionType | null>
}

export interface OfflineStorageInitArgs {
	userId: Id
	databaseKey: Uint8Array
	forceNewDatabase: boolean
}

export interface EphemeralStorageInitArgs {
	userId: Id
}

export interface EphemeralStorageArgs extends EphemeralStorageInitArgs {
	type: "ephemeral"
}

export type OfflineStorageArgs = OfflineStorageInitArgs & {
	type: "offline"
}

export interface CacheStorageInitReturn {
	/** If the created storage is an OfflineStorage */
	isPersistent: boolean
	/** If a OfflineStorage was created, whether or not the backing database was created fresh or already existed */
	isNewOfflineDb: boolean
}
export interface CacheStorageLateInitializer {
	initialize(args: OfflineStorageArgs | EphemeralStorageArgs): Promise<CacheStorageInitReturn>

	deInitialize(): Promise<void>
}

export type SqlValue = null | string | number | Uint8Array

/**
 * Type tag for values being passed to SQL statements
 */
export const enum SqlType {
	Null = "SqlNull",
	Number = "SqlNum",
	String = "SqlStr",
	Bytes = "SqlBytes",
}

export type FormattedQuery = { query: string; params: TaggedSqlValue[] }
export type TaggedSqlValue =
	| { type: SqlType.Null; value: null }
	| { type: SqlType.String; value: string }
	| { type: SqlType.Number; value: number }
	| { type: SqlType.Bytes; value: Uint8Array }
