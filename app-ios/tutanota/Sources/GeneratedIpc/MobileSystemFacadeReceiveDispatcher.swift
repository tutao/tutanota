/* generated file, don't edit. */


import Foundation

public class MobileSystemFacadeReceiveDispatcher {
	let facade: MobileSystemFacade
	init(facade: MobileSystemFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
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
			try await self.facade.syncContacts(
				username,
				contacts
			)
			return "null"
		case "deleteContacts":
			let username = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let contactId = try! JSONDecoder().decode(String?.self, from: arg[1].data(using: .utf8)!)
			try await self.facade.deleteContacts(
				username,
				contactId
			)
			return "null"
		case "goToSettings":
			try await self.facade.goToSettings(
			)
			return "null"
		case "openLink":
			let uri = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.openLink(
				uri
			)
			return toJson(result)
		case "shareText":
			let text = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let title = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.shareText(
				text,
				title
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
