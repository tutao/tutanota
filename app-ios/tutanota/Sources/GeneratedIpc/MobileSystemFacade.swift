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
	 * Store contacts in system contact book
	 */
	func saveContacts(
		_ userId: String,
		_ contacts: [StructuredContact]
	) async throws -> Void
	/**
	 * Sync contacts with system contact book
	 */
	func syncContacts(
		_ userId: String,
		_ contacts: [StructuredContact]
	) async throws -> Void
	/**
	 * Delete a contact from system contact book
	 */
	func deleteContact(
		_ userId: String,
		_ contactId: String
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
