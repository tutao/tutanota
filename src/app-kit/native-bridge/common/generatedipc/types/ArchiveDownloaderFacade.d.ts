/* generated file, don't edit. */

/**
 * download archives and write them to the database.
 */
export interface ArchiveDownloaderFacade {
	/**
	 * download an archive and store it to the local db
	 */
	downloadAndStoreArchive(sourceUrl: string, typeref: string, modelVersion: number): Promise<void>
}
