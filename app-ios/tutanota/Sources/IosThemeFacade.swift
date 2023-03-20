import Foundation

class IosThemeFacade : ThemeFacade {

  let themeManager: ThemeManager
  let viewController: ViewController

  init(
    themeManager: ThemeManager,
    viewController: ViewController
  ) {
    self.themeManager = themeManager
    self.viewController = viewController
  }

  func getThemes() async throws -> [[String : String]]{
    return self.themeManager.themes
  }

  func setThemes(_ themes: [[String : String]]) async throws {
    self.themeManager.themes = themes
    await self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
  }

  func getSelectedTheme() async throws -> ThemePreference? {
    return self.themeManager.themePreference
  }

  func setSelectedTheme(_ themePrefernece: ThemePreference) async throws {
    self.themeManager.themePreference = themePrefernece
    await self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
  }
}
