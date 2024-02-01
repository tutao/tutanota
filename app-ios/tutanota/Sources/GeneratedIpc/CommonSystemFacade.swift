/* generated file, don't edit. */


import Foundation

/**
 * Common operations implemented by each platform.
 */
public protocol CommonSystemFacade {
	/**
	 * Must be called before any other methods are called.
	 */
	func initializeRemoteBridge(
	) async throws -> Void
	/**
	 * Reload the webpage with the specified query arguments.
	 */
	func reload(
		_ query: [String : String]
	) async throws -> Void
	/**
	 * Returns the log contents of the native process.
	 */
	func getLog(
	) async throws -> String
}
