/* generated file, don't edit. */


import Foundation

public protocol ThemeFacade {
	func getThemes(
	) async throws -> [[String : String]]
	func setThemes(
		_ themes: [[String : String]]
	) async throws -> Void
	func getSelectedTheme(
	) async throws -> String?
	func setSelectedTheme(
		_ themeId: String
	) async throws -> Void
}
