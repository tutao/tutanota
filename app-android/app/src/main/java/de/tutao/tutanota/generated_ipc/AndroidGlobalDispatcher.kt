/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

import de.tutao.tutanota.ipc.*

class AndroidGlobalDispatcher (
	fileFacade : FileFacade,
	themeFacade : ThemeFacade,
) {
	private val fileFacade : FileFacadeReceiveDispatcher = FileFacadeReceiveDispatcher(fileFacade)
	private val themeFacade : ThemeFacadeReceiveDispatcher = ThemeFacadeReceiveDispatcher(themeFacade)
	
	suspend fun dispatch(facadeName: String, methodName: String, args: List<String>): String {
		return when (facadeName) {
			"FileFacade" -> this.fileFacade.dispatch(methodName, args)
			"ThemeFacade" -> this.themeFacade.dispatch(methodName, args)
			else -> throw Error("unknown facade: $facadeName")
		}
	}
}
