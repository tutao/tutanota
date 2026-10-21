package de.tutao.tutashared

import android.content.Context
import android.content.SharedPreferences
import android.content.res.Configuration
import android.content.res.Configuration.UI_MODE_NIGHT_MASK
import android.content.res.Configuration.UI_MODE_NIGHT_YES
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.content.edit
import androidx.core.graphics.drawable.toDrawable
import androidx.core.view.WindowInsetsControllerCompat
import de.tutao.tutashared.ipc.ThemeFacade
import org.json.JSONException
import org.json.JSONObject

class AndroidThemeFacade : ThemeFacade {
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

	val context: Context
	val activity: ComponentActivity
	val defaultSharedPreferences: SharedPreferences
	var uiModeIsNight: Boolean = false
	var themePreference: String
	var themes: List<Map<String, String>>

	constructor(context: Context, activity: ComponentActivity) {
		this.context = context
		this.activity = activity

		setUiModeIsNightFromConfiguration(context.resources.configuration)

		defaultSharedPreferences = getDefaultSharedPreferences(context)

		themePreference = defaultSharedPreferences.getString(CURRENT_THEME_KEY, null) ?: "auto:light|dark"

		val mutableThemes = mutableListOf<Map<String, String>>()
		for (jsonString in defaultSharedPreferences.getStringSet(THEMES_KEY, null).orEmpty()) {
			try {
				mutableThemes.add(JSONObject(jsonString).toMap())
			} catch (e: JSONException) {
				Log.e(TAG, "Could not parse theme", e)
			}
		}
		themes = mutableThemes
	}

	override suspend fun getThemes(): List<Map<String, String>> {
		return themes
	}

	override suspend fun setThemes(themes: List<Map<String, String>>) {
		defaultSharedPreferences.edit { putStringSet(
			THEMES_KEY,
			themes.mapTo(HashSet()) { JSONObject(it).toString() }
		) }
		this.themes = themes
		applyThemeInternal()
	}

	override suspend fun getThemePreference(): String {
		return themePreference
	}

	override suspend fun setThemePreference(themePreference: String) {
		defaultSharedPreferences.edit { putString(CURRENT_THEME_KEY, themePreference) }
		this.themePreference = themePreference
		applyThemeInternal()
	}

	override suspend fun prefersDark(): Boolean {
		return this.uiModeIsNight
	}

	fun getCurrentThemeOrFallback(): Map<String, String> {
		return getThemeByIdElseFallbackTheme(getThemeIdFromThemePreference())
	}


	fun applyTheme(newConfiguration: Configuration) {
		setUiModeIsNightFromConfiguration(newConfiguration)
		applyThemeInternal()
	}

	private fun applyThemeInternal() {
		val themeId = getThemeIdFromThemePreference()
		val theme = getThemeByIdElseFallbackTheme(themeId)

		// The following code will fail if not executed in the UI-thread. The facade methods "setThemes" and
		// "setThemePreference" call this method from another thread; activity.runOnUiThread will switch context to the
		// UI-thread in these scenarios. If this method is called from the UI-thread directly, the callback will be
		// run immediately (see docs for Activity.runOnUiThread).
		activity.runOnUiThread {
			Log.d(TAG, "changeTheme: $themeId")

			val surfaceContainerColor = getColorInt(theme, "surface_container")
			val surfaceColor = getColorInt(theme, "surface")
			val surfaceColorIsLight = surfaceColor.isLightColor()

			// Make all app components light or dark by default by setting the default night mode
			AppCompatDelegate.setDefaultNightMode(
				if (themeId == "light") {
					AppCompatDelegate.MODE_NIGHT_NO
				} else if (themeId == "dark") {
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
			if (surfaceColorIsLight) {
				windowInsetController.isAppearanceLightNavigationBars = true
			}

			// Changing status bar color
			// Before Android M there was no flag to use lightStatusBar (so that text is white or
			// black). As our primary color is red, Android thinks that the status bar color text
			// should be white. So we cannot use white status bar color.
			// So for Android M and above we alternate between white and dark status bar colors and
			// we change lightStatusBar flag accordingly.
			activity.window.statusBarColor = surfaceContainerColor
			windowInsetController.isAppearanceLightStatusBars = surfaceContainerColor.isLightColor()
		}
	}

	private fun setUiModeIsNightFromConfiguration(configuration: Configuration) {
		this.uiModeIsNight = (configuration.uiMode and UI_MODE_NIGHT_MASK) == UI_MODE_NIGHT_YES
	}

	private fun getThemeIdFromThemePreference(): String {
		if (themePreference == "auto:light|dark") {
			return if (uiModeIsNight) "dark" else "light"
		}
		return themePreference
	}

	private fun getThemeByIdElseFallbackTheme(themeId: String): Map<String, String> {
		return themes.firstOrNull { it["themeId"] == themeId } ?: FALLBACK_THEME
	}

	private fun getColorInt(theme: Map<String, String>, key: String): Int {
		// The fallback return value -1 is the signed version of UInt(0xFFFFFF) for white
		val colorString = theme[key] ?: FALLBACK_THEME[key] ?: return -1
		return parseColor(colorString)
	}
}