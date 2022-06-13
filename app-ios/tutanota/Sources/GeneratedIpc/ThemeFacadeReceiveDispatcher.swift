/* generated file, don't edit. */


import Foundation

public class ThemeFacadeReceiveDispatcher {
	let facade: ThemeFacade
	init(facade: ThemeFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "getThemes":
			let result = try await self.facade.getThemes(
			)
			return toJson(result)
		case "setThemes":
			let themes = try! JSONDecoder().decode([[String : String]].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setThemes(
				themes
			)
			return "null"
		case "getSelectedTheme":
			let result = try await self.facade.getSelectedTheme(
			)
			return toJson(result)
		case "setSelectedTheme":
			let themeId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setSelectedTheme(
				themeId
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
