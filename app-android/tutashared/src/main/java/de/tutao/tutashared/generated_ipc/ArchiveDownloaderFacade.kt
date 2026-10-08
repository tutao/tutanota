/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Download archives and write them encrypted to offline database.
 */
interface ArchiveDownloaderFacade {
	/**
	 * Download an archive and store it in offline database
	 */
	suspend fun downloadAndStoreArchive(
		sourceUrl: String,
		archiveId: String,
		archiveType: String,
		modelVersion: Long,
		rangeHeaders: ArchiveDownloadRangeHeaders?,
	): Unit
	/**
	 * Abort downloading or storing an archive
	 */
	suspend fun abortDownloadAndStoreArchive(
		archiveId: String,
	): Unit
}
