/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface NativeInterface {
	suspend fun sendRequest(requestType: String, args: List<String>): String
}
