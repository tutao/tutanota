import Foundation

typealias ThemeId = String
typealias ThemePreference = String
typealias Theme = [String: String]

private let SELECTED_THEME = "theme"
private let THEMES = "themes"
private let LIGHT_FALLBACK_THEME = ["themeId": "light-fallback", "content_bg": "#ffffff", "header_bg": "#ffffff", "navigation_bg": "f6f6f6"]

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

	public var currentThemeWithFallback: Theme { get { currentTheme ?? LIGHT_FALLBACK_THEME } }

	private func resolveThemePreference() -> ThemeId? {
		let pref = self.themePreference
		if pref == "auto:light|dark" { return UITraitCollection.current.userInterfaceStyle == .dark ? "dark" : "light" } else { return pref }
	}
}
