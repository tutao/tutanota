/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

import de.tutao.tutashared.ipc.*

class AndroidGlobalDispatcher (
	json: Json,
	commonSystemFacade : CommonSystemFacade,
	externalCalendarFacade : ExternalCalendarFacade,
	fileFacade : FileFacade,
	mobileContactsFacade : MobileContactsFacade,
	mobileSystemFacade : MobileSystemFacade,
	nativeCredentialsFacade : NativeCredentialsFacade,
	nativeCryptoFacade : NativeCryptoFacade,
	nativePushFacade : NativePushFacade,
	sqlCipherFacade : SqlCipherFacade,
	themeFacade : ThemeFacade,
	webAuthnFacade : WebAuthnFacade,
) {
	private val commonSystemFacade: CommonSystemFacadeReceiveDispatcher = CommonSystemFacadeReceiveDispatcher(json, commonSystemFacade)
	private val externalCalendarFacade: ExternalCalendarFacadeReceiveDispatcher = ExternalCalendarFacadeReceiveDispatcher(json, externalCalendarFacade)
	private val fileFacade: FileFacadeReceiveDispatcher = FileFacadeReceiveDispatcher(json, fileFacade)
	private val mobileContactsFacade: MobileContactsFacadeReceiveDispatcher = MobileContactsFacadeReceiveDispatcher(json, mobileContactsFacade)
	private val mobileSystemFacade: MobileSystemFacadeReceiveDispatcher = MobileSystemFacadeReceiveDispatcher(json, mobileSystemFacade)
	private val nativeCredentialsFacade: NativeCredentialsFacadeReceiveDispatcher = NativeCredentialsFacadeReceiveDispatcher(json, nativeCredentialsFacade)
	private val nativeCryptoFacade: NativeCryptoFacadeReceiveDispatcher = NativeCryptoFacadeReceiveDispatcher(json, nativeCryptoFacade)
	private val nativePushFacade: NativePushFacadeReceiveDispatcher = NativePushFacadeReceiveDispatcher(json, nativePushFacade)
	private val sqlCipherFacade: SqlCipherFacadeReceiveDispatcher = SqlCipherFacadeReceiveDispatcher(json, sqlCipherFacade)
	private val themeFacade: ThemeFacadeReceiveDispatcher = ThemeFacadeReceiveDispatcher(json, themeFacade)
	private val webAuthnFacade: WebAuthnFacadeReceiveDispatcher = WebAuthnFacadeReceiveDispatcher(json, webAuthnFacade)
	
	suspend fun dispatch(facadeName: String, methodName: String, args: List<String>): String {
		return when (facadeName) {
			"CommonSystemFacade" -> this.commonSystemFacade.dispatch(methodName, args)
			"ExternalCalendarFacade" -> this.externalCalendarFacade.dispatch(methodName, args)
			"FileFacade" -> this.fileFacade.dispatch(methodName, args)
			"MobileContactsFacade" -> this.mobileContactsFacade.dispatch(methodName, args)
			"MobileSystemFacade" -> this.mobileSystemFacade.dispatch(methodName, args)
			"NativeCredentialsFacade" -> this.nativeCredentialsFacade.dispatch(methodName, args)
			"NativeCryptoFacade" -> this.nativeCryptoFacade.dispatch(methodName, args)
			"NativePushFacade" -> this.nativePushFacade.dispatch(methodName, args)
			"SqlCipherFacade" -> this.sqlCipherFacade.dispatch(methodName, args)
			"ThemeFacade" -> this.themeFacade.dispatch(methodName, args)
			"WebAuthnFacade" -> this.webAuthnFacade.dispatch(methodName, args)
			else -> throw Error("unknown facade: $facadeName")
		}
	}
}
