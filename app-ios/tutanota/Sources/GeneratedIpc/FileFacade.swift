/* generated file, don't edit. */


import Foundation

public protocol FileFacade {
	func open(
		_ location: String,
		_ mimeType: String
	) async throws -> Void
	func openFileChooser(
		_ boundingRect: IpcClientRect
	) async throws -> [String]
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
	func saveDataFile(
		_ name: String,
		_ data: DataWrapper
	) async throws -> String
	func writeFile(
		_ file: String,
		_ data: DataWrapper
	) async throws -> Void
	func readFile(
		_ file: String
	) async throws -> String
}
