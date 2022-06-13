/* generated file, don't edit. */


public class IosGlobalDispatcher {
	private let fileFacade: FileFacadeReceiveDispatcher
	private let themeFacade: ThemeFacadeReceiveDispatcher
	
	init(
		fileFacade : FileFacade,
		themeFacade : ThemeFacade
	) {
		self.fileFacade = FileFacadeReceiveDispatcher(facade: fileFacade)
		self.themeFacade = ThemeFacadeReceiveDispatcher(facade: themeFacade)
	}
	
	func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> String {
		switch facadeName {
			case "FileFacade":
				return try await self.fileFacade.dispatch(method: methodName, arg: args)
			case "ThemeFacade":
				return try await self.themeFacade.dispatch(method: methodName, arg: args)
			default:
				fatalError("licc messed up! " + facadeName)
		}
	}
}
