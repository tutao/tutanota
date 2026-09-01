/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class ArchiveDownloaderFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: ArchiveDownloaderFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"downloadAndStoreArchive" -> {
				val sourceUrl: String = json.decodeFromString(arg[0])
				val typeref: String = json.decodeFromString(arg[1])
				val modelVersion: Long = json.decodeFromString(arg[2])
				val result: Unit = this.facade.downloadAndStoreArchive(
					sourceUrl,
					typeref,
					modelVersion,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for ArchiveDownloaderFacade: $method")
		}
	}
}
