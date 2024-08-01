/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface ThemeFacade {
	suspend fun getThemes(
	): List<Map<String, String>>
	suspend fun setThemes(
		themes: List<Map<String, String>>,
	): Unit
	suspend fun getThemePreference(
	): String?
	suspend fun setThemePreference(
		themePreference: String,
	): Unit
	suspend fun prefersDark(
	): Boolean
}
