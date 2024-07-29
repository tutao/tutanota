/* generated file, don't edit. */

import { TaggedSqlValue } from "./TaggedSqlValue.js"
export interface SqlCipherFacade {
	openDb(userId: string, dbKey: Uint8Array): Promise<void>

	closeDb(): Promise<void>

	deleteDb(userId: string): Promise<void>

	run(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<void>

	/**
	 * get a single object or null if the query returns nothing
	 */
	get(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<Record<string, TaggedSqlValue> | null>

	/**
	 * return a list of objects or an empty list if the query returns nothing
	 */
	all(query: string, params: ReadonlyArray<TaggedSqlValue>): Promise<ReadonlyArray<Record<string, TaggedSqlValue>>>

	/**
	 * We want to lock the access to the "ranges" db when updating / reading the offline available mail list ranges for each mail list (referenced using the listId)
	 */
	lockRangesDbAccess(listId: string): Promise<void>

	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 */
	unlockRangesDbAccess(listId: string): Promise<void>
}
