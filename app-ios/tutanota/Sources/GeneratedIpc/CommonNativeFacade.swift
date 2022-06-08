/* generated file, don't edit. */


import Foundation

public protocol CommonNativeFacade {
	func createMailEditor(
		_ filesUris: [String],
		_ text: String,
		_ addresses: [String],
		_ subject: String,
		_ mailToUrlString: String
	) async throws -> Void
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
	func invalidateAlarms(
	) async throws -> Void
}
