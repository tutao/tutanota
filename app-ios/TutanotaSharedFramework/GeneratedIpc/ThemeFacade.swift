/* generated file, don't edit. */


import Foundation

public protocol ThemeFacade {
	func getThemes(
	) async throws -> [[String : String]]
	func setThemes(
		_ themes: [[String : String]]
	) async throws
	func getThemePreference(
	) async throws -> String?
	func setThemePreference(
		_ themePreference: String
	) async throws
	func prefersDark(
	) async throws -> Bool
}
