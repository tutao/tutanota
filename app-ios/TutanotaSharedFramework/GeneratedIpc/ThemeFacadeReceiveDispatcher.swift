/* generated file, don't edit. */


import Foundation

public class ThemeFacadeReceiveDispatcher {
	let facade: ThemeFacade
	init(facade: ThemeFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
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
		case "getThemePreference":
			let result = try await self.facade.getThemePreference(
			)
			return toJson(result)
		case "setThemePreference":
			let themePreference = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			try await self.facade.setThemePreference(
				themePreference
			)
			return "null"
		case "prefersDark":
			let result = try await self.facade.prefersDark(
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
