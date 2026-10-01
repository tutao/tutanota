/* generated file, don't edit. */


import Foundation

/**
 * Download archives and write them encrypted to offline database.
 */
public protocol ArchiveDownloaderFacade : Sendable {
	/**
	 * Download an archive and store it in offline database
	 */
	func downloadAndStoreArchive(
		_ sourceUrl: String,
		_ archiveId: String,
		_ typeRef: String,
		_ modelVersion: Int,
		_ rangeHeaders: ArchiveDownloadRangeHeaders?
	) async throws -> Void
	/**
	 * Abort downloading or storing an archive
	 */
	func abortDownloadAndStoreArchive(
		_ archiveId: String
	) async throws -> Void
}
