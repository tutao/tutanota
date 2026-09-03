/* generated file, don't edit. */

/**
 * download archives and write them to the database.
 */
export interface ArchiveDownloaderFacade {
	/**
	 * download an archive and store it to the local db
	 */
	downloadAndStoreArchive(sourceUrl: string, archiveId: string, typeref: string, modelVersion: number): Promise<void>

	/**
	 * abort downloading or storing an archive
	 */
	abortDownloadAndStoreArchive(archive: string): Promise<void>

	/**
	 * remove all cached blobs and archives, for example when finished indexing
	 */
	clearStoredArchives(): Promise<void>
}
