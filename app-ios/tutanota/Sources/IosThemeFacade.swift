import Foundation
import TutanotaSharedFramework

final class IosThemeFacade: ThemeFacade {

	let themeManager: ThemeManager
	let viewController: ViewController

	init(themeManager: ThemeManager, viewController: ViewController) {
		self.themeManager = themeManager
		self.viewController = viewController
	}

	func getThemes() async throws -> [[String: String]] { self.themeManager.themes }

	@MainActor func setThemes(_ themes: [[String: String]]) async throws {
		self.themeManager.themes = themes
		self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
	}

	func getThemePreference() async throws -> ThemePreference? { self.themeManager.themePreference }

	@MainActor func setThemePreference(_ themePrefernece: ThemePreference) async throws {
		self.themeManager.themePreference = themePrefernece
		self.viewController.applyTheme(self.themeManager.currentThemeWithFallback)
	}

	func prefersDark() async throws -> Bool { UITraitCollection.current.userInterfaceStyle == .dark }
}
