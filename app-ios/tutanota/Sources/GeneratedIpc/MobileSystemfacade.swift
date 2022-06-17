/* generated file, don't edit. */


import Foundation

public protocol MobileSystemFacade {
	func findSuggestions(
		_ query: String
	) async throws -> [NativeContact]
	func openLink(
		_ uri: String
	) async throws -> Bool
	func shareText(
		_ text: String,
		_ title: String
	) async throws -> Bool
	func getLog(
	) async throws -> String
}
