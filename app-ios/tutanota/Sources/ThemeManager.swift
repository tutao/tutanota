import Foundation

typealias ThemeId = String
typealias Theme = Dictionary<String, String>

fileprivate let SELECTED_THEME = "theme"
fileprivate let THEMES = "themes"

class ThemeManager : NSObject {
  public var selectedThemeId: ThemeId {
    get {
      return UserDefaults.standard.object(forKey: SELECTED_THEME) as! ThemeId? ?? "light"
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
      return themes.first { theme in theme["themeId"] == selectedThemeId }
    }
  }
  
  public var currentThemeWithFallback: Theme {
    get {
      currentTheme ?? [
        "themeId": "light-fallback",
        "content_bg": "#ffffff",
        "header_bg": "#ffffff"
      ]
    }
  }
}
