/* generated file, don't edit. */


public class IosGlobalDispatcher {
	private let fileFacade: FileFacadeReceiveDispatcher
	private let nativePushFacade: NativePushFacadeReceiveDispatcher
	private let themeFacade: ThemeFacadeReceiveDispatcher
	
	init(
		fileFacade : FileFacade,
		nativePushFacade : NativePushFacade,
		themeFacade : ThemeFacade
	) {
		self.fileFacade = FileFacadeReceiveDispatcher(facade: fileFacade)
		self.nativePushFacade = NativePushFacadeReceiveDispatcher(facade: nativePushFacade)
		self.themeFacade = ThemeFacadeReceiveDispatcher(facade: themeFacade)
	}
	
	func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> String {
		switch facadeName {
			case "FileFacade":
				return try await self.fileFacade.dispatch(method: methodName, arg: args)
			case "NativePushFacade":
				return try await self.nativePushFacade.dispatch(method: methodName, arg: args)
			case "ThemeFacade":
				return try await self.themeFacade.dispatch(method: methodName, arg: args)
			default:
				fatalError("licc messed up! " + facadeName)
		}
	}
}
