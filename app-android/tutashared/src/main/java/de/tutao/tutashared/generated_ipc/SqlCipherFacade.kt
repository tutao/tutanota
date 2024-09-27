/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface SqlCipherFacade {
	suspend fun openDb(
		userId: String,
		dbKey: DataWrapper,
	): Unit
	suspend fun closeDb(
	): Unit
	suspend fun deleteDb(
		userId: String,
	): Unit
	suspend fun run(
		query: String,
		params: List<TaggedSqlValue>,
	): Unit
	/**
	 * get a single object or null if the query returns nothing
	 */
	suspend fun get(
		query: String,
		params: List<TaggedSqlValue>,
	): Map<String, TaggedSqlValue>?
	/**
	 * return a list of objects or an empty list if the query returns nothing
	 */
	suspend fun all(
		query: String,
		params: List<TaggedSqlValue>,
	): List<Map<String, TaggedSqlValue>>
	/**
	 * We want to lock the access to the "ranges" db when updating / reading the offline available mail list ranges for each mail list (referenced using the listId)
	 */
	suspend fun lockRangesDbAccess(
		listId: String,
	): Unit
	/**
	 * This is the counterpart to the function "lockRangesDbAccess(listId)"
	 */
	suspend fun unlockRangesDbAccess(
		listId: String,
	): Unit
}
