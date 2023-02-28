/* generated file, don't edit. */


import Foundation

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
		_ filter: [String]?
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
	func getSize(
		_ file: String
	) async throws -> Int
	func putFileIntoDownloadsFolder(
		_ localFileUri: String
	) async throws -> String
	func upload(
		_ fileUrl: String,
		_ targetUrl: String,
		_ method: String,
		_ headers: [String : String]
	) async throws -> UploadTaskResponse
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
	func joinFiles(
		_ filename: String,
		_ files: [String]
	) async throws -> String
	func splitFile(
		_ fileUri: String,
		_ maxChunkSizeBytes: Int
	) async throws -> [String]
	func writeDataFile(
		_ file: DataFile
	) async throws -> String
	func readDataFile(
		_ filePath: String
	) async throws -> DataFile?
}
