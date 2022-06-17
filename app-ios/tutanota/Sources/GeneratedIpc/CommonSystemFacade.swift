/* generated file, don't edit. */


import Foundation

public protocol CommonSystemFacade {
	func initializeRemoteBridge(
	) async throws -> Void
	func reload(
		_ query: [String : String]
	) async throws -> Void
	func getLog(
	) async throws -> String
}
