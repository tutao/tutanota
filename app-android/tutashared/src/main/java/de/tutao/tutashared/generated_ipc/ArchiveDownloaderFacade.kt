/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Download entire archives and write them to offline database.
 */
interface ArchiveDownloaderFacade {
	/**
	 * Download an archive and store it (without decryption) in offline DB
	 */
	suspend fun downloadAndStoreArchive(
		sourceUrl: String,
		archiveId: String,
		typeref: String,
		modelVersion: Long,
	): Unit
	/**
	 * Abort downloading or storing an archive
	 */
	suspend fun abortDownloadAndStoreArchive(
		archiveId: String,
	): Unit
}
