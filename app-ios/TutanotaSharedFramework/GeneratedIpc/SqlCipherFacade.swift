/* generated file, don't edit. */


import Foundation

public protocol SqlCipherFacade {
	func openDb(
		_ userId: String,
		_ dbKey: DataWrapper
	) async throws -> Void
	func closeDb(
	) async throws -> Void
	func deleteDb(
		_ userId: String
	) async throws -> Void
	func run(
		_ query: String,
		_ params: [TaggedSqlValue]
	) async throws -> Void
	/**
	 * get a single object or null if the query returns nothing
	 */
	func get(
		_ query: String,
		_ params: [TaggedSqlValue]
	) async throws -> [String : TaggedSqlValue]?
	/**
	 * return a list of objects or an empty list if the query returns nothing
	 */
	func all(
		_ query: String,
		_ params: [TaggedSqlValue]
	) async throws -> [[String : TaggedSqlValue]]
}
