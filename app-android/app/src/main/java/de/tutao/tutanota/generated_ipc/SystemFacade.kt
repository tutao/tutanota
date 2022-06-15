/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface SystemFacade {
	 suspend fun findSuggestions(
		query: String,
	): List<NativeContact>
	 suspend fun openLink(
		uri: String,
	): Boolean
	 suspend fun shareText(
		text: String,
		title: String,
	): Boolean
	 suspend fun getLog(
	): String
}
