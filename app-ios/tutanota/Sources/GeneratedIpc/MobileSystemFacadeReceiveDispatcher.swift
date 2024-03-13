/* generated file, don't edit. */


import Foundation

public class MobileSystemFacadeReceiveDispatcher {
	let facade: MobileSystemFacade
	init(facade: MobileSystemFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
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
		case "hasPermission":
			let permission = try! JSONDecoder().decode(PermissionType.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.hasPermission(
				permission
			)
			return toJson(result)
		case "requestPermission":
			let permission = try! JSONDecoder().decode(PermissionType.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.requestPermission(
				permission
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
