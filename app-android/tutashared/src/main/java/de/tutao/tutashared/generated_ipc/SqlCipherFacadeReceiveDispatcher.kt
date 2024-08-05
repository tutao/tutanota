/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class SqlCipherFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: SqlCipherFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"openDb" -> {
				val userId: String = json.decodeFromString(arg[0])
				val dbKey: DataWrapper = json.decodeFromString(arg[1])
				val result: Unit = this.facade.openDb(
					userId,
					dbKey,
				)
				return json.encodeToString(result)
			}
			"closeDb" -> {
				val result: Unit = this.facade.closeDb(
				)
				return json.encodeToString(result)
			}
			"deleteDb" -> {
				val userId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteDb(
					userId,
				)
				return json.encodeToString(result)
			}
			"run" -> {
				val query: String = json.decodeFromString(arg[0])
				val params: List<TaggedSqlValue> = json.decodeFromString(arg[1])
				val result: Unit = this.facade.run(
					query,
					params,
				)
				return json.encodeToString(result)
			}
			"get" -> {
				val query: String = json.decodeFromString(arg[0])
				val params: List<TaggedSqlValue> = json.decodeFromString(arg[1])
				val result: Map<String, TaggedSqlValue>? = this.facade.get(
					query,
					params,
				)
				return json.encodeToString(result)
			}
			"all" -> {
				val query: String = json.decodeFromString(arg[0])
				val params: List<TaggedSqlValue> = json.decodeFromString(arg[1])
				val result: List<Map<String, TaggedSqlValue>> = this.facade.all(
					query,
					params,
				)
				return json.encodeToString(result)
			}
			"lockRangesDbAccess" -> {
				val listId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.lockRangesDbAccess(
					listId,
				)
				return json.encodeToString(result)
			}
			"unlockRangesDbAccess" -> {
				val listId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.unlockRangesDbAccess(
					listId,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for SqlCipherFacade: $method")
		}
	}
}
