/* generated file, don't edit. */


import Foundation

/**
 * Common operations implemented by each mobile platform.
 */
public protocol MobileSystemFacade {
	/**
	 * Find suggestions in the OS contact provider.
	 */
	func findSuggestions(
		_ query: String
	) async throws -> [NativeContact]
	/**
	 * Store one or more contacts in system's contact book
	 */
	func saveContacts(
		_ username: String,
		_ contacts: [StructuredContact]
	) async throws -> Void
	/**
	 * Sync all Tuta contacts with system's contact book, this operation includes Inserts, Updates and Deletions
	 */
	func syncContacts(
		_ username: String,
		_ contacts: [StructuredContact]
	) async throws -> [StructuredContact]
	/**
	 * Delete all or a specific Tuta contact from system's contact book
	 */
	func deleteContacts(
		_ username: String,
		_ contactId: String?
	) async throws -> Void
	/**
	 * Redirect the user to Phone's Settings
	 */
	func goToSettings(
	) async throws -> Void
	/**
	 * Open URI in the OS.
	 */
	func openLink(
		_ uri: String
	) async throws -> Bool
	/**
	 * Share the text via OS sharing mechanism.
	 */
	func shareText(
		_ text: String,
		_ title: String
	) async throws -> Bool
}
