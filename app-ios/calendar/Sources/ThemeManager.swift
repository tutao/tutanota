import Foundation

typealias ThemeId = String
typealias ThemePreference = String
typealias Theme = [String: String]

private let SELECTED_THEME = "theme"
private let THEMES = "themes"
private let LIGHT_FALLBACK_THEME = ["themeId": "light-fallback", "surface": "#ffffff"]
private let DARK_FALLBACK_THEME = ["themeId": "dark-fallback", "surface": "#dddddd"]

class ThemeManager: NSObject {
	private let userPreferencesProvider: UserPreferencesProvider

	init(userProferencesProvider: UserPreferencesProvider) { self.userPreferencesProvider = userProferencesProvider }

	public var themePreference: ThemePreference? {
		get { userPreferencesProvider.getObject(forKey: SELECTED_THEME) as! ThemePreference? }
		set(newVal) { userPreferencesProvider.setValue(newVal, forKey: SELECTED_THEME) }
	}

	public var themes: [Theme] {
		get { userPreferencesProvider.getObject(forKey: THEMES) as! [Theme]? ?? [] }
		set(newVal) { return userPreferencesProvider.setValue(newVal, forKey: THEMES) }
	}

	public var currentTheme: Theme? {
		get {
			let themeId = resolveThemePreference()
			return themes.first { theme in theme["themeId"] == themeId }
		}
	}

	public var currentThemeWithFallback: Theme {
		get {
			if currentTheme == nil {
				return LIGHT_FALLBACK_THEME
			} else {
				// Use fallback for new color theme migration
				if currentTheme!["content_bg"] != nil {
					return (UITraitCollection.current.userInterfaceStyle == .dark) ? DARK_FALLBACK_THEME : LIGHT_FALLBACK_THEME
				} else {
					return currentTheme!
				}
			}
		}
	}

	private func resolveThemePreference() -> ThemeId? {
		let pref = self.themePreference
		if pref == "auto:light|dark" { return UITraitCollection.current.userInterfaceStyle == .dark ? "dark" : "light" } else { return pref }
	}
}
