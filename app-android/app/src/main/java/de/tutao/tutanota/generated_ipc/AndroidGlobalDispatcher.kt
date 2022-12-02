/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

import de.tutao.tutanota.ipc.*

class AndroidGlobalDispatcher (
	json: Json,
	commonSystemFacade : CommonSystemFacade,
	fileFacade : FileFacade,
	mobileSystemFacade : MobileSystemFacade,
	nativeCredentialsFacade : NativeCredentialsFacade,
	nativeCryptoFacade : NativeCryptoFacade,
	nativePushFacade : NativePushFacade,
	sqlCipherFacade : SqlCipherFacade,
	themeFacade : ThemeFacade,
	webAuthnFacade : WebAuthnFacade,
) {
	private val commonSystemFacade: CommonSystemFacadeReceiveDispatcher = CommonSystemFacadeReceiveDispatcher(json, commonSystemFacade)
	private val fileFacade: FileFacadeReceiveDispatcher = FileFacadeReceiveDispatcher(json, fileFacade)
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
			"FileFacade" -> this.fileFacade.dispatch(methodName, args)
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
