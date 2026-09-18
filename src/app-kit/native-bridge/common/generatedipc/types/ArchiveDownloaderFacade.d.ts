/* generated file, don't edit. */

/**
 * Download entire archives and write them to offline database.
 */
export interface ArchiveDownloaderFacade {
	/**
	 * Download an archive and store it (without decryption) in offline DB
	 */
	downloadAndStoreArchive(sourceUrl: string, archiveId: string, typeref: string, modelVersion: number): Promise<void>

	/**
	 * Abort downloading or storing an archive
	 */
	abortDownloadAndStoreArchive(archiveId: string): Promise<void>
}
