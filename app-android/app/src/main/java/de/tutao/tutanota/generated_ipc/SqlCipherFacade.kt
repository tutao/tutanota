/* generated file, don't edit. */


package de.tutao.tutanota.ipc

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
	 suspend fun get(
		query: String,
		params: List<TaggedSqlValue>,
	): Map<String, TaggedSqlValue>?
	 suspend fun all(
		query: String,
		params: List<TaggedSqlValue>,
	): List<Map<String, TaggedSqlValue>>
}
