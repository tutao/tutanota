/* generated file, don't edit. */


import Foundation

/**
 * download archives and write them to the database.
 */
public protocol ArchiveDownloaderFacade : Sendable {
	/**
	 * download an archive and store it to the local db
	 */
	func downloadAndStoreArchive(
		_ sourceUrl: String,
		_ archiveId: String,
		_ typeref: String,
		_ modelVersion: Int
	) async throws -> Void
	/**
	 * abort downloading or storing an archive
	 */
	func abortDownloadAndStoreArchive(
		_ archive: String
	) async throws -> Void
	/**
	 * remove all cached blobs and archives, for example when finished indexing
	 */
	func clearStoredArchives(
	) async throws -> Void
}
