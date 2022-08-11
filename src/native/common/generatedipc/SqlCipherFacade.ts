/* generated file, don't edit. */

import {TaggedSqlValue} from "./TaggedSqlValue.js"
export interface SqlCipherFacade {

	openDb(
		userId: string,
		dbKey: Uint8Array,
	): Promise<void>
	
	closeDb(
	): Promise<void>
	
	deleteDb(
		userId: string,
	): Promise<void>
	
	run(
		query: string,
		params: ReadonlyArray<TaggedSqlValue>,
	): Promise<void>
	
	get(
		query: string,
		params: ReadonlyArray<TaggedSqlValue>,
	): Promise<Record<string, TaggedSqlValue> | null>
	
	all(
		query: string,
		params: ReadonlyArray<TaggedSqlValue>,
	): Promise<ReadonlyArray<Record<string, TaggedSqlValue>>>
	
}
