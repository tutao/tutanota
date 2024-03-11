/* generated file, don't edit. */


import Foundation

public class CommonSystemFacadeReceiveDispatcher {
	let facade: CommonSystemFacade
	init(facade: CommonSystemFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "initializeRemoteBridge":
			try await self.facade.initializeRemoteBridge(
			)
			return "null"
		case "reload":
			let query = try! JSONDecoder().decode([String : String].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.reload(
				query
			)
			return "null"
		case "getLog":
			let result = try await self.facade.getLog(
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
