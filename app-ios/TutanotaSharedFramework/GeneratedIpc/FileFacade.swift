/* generated file, don't edit. */


import Foundation

/**
 * filesystem-related operations. none of the methods writing files to disk guarantee a fixed file name or location, except for putFileIntoDownloadsFolder.
 */
public protocol FileFacade {
	/**
	 * Opens the file with the built-in viewer or external program.
	 */
	func open(
		_ location: String,
		_ mimeType: String
	) async throws -> Void
	/**
	 * Opens OS file picker. Returns the list of URIs for the selected files. add a list of extensions (without dot) to filter the options.
	 */
	func openFileChooser(
		_ boundingRect: IpcClientRect,
		_ filter: [String]?,
		_ isFileOnly: Bool?
	) async throws -> [String]
	/**
	 * Opens OS file picker for selecting a folder. Only on desktop.
	 */
	func openFolderChooser(
	) async throws -> String?
	func deleteFile(
		_ file: String
	) async throws -> Void
	func getName(
		_ file: String
	) async throws -> String
	func getMimeType(
		_ file: String
	) async throws -> String
	/**
	 * get the absolute size in bytes of the file at the given location
	 */
	func getSize(
		_ file: String
	) async throws -> Int
	/**
	 * move and rename a decrypted file from the decryption location to the download location preferred by the user and return the absolute path to the moved file
	 */
	func putFileIntoDownloadsFolder(
		_ localFileUri: String,
		_ fileNameToUse: String
	) async throws -> String
	func upload(
		_ fileUrl: String,
		_ targetUrl: String,
		_ method: String,
		_ headers: [String : String]
	) async throws -> UploadTaskResponse
	/**
	 * download an encrypted file to the file system and return the location of the data
	 */
	func download(
		_ sourceUrl: String,
		_ filename: String,
		_ headers: [String : String]
	) async throws -> DownloadTaskResponse
	/**
	 * Calculates specified file hash (with SHA-256). Returns first 6 bytes of it as Base64.
	 */
	func hashFile(
		_ fileUri: String
	) async throws -> String
	func clearFileData(
	) async throws -> Void
	/**
	 * given a list of chunk file locations, will re-join them in order to reconstruct a single file and returns the location of that file on disk.
	 */
	func joinFiles(
		_ filename: String,
		_ files: [String]
	) async throws -> String
	/**
	 * split a given file on disk into as many chunks as necessary to limit their size to the max byte size. returns the list of chunk file locations.
	 */
	func splitFile(
		_ fileUri: String,
		_ maxChunkSizeBytes: Int
	) async throws -> [String]
	/**
	 * Save the unencrypted data file to the disk into a fixed temporary location, not the user's preferred download dir.
	 */
	func writeDataFile(
		_ file: DataFile
	) async throws -> String
	/**
	 * read the file at the given location into a DataFile. Returns null if reading fails for any reason.
	 */
	func readDataFile(
		_ filePath: String
	) async throws -> DataFile?
}
