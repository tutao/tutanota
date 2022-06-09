/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface ThemeFacade {
	 suspend fun getThemes(
	): List<Map<String, String>>
	 suspend fun setThemes(
		themes: List<Map<String, String>>,
	): Unit
	 suspend fun getSelectedTheme(
	): String?
	 suspend fun setSelectedTheme(
		themeId: String,
	): Unit
}
