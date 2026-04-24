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
	 * Split the query into the tokens with signal tokenizer
	 */
	tokenize(query: string): Promise<ReadonlyArray<string>>
}
