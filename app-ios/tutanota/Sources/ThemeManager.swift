import Foundation

typealias ThemeId = String
typealias ThemePreference = String
typealias Theme = Dictionary<String, String>

fileprivate let SELECTED_THEME = "theme"
fileprivate let THEMES = "themes"
fileprivate let LIGHT_FALLBACK_THEME = [
  "themeId": "light-fallback",
  "content_bg": "#ffffff",
  "header_bg": "#ffffff",
  "navigation_bg": "f6f6f6"
]

class ThemeManager : NSObject {
  public var themePreference: ThemePreference? {
    get {
      return UserDefaults.standard.object(forKey: SELECTED_THEME) as! ThemePreference?
    }
    set(newVal) {
      UserDefaults.standard.setValue(newVal, forKey: SELECTED_THEME)
    }
  }

  public var themes: Array<Theme> {
    get {
      UserDefaults.standard.object(forKey: THEMES) as! Array<Theme>? ?? []
    }
    set(newVal) {
      return UserDefaults.standard.setValue(newVal, forKey: THEMES)
    }
  }

  public var currentTheme: Theme? {
    get {
      let themeId = resolveThemePreference()
      return themes.first { theme in theme["themeId"] == themeId }
    }
  }

  public var currentThemeWithFallback: Theme {
    get {
      currentTheme ?? LIGHT_FALLBACK_THEME
    }
  }

  private func resolveThemePreference() -> ThemeId? {
    let pref = self.themePreference
    if pref == "auto:light|dark" {
      return UITraitCollection.current.userInterfaceStyle == .dark ? "dark" : "light"
    } else {
      return pref
    }
  }
}
