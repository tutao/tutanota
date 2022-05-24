package de.tutao.tutanota

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import android.util.Log
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.*

typealias Theme = Map<String, String>

private const val CURRENT_THEME_KEY = "theme"
private const val THEMES_KEY = "themes"
private const val TAG = "ThemeStorage"

/**
 * ThemeManager impl like in other native parts.
 * 4 methods correspond to ThemeStorage from web plus two convenience methods getCurrentTheme() and getCurrentThemeWithFallback().
 */
class ThemeManager(private val context: Context) {
	var selectedThemeId: String?
		get() = prefs.getString(CURRENT_THEME_KEY, null)
		set(value) {
			prefs.edit().putString(CURRENT_THEME_KEY, value).apply()
		}

	val themes: List<Theme>
		get() {
			val themesStrings = Objects.requireNonNull(prefs.getStringSet(THEMES_KEY, emptySet()))
			val themes = mutableListOf<Theme>()
			for (string in themesStrings) {
				try {
					val jsonTheme = JSONObject(string)
					val theme = jsonTheme.toMap()
					themes.add(theme)
				} catch (e: JSONException) {
					Log.e(TAG, "Could not parse theme", e)
				}
			}
			return themes
		}

	fun setThemes(themes: JSONArray) {
		val themeStrings: MutableSet<String> = HashSet()
		for (i in 0 until themes.length()) {
			try {
				val jsonObject = themes.getJSONObject(i)
				themeStrings.add(jsonObject.toString())
			} catch (e: JSONException) {
				Log.e(TAG, "Could not parse theme", e)
			}
		}
		prefs.edit().putStringSet(THEMES_KEY, themeStrings).apply()
	}

	val currentTheme: Theme?
		get() {
			var themeId = selectedThemeId
			if (themeId == null) {
				themeId = "light"
			}
			val themes = themes
			for (theme in themes) {
				if (themeId == theme["themeId"]) {
					return theme
				}
			}
			return null
		}
	val currentThemeWithFallback: Theme
		get() = currentTheme ?: mapOf(
				"themeId" to "light-fallback",
				"content_bg" to "#ffffff",
				"header_bg" to "#ffffff",
		)

	private val prefs: SharedPreferences
		get() = PreferenceManager.getDefaultSharedPreferences(context)
}