import Foundation

public protocol ThemeApplier: Sendable { @MainActor func applyTheme(_ theme: Theme) }

public final class IosThemeFacade: ThemeFacade {
	private let themeManager: ThemeManager
	private let themeApplier: any ThemeApplier

	public init(themeManager: ThemeManager, themeApplier: any ThemeApplier) {
		self.themeManager = themeManager
		self.themeApplier = themeApplier
	}

	public func getThemes() async throws -> [[String: String]] { self.themeManager.themes }

	@MainActor public func setThemes(_ themes: [[String: String]]) async throws {
		self.themeManager.themes = themes
		self.themeApplier.applyTheme(self.themeManager.currentThemeWithFallback)
	}

	public func getThemePreference() async throws -> ThemePreference? { self.themeManager.themePreference }

	@MainActor public func setThemePreference(_ themePrefernece: ThemePreference) async throws {
		self.themeManager.themePreference = themePrefernece
		self.themeApplier.applyTheme(self.themeManager.currentThemeWithFallback)
	}

	public func prefersDark() async throws -> Bool { UITraitCollection.current.userInterfaceStyle == .dark }
}
