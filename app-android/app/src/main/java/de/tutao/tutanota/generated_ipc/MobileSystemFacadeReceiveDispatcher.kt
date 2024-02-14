/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class MobileSystemFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: MobileSystemFacade,
) {

	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"goToSettings" -> {
				val result: Unit = this.facade.goToSettings(
				)
				return json.encodeToString(result)
			}
			"openLink" -> {
				val uri: String = json.decodeFromString(arg[0])
				val result: Boolean = this.facade.openLink(
					uri,
				)
				return json.encodeToString(result)
			}
			"shareText" -> {
				val text: String = json.decodeFromString(arg[0])
				val title: String = json.decodeFromString(arg[1])
				val result: Boolean = this.facade.shareText(
					text,
					title,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for MobileSystemFacade: $method")
		}
	}
}
