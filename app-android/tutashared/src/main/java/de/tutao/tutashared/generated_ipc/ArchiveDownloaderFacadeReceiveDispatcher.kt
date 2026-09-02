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
				val archiveId: String = json.decodeFromString(arg[1])
				val typeref: String = json.decodeFromString(arg[2])
				val modelVersion: Long = json.decodeFromString(arg[3])
				val result: Unit = this.facade.downloadAndStoreArchive(
					sourceUrl,
					archiveId,
					typeref,
					modelVersion,
				)
				return json.encodeToString(result)
			}
			"abortDownloadAndStoreArchive" -> {
				val archive: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.abortDownloadAndStoreArchive(
					archive,
				)
				return json.encodeToString(result)
			}
			"clearStoredArchives" -> {
				val result: Unit = this.facade.clearStoredArchives(
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for ArchiveDownloaderFacade: $method")
		}
	}
}
