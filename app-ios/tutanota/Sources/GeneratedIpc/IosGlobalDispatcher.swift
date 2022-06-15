/* generated file, don't edit. */


public class IosGlobalDispatcher {
	private let fileFacade: FileFacadeReceiveDispatcher
	private let nativeCredentialsFacade: NativeCredentialsFacadeReceiveDispatcher
	private let nativeCryptoFacade: NativeCryptoFacadeReceiveDispatcher
	private let nativePushFacade: NativePushFacadeReceiveDispatcher
	private let systemFacade: SystemFacadeReceiveDispatcher
	private let themeFacade: ThemeFacadeReceiveDispatcher
	
	init(
		fileFacade : FileFacade,
		nativeCredentialsFacade : NativeCredentialsFacade,
		nativeCryptoFacade : NativeCryptoFacade,
		nativePushFacade : NativePushFacade,
		systemFacade : SystemFacade,
		themeFacade : ThemeFacade
	) {
		self.fileFacade = FileFacadeReceiveDispatcher(facade: fileFacade)
		self.nativeCredentialsFacade = NativeCredentialsFacadeReceiveDispatcher(facade: nativeCredentialsFacade)
		self.nativeCryptoFacade = NativeCryptoFacadeReceiveDispatcher(facade: nativeCryptoFacade)
		self.nativePushFacade = NativePushFacadeReceiveDispatcher(facade: nativePushFacade)
		self.systemFacade = SystemFacadeReceiveDispatcher(facade: systemFacade)
		self.themeFacade = ThemeFacadeReceiveDispatcher(facade: themeFacade)
	}
	
	func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> String {
		switch facadeName {
			case "FileFacade":
				return try await self.fileFacade.dispatch(method: methodName, arg: args)
			case "NativeCredentialsFacade":
				return try await self.nativeCredentialsFacade.dispatch(method: methodName, arg: args)
			case "NativeCryptoFacade":
				return try await self.nativeCryptoFacade.dispatch(method: methodName, arg: args)
			case "NativePushFacade":
				return try await self.nativePushFacade.dispatch(method: methodName, arg: args)
			case "SystemFacade":
				return try await self.systemFacade.dispatch(method: methodName, arg: args)
			case "ThemeFacade":
				return try await self.themeFacade.dispatch(method: methodName, arg: args)
			default:
				fatalError("licc messed up! " + facadeName)
		}
	}
}
