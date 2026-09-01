/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * download archives and write them to the database.
 */
interface ArchiveDownloaderFacade {
	/**
	 * download an archive and store it to the local db
	 */
	suspend fun downloadAndStoreArchive(
		sourceUrl: String,
		typeref: String,
		modelVersion: Long,
	): Unit
}
