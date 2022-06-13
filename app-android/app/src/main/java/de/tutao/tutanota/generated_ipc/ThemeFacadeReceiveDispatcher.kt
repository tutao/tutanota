/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class ThemeFacadeReceiveDispatcher(
	private val facade: ThemeFacade
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"getThemes" -> {
				val result: List<Map<String, String>> = this.facade.getThemes(
				)
				return Json.encodeToString(result)
			}
			"setThemes" -> {
				val themes: List<Map<String, String>> = Json.decodeFromString(arg[0])
				val result: Unit = this.facade.setThemes(
					themes,
				)
				return Json.encodeToString(result)
			}
			"getSelectedTheme" -> {
				val result: String? = this.facade.getSelectedTheme(
				)
				return Json.encodeToString(result)
			}
			"setSelectedTheme" -> {
				val themeId: String = Json.decodeFromString(arg[0])
				val result: Unit = this.facade.setSelectedTheme(
					themeId,
				)
				return Json.encodeToString(result)
			}
			else -> throw Error("unknown method for ThemeFacade: $method")
		}
	}
}
