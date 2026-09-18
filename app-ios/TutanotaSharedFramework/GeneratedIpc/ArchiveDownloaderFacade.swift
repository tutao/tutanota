/* generated file, don't edit. */


import Foundation

/**
 * Download entire archives and write them to offline database.
 */
public protocol ArchiveDownloaderFacade : Sendable {
	/**
	 * Download an archive and store it (without decryption) in offline DB
	 */
	func downloadAndStoreArchive(
		_ sourceUrl: String,
		_ archiveId: String,
		_ typeref: String,
		_ modelVersion: Int
	) async throws -> Void
	/**
	 * Abort downloading or storing an archive
	 */
	func abortDownloadAndStoreArchive(
		_ archiveId: String
	) async throws -> Void
}
