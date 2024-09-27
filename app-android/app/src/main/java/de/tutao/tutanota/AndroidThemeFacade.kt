package de.tutao.tutanota

import android.content.Context
import android.content.SharedPreferences
import android.content.res.Configuration.UI_MODE_NIGHT_MASK
import android.content.res.Configuration.UI_MODE_NIGHT_YES
import android.graphics.drawable.ColorDrawable
import android.util.Log
import androidx.annotation.ColorInt
import androidx.core.view.WindowInsetsControllerCompat
import de.tutao.tutashared.getDefaultSharedPreferences
import de.tutao.tutashared.ipc.ThemeFacade
import de.tutao.tutashared.isLightHexColor
import de.tutao.tutashared.parseColor
import de.tutao.tutashared.toMap
import org.json.JSONException
import org.json.JSONObject
import java.util.*

typealias Theme = Map<String, String>
typealias ThemeId = String
typealias ThemePreference = String

class AndroidThemeFacade(
	private val context: Context,
	private val activity: MainActivity,
) : ThemeFacade {
	companion object {
		private const val CURRENT_THEME_KEY = "theme"
		private const val THEMES_KEY = "themes"
		private const val TAG = "AndroidThemeFacade"
		private val LIGHT_FALLBACK_THEME = mapOf(
			"themeId" to "light-fallback",
			"content_bg" to "#ffffff",
			"header_bg" to "#ffffff",
			"navigation_bg" to "#f6f6f6",
		)
	}

	private val prefs: SharedPreferences
		get() = getDefaultSharedPreferences(context)

	private var themePreference: ThemePreference?
		get() = prefs.getString(CURRENT_THEME_KEY, null)
		set(value) {
			prefs.edit().putString(CURRENT_THEME_KEY, value).apply()
		}


	private val currentTheme: Theme?
		get() {
			val themeId = resolveThemePreference()
			val themes = themes
			for (theme in themes) {
				if (themeId == theme["themeId"]) {
					return theme
				}
			}
			return null
		}

	private fun resolveThemePreference(): ThemeId {
		val pref = themePreference
		return if (pref == "auto:light|dark") {
			if (prefersDarkMode) "dark" else "light"
		} else pref ?: "light"
	}

	override suspend fun prefersDark(): Boolean = this.prefersDarkMode

	private val prefersDarkMode: Boolean
		get() = (context.resources.configuration.uiMode and UI_MODE_NIGHT_MASK) == UI_MODE_NIGHT_YES

	val currentThemeWithFallback: Theme
		get() {
			return currentTheme ?: LIGHT_FALLBACK_THEME
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

	private fun applyTheme() {
		val theme = this.currentThemeWithFallback
		activity.runOnUiThread { doApplyTheme(theme) }
	}

	fun applyCurrentTheme() {
		doApplyTheme(currentThemeWithFallback)
	}

	private fun doApplyTheme(theme: Theme) {
		Log.d(TAG, "changeTheme: " + theme["themeId"])
		@ColorInt val backgroundColor = parseColor(getColor(theme, "content_bg"))
		activity.window.setBackgroundDrawable(ColorDrawable(backgroundColor))

		// It is not an accident that navBg and headerBg seem to be swapped, the original color scheme was reused in
		// this way.

		val navBg = getColor(theme, "header_bg")

		@ColorInt val navColor = parseColor(navBg)
		val isNavBarLight = navBg.isLightHexColor()
		activity.window.navigationBarColor = navColor

		val windowInsetController = WindowInsetsControllerCompat(activity.window, activity.window.decorView)

		if (isNavBarLight) {
			windowInsetController.isAppearanceLightNavigationBars = true
		}

		val headerBg = getColor(theme, "navigation_bg")
		@ColorInt val statusBarColor = parseColor(headerBg)
		val isStatusBarLight = headerBg.isLightHexColor()

		// Changing status bar color
		// Before Android M there was no flag to use lightStatusBar (so that text is white or
		// black). As our primary color is red, Android thinks that the status bar color text
		// should be white. So we cannot use white status bar color.
		// So for Android M and above we alternate between white and dark status bar colors and
		// we change lightStatusBar flag accordingly.
		activity.window.statusBarColor = statusBarColor
		if (isStatusBarLight) {
			windowInsetController.isAppearanceLightStatusBars = true
		}
	}

	private fun getColor(theme: Map<String, String>, key: String): String =
			theme[key] ?: LIGHT_FALLBACK_THEME[key] ?: "#FFFFFF"

	override suspend fun getThemes(): List<Map<String, String>> {
		return this.themes
	}

	override suspend fun setThemes(themes: List<Map<String, String>>) {
		val themeStrings: MutableSet<String> = HashSet()
		for (theme in themes) {
			try {
				themeStrings.add(JSONObject(theme).toString())
			} catch (e: JSONException) {
				Log.e(TAG, "Could not parse theme", e)
			}
		}
		prefs.edit().putStringSet(THEMES_KEY, themeStrings).apply()
		applyTheme() // reapply theme in case the current selected theme definition has changed
		return
	}

	override suspend fun getThemePreference(): ThemePreference? {
		return this.themePreference
	}

	override suspend fun setThemePreference(themePreference: ThemePreference) {
		this.themePreference = themePreference
		applyTheme()
		return
	}
}
