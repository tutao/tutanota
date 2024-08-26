/* generated file, don't edit. */


import Foundation

/**
 * Common operations used by all native platforms.
 */
public protocol CommonNativeFacade {
	/**
	 * Opens mail editor to write a new email. If `mailToUrlString` is specified it takes priority.
	 */
	func createMailEditor(
		_ filesUris: [String],
		_ text: String,
		_ addresses: [String],
		_ subject: String,
		_ mailToUrlString: String
	) async throws -> Void
	/**
	 * Opens the mailbox of an address, optionally to an email specified by requestedPath
	 */
	func openMailBox(
		_ userId: String,
		_ address: String,
		_ requestedPath: String?
	) async throws -> Void
	func openCalendar(
		_ userId: String
	) async throws -> Void
	func showAlertDialog(
		_ translationKey: String
	) async throws -> Void
	/**
	 * All local alarms have been deleted, reschedule alarms for the current user.
	 */
	func invalidateAlarms(
	) async throws -> Void
	/**
	 * Called when the system theme preference has changed
	 */
	func updateTheme(
	) async throws -> Void
	/**
	 * prompt the user to enter a new password and a confirmation, taking an optional old password into account
	 */
	func promptForNewPassword(
		_ title: String,
		_ oldPassword: String?
	) async throws -> String
	/**
	 * prompt the user to enter a password
	 */
	func promptForPassword(
		_ title: String
	) async throws -> String
	/**
	 * Pass a list of files (.vcf) to be handled by the app and if compatible, import them
	 */
	func handleFileImport(
		_ filesUris: [String]
	) async throws -> Void
}
