/* generated file, don't edit. */


public class IosGlobalDispatcher {
	private let themeFacade: ThemeFacadeReceiveDispatcher
	
	init(
		themeFacade : ThemeFacade
	) {
		self.themeFacade = ThemeFacadeReceiveDispatcher(facade: themeFacade)
	}
	
	func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> Encodable {
		switch facadeName {
			case "ThemeFacade":
				return try await self.themeFacade.dispatch(method: methodName, arg: args)
			default:
				fatalError("licc messed up! " + facadeName)
		}
	}
}
