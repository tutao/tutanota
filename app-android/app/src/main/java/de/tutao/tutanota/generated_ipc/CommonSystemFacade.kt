/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface CommonSystemFacade {
	 suspend fun initializeRemoteBridge(
	): Unit
	 suspend fun reload(
		query: Map<String, String>,
	): Unit
	 suspend fun getLog(
	): String
}
