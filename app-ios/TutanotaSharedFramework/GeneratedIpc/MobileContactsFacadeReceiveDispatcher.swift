/* generated file, don't edit. */


import Foundation

public class MobileContactsFacadeReceiveDispatcher {
	let facade: MobileContactsFacade
	init(facade: MobileContactsFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "findSuggestions":
			let query = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.findSuggestions(
				query
			)
			return toJson(result)
		case "saveContacts":
			let username = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let contacts = try! JSONDecoder().decode([StructuredContact].self, from: arg[1].data(using: .utf8)!)
			try await self.facade.saveContacts(
				username,
				contacts
			)
			return "null"
		case "syncContacts":
			let username = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let contacts = try! JSONDecoder().decode([StructuredContact].self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.syncContacts(
				username,
				contacts
			)
			return toJson(result)
		case "getContactBooks":
			let result = try await self.facade.getContactBooks(
			)
			return toJson(result)
		case "getContactsInContactBook":
			let bookId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let username = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.getContactsInContactBook(
				bookId,
				username
			)
			return toJson(result)
		case "deleteContacts":
			let username = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let contactId = try! JSONDecoder().decode(String?.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.deleteContacts(
				username,
				contactId
			)
			return "null"
		case "isLocalStorageAvailable":
			let result = try await self.facade.isLocalStorageAvailable(
			)
			return toJson(result)
		case "findLocalMatches":
			let contacts = try! JSONDecoder().decode([StructuredContact].self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.findLocalMatches(
				contacts
			)
			return toJson(result)
		case "deleteLocalContacts":
			let contacts = try! JSONDecoder().decode([String].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.deleteLocalContacts(
				contacts
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
