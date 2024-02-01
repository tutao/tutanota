/* generated file, don't edit. */


import Foundation

public class SqlCipherFacadeReceiveDispatcher {
	let facade: SqlCipherFacade
	init(facade: SqlCipherFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "openDb":
			let userId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let dbKey = try! JSONDecoder().decode(DataWrapper.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.openDb(
				userId,
				dbKey
			)
			return "null"
		case "closeDb":
			try await self.facade.closeDb(
			)
			return "null"
		case "deleteDb":
			let userId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteDb(
				userId
			)
			return "null"
		case "run":
			let query = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let params = try! JSONDecoder().decode([TaggedSqlValue].self, from: arg[1].data(using: .utf8)!)
			try await self.facade.run(
				query,
				params
			)
			return "null"
		case "get":
			let query = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let params = try! JSONDecoder().decode([TaggedSqlValue].self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.get(
				query,
				params
			)
			return toJson(result)
		case "all":
			let query = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let params = try! JSONDecoder().decode([TaggedSqlValue].self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.all(
				query,
				params
			)
			return toJson(result)
		case "lockRangesDbAccess":
			let listId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.lockRangesDbAccess(
				listId
			)
			return "null"
		case "unlockRangesDbAccess":
			let listId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.unlockRangesDbAccess(
				listId
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
