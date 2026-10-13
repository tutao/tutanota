package de.tutao.calendar

import android.app.UiModeManager
import android.content.Context
import android.content.SharedPreferences
import android.content.res.Configuration.UI_MODE_NIGHT_MASK
import android.content.res.Configuration.UI_MODE_NIGHT_YES
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowInsetsControllerCompat
import de.tutao.tutashared.getDefaultSharedPreferences
import de.tutao.tutashared.ipc.ThemeFacade
import de.tutao.tutashared.parseColor
import de.tutao.tutashared.toMap
import org.json.JSONException
import org.json.JSONObject
import androidx.core.graphics.drawable.toDrawable
import de.tutao.tutashared.isLightColor
import androidx.core.content.edit

class AndroidThemeFacade(
	private val context: Context,
	private val activity: AppCompatActivity,
) : ThemeFacade {
	companion object {
		private const val CURRENT_THEME_KEY = "theme"
		private const val THEMES_KEY = "themes"
		private const val TAG = "AndroidThemeFacade"
		private val FALLBACK_THEME = mapOf(
			"themeId" to "light-fallback",
			"surface" to "#ffffff",
			"surface_container" to "#f6f6f6",
		)
	}

	private var themes: MutableList<Map<String, String>> = mutableListOf()
	private var currentThemeId: String? = null
	private var currentThemeOrFallback: Map<String, String>? = null

	override suspend fun getThemes(): List<Map<String, String>> {
		if (themes.count() == 0) {
			loadState(getDefaultSharedPreferences(context))
		}
		return themes
	}

	override suspend fun setThemes(themes: List<Map<String, String>>) {
		this.themes.clear()
		this.themes.addAll(themes)

		currentThemeOrFallback = FALLBACK_THEME
		val themeStrings: MutableSet<String> = HashSet()
		for (theme in themes) {
			if (theme["themeId"] == currentThemeId) {
				currentThemeOrFallback = theme
			}
			try {
				themeStrings.add(JSONObject(theme).toString())
			} catch (e: JSONException) {
				Log.e(TAG, "Could not parse theme", e)
			}
		}
		getDefaultSharedPreferences(context).edit { putStringSet(THEMES_KEY, themeStrings) }
		applyCurrentTheme() // reapply theme in case the current selected theme definition has changed
	}

	override suspend fun getThemePreference(): String {
		if (currentThemeId == null) {
			loadState(getDefaultSharedPreferences(context))
		}
		return requireNotNull(currentThemeId)
	}

	override suspend fun setThemePreference(themePreference: String) {
		val defaultSharedPreferences = getDefaultSharedPreferences(context)

		currentThemeId = themePreference
		if (themes.count() == 0) {
			loadState(defaultSharedPreferences)
		} else {
			currentThemeOrFallback = themes.firstOrNull { it["themeId"] == currentThemeId } ?: FALLBACK_THEME
		}

		defaultSharedPreferences.edit { putString(CURRENT_THEME_KEY, themePreference) }
		applyCurrentTheme()
	}

	override suspend fun prefersDark(): Boolean {
		return prefersDarkSynchronous()
	}

	private fun prefersDarkSynchronous(): Boolean {
		return (context.resources.configuration.uiMode and UI_MODE_NIGHT_MASK) == UI_MODE_NIGHT_YES
	}

	fun getCurrentThemeOrFallback(): Map<String, String> {
		if (currentThemeOrFallback == null) {
			loadState(getDefaultSharedPreferences(context))
		}
		return requireNotNull(currentThemeOrFallback)
	}

	fun applyCurrentTheme() {
		val theme = this.getCurrentThemeOrFallback()

		activity.runOnUiThread {
			Log.d(TAG, "changeTheme: $currentThemeId")

			val surfaceContainerColor = getColorInt(theme, "surface_container")
			val surfaceColor = getColorInt(theme, "surface")
			val surfaceColorIsLight = surfaceColor.isLightColor()

			// Make all app components light or dark by default by setting the default night mode
			AppCompatDelegate.setDefaultNightMode(
				if (currentThemeId == "light") {
					AppCompatDelegate.MODE_NIGHT_NO
				} else if (currentThemeId == "dark") {
					AppCompatDelegate.MODE_NIGHT_YES
				} else if (surfaceColorIsLight) {
					AppCompatDelegate.MODE_NIGHT_NO
				} else {
					AppCompatDelegate.MODE_NIGHT_YES
				}
			)

			val windowInsetController = WindowInsetsControllerCompat(activity.window, activity.window.decorView)

			activity.window.setBackgroundDrawable(surfaceColor.toDrawable())

			activity.window.navigationBarColor = surfaceColor
			windowInsetController.isAppearanceLightNavigationBars = surfaceColorIsLight

			activity.window.statusBarColor = surfaceContainerColor
			windowInsetController.isAppearanceLightStatusBars = surfaceContainerColor.isLightColor()
		}
	}

	private fun getColorInt(theme: Map<String, String>, key: String): Int {
		// The fallback return value -1 is the signed version of UInt(0xFFFFFF) for white
		val colorString = theme[key] ?: FALLBACK_THEME[key] ?: return -1
		return parseColor(colorString)
	}

	private fun loadState(defaultSharedPreferences: SharedPreferences) {
		currentThemeId = defaultSharedPreferences.getString(CURRENT_THEME_KEY, "light")
		if (currentThemeId == "auto:light|dark") {
			currentThemeId = if (prefersDarkSynchronous()) "dark" else "light"
		}

		themes.clear()
		currentThemeOrFallback = FALLBACK_THEME
		for (jsonString in defaultSharedPreferences.getStringSet(THEMES_KEY, null).orEmpty()) {
			try {
				val jsonTheme = JSONObject(jsonString)
				val theme = jsonTheme.toMap()
				themes.add(theme)
				if (jsonTheme.get("themeId") == currentThemeId) {
					currentThemeOrFallback = theme
				}
			} catch (e: JSONException) {
				Log.e(TAG, "Could not parse theme", e)
			}
		}
	}
}
