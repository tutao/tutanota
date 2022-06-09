/* generated file, don't edit. */


import Foundation

public class ThemeFacadeReceiveDispatcher {
	let facade: ThemeFacade
	init(facade: ThemeFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> Encodable {
		switch method {
		case "getThemes":
			return try await self.facade.getThemes(
			)
		case "setThemes":
			let themes = try! JSONDecoder().decode([[String : String]].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setThemes(
				themes
			)
			return NullReturn()
		case "getSelectedTheme":
			return try await self.facade.getSelectedTheme(
			)
		case "setSelectedTheme":
			let themeId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setSelectedTheme(
				themeId
			)
			return NullReturn()
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
