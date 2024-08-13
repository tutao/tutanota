/* generated file, don't edit. */


import Foundation

public class ExternalCalendarFacadeReceiveDispatcher {
	let facade: ExternalCalendarFacade
	init(facade: ExternalCalendarFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "fetchExternalCalendar":
			let url = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.fetchExternalCalendar(
				url
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
