/* generated file, don't edit. */


public class IosGlobalDispatcher {
	private let commonSystemFacade: CommonSystemFacadeReceiveDispatcher
	private let externalCalendarFacade: ExternalCalendarFacadeReceiveDispatcher
	private let fileFacade: FileFacadeReceiveDispatcher
	private let mobileContactsFacade: MobileContactsFacadeReceiveDispatcher
	private let mobilePaymentsFacade: MobilePaymentsFacadeReceiveDispatcher
	private let mobileSystemFacade: MobileSystemFacadeReceiveDispatcher
	private let nativeCredentialsFacade: NativeCredentialsFacadeReceiveDispatcher
	private let nativeCryptoFacade: NativeCryptoFacadeReceiveDispatcher
	private let nativePushFacade: NativePushFacadeReceiveDispatcher
	private let sqlCipherFacade: SqlCipherFacadeReceiveDispatcher
	private let themeFacade: ThemeFacadeReceiveDispatcher
	private let webAuthnFacade: WebAuthnFacadeReceiveDispatcher
	
	public init(
		commonSystemFacade : CommonSystemFacade,
		externalCalendarFacade : ExternalCalendarFacade,
		fileFacade : FileFacade,
		mobileContactsFacade : MobileContactsFacade,
		mobilePaymentsFacade : MobilePaymentsFacade,
		mobileSystemFacade : MobileSystemFacade,
		nativeCredentialsFacade : NativeCredentialsFacade,
		nativeCryptoFacade : NativeCryptoFacade,
		nativePushFacade : NativePushFacade,
		sqlCipherFacade : SqlCipherFacade,
		themeFacade : ThemeFacade,
		webAuthnFacade : WebAuthnFacade
	) {
		self.commonSystemFacade = CommonSystemFacadeReceiveDispatcher(facade: commonSystemFacade)
		self.externalCalendarFacade = ExternalCalendarFacadeReceiveDispatcher(facade: externalCalendarFacade)
		self.fileFacade = FileFacadeReceiveDispatcher(facade: fileFacade)
		self.mobileContactsFacade = MobileContactsFacadeReceiveDispatcher(facade: mobileContactsFacade)
		self.mobilePaymentsFacade = MobilePaymentsFacadeReceiveDispatcher(facade: mobilePaymentsFacade)
		self.mobileSystemFacade = MobileSystemFacadeReceiveDispatcher(facade: mobileSystemFacade)
		self.nativeCredentialsFacade = NativeCredentialsFacadeReceiveDispatcher(facade: nativeCredentialsFacade)
		self.nativeCryptoFacade = NativeCryptoFacadeReceiveDispatcher(facade: nativeCryptoFacade)
		self.nativePushFacade = NativePushFacadeReceiveDispatcher(facade: nativePushFacade)
		self.sqlCipherFacade = SqlCipherFacadeReceiveDispatcher(facade: sqlCipherFacade)
		self.themeFacade = ThemeFacadeReceiveDispatcher(facade: themeFacade)
		self.webAuthnFacade = WebAuthnFacadeReceiveDispatcher(facade: webAuthnFacade)
	}
	
	public func dispatch(facadeName: String, methodName: String, args: Array<String>) async throws -> String {
		switch facadeName {
			case "CommonSystemFacade":
				return try await self.commonSystemFacade.dispatch(method: methodName, arg: args)
			case "ExternalCalendarFacade":
				return try await self.externalCalendarFacade.dispatch(method: methodName, arg: args)
			case "FileFacade":
				return try await self.fileFacade.dispatch(method: methodName, arg: args)
			case "MobileContactsFacade":
				return try await self.mobileContactsFacade.dispatch(method: methodName, arg: args)
			case "MobilePaymentsFacade":
				return try await self.mobilePaymentsFacade.dispatch(method: methodName, arg: args)
			case "MobileSystemFacade":
				return try await self.mobileSystemFacade.dispatch(method: methodName, arg: args)
			case "NativeCredentialsFacade":
				return try await self.nativeCredentialsFacade.dispatch(method: methodName, arg: args)
			case "NativeCryptoFacade":
				return try await self.nativeCryptoFacade.dispatch(method: methodName, arg: args)
			case "NativePushFacade":
				return try await self.nativePushFacade.dispatch(method: methodName, arg: args)
			case "SqlCipherFacade":
				return try await self.sqlCipherFacade.dispatch(method: methodName, arg: args)
			case "ThemeFacade":
				return try await self.themeFacade.dispatch(method: methodName, arg: args)
			case "WebAuthnFacade":
				return try await self.webAuthnFacade.dispatch(method: methodName, arg: args)
			default:
				fatalError("licc messed up! " + facadeName)
		}
	}
}
