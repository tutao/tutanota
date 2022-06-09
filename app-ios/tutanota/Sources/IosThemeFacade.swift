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

  func getSelectedTheme() async throws -> String? {
    return self.themeManager.selectedThemeId
  }

  func setSelectedTheme(_ themeId: String) async throws {
    self.themeManager.selectedThemeId = themeId
    await self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
  }


}
