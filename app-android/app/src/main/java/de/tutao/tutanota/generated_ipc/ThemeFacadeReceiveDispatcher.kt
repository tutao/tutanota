/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class ThemeFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: ThemeFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"getThemes" -> {
				val result: List<Map<String, String>> = this.facade.getThemes(
				)
				return json.encodeToString(result)
			}
			"setThemes" -> {
				val themes: List<Map<String, String>> = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setThemes(
					themes,
				)
				return json.encodeToString(result)
			}
			"getSelectedTheme" -> {
				val result: String? = this.facade.getSelectedTheme(
				)
				return json.encodeToString(result)
			}
			"setSelectedTheme" -> {
				val themeId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setSelectedTheme(
					themeId,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for ThemeFacade: $method")
		}
	}
}
