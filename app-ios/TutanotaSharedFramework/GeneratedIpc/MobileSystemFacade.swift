/* generated file, don't edit. */


import Foundation

/**
 * Common operations implemented by each mobile platform.
 */
public protocol MobileSystemFacade {
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
	/**
	 * Returns whether the specified system permission has already been granted by the user.
	 */
	func hasPermission(
		_ permission: PermissionType
	) async throws -> Bool
	/**
	 * Requests a system permission from the user.
	 */
	func requestPermission(
		_ permission: PermissionType
	) async throws -> Void
	func getAppLockMethod(
	) async throws -> AppLockMethod
	func setAppLockMethod(
		_ method: AppLockMethod
	) async throws -> Void
	func enforceAppLock(
		_ method: AppLockMethod
	) async throws -> Void
	func getSupportedAppLockMethods(
	) async throws -> [AppLockMethod]
	func openMailApp(
		_ query: String
	) async throws -> Void
}
