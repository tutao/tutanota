/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class CommonSystemFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: CommonSystemFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"initializeRemoteBridge" -> {
				val result: Unit = this.facade.initializeRemoteBridge(
				)
				return json.encodeToString(result)
			}
			"reload" -> {
				val query: Map<String, String> = json.decodeFromString(arg[0])
				val result: Unit = this.facade.reload(
					query,
				)
				return json.encodeToString(result)
			}
			"getLog" -> {
				val result: String = this.facade.getLog(
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for CommonSystemFacade: $method")
		}
	}
}
