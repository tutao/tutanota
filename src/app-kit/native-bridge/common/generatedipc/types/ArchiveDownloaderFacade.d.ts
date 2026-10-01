/* generated file, don't edit. */

import { ArchiveDownloadRangeHeaders } from "../types/ArchiveDownloadRangeHeaders"
/**
 * Download archives and write them encrypted to offline database.
 */
export interface ArchiveDownloaderFacade {
	/**
	 * Download an archive and store it in offline database
	 */
	downloadAndStoreArchive(
		sourceUrl: string,
		archiveId: string,
		typeRef: string,
		modelVersion: number,
		rangeHeaders: ArchiveDownloadRangeHeaders | null,
	): Promise<void>

	/**
	 * Abort downloading or storing an archive
	 */
	abortDownloadAndStoreArchive(archiveId: string): Promise<void>
}
