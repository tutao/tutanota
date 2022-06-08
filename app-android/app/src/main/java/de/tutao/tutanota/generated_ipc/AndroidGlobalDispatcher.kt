/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

import de.tutao.tutanota.ipc.*

class AndroidGlobalDispatcher (
) {
	
	suspend fun dispatch(facadeName: String, methodName: String, args: List<String>): String {
		return when (facadeName) {
			else -> throw Error("unknown facade: $facadeName")
		}
	}
}
