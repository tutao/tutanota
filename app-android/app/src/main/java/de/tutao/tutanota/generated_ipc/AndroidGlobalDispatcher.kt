/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

import de.tutao.tutanota.ipc.*

class AndroidGlobalDispatcher (
	json: Json,
	fileFacade : FileFacade,
	nativeCryptoFacade : NativeCryptoFacade,
	nativePushFacade : NativePushFacade,
	themeFacade : ThemeFacade,
) {
	private val fileFacade: FileFacadeReceiveDispatcher = FileFacadeReceiveDispatcher(json, fileFacade)
	private val nativeCryptoFacade: NativeCryptoFacadeReceiveDispatcher = NativeCryptoFacadeReceiveDispatcher(json, nativeCryptoFacade)
	private val nativePushFacade: NativePushFacadeReceiveDispatcher = NativePushFacadeReceiveDispatcher(json, nativePushFacade)
	private val themeFacade: ThemeFacadeReceiveDispatcher = ThemeFacadeReceiveDispatcher(json, themeFacade)
	
	suspend fun dispatch(facadeName: String, methodName: String, args: List<String>): String {
		return when (facadeName) {
			"FileFacade" -> this.fileFacade.dispatch(methodName, args)
			"NativeCryptoFacade" -> this.nativeCryptoFacade.dispatch(methodName, args)
			"NativePushFacade" -> this.nativePushFacade.dispatch(methodName, args)
			"ThemeFacade" -> this.themeFacade.dispatch(methodName, args)
			else -> throw Error("unknown facade: $facadeName")
		}
	}
}
