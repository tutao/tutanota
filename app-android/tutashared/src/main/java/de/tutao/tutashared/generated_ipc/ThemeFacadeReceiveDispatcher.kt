/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

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
			"getThemePreference" -> {
				val result: String? = this.facade.getThemePreference(
				)
				return json.encodeToString(result)
			}
			"setThemePreference" -> {
				val themePreference: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.setThemePreference(
					themePreference,
				)
				return json.encodeToString(result)
			}
			"prefersDark" -> {
				val result: Boolean = this.facade.prefersDark(
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for ThemeFacade: $method")
		}
	}
}
