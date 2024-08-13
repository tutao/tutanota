/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class ExternalCalendarFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: ExternalCalendarFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"fetchExternalCalendar" -> {
				val url: String = json.decodeFromString(arg[0])
				val result: String = this.facade.fetchExternalCalendar(
					url,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for ExternalCalendarFacade: $method")
		}
	}
}
