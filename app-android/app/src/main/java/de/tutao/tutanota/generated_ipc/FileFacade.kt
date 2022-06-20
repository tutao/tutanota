/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface FileFacade {
	/**
	 * Opens the file with the built-in viewer or external program.
	 */
	 suspend fun open(
		location: String,
		mimeType: String,
	): Unit
	/**
	 * Opens OS file picker. Returns the list of URIs for the selected files.
	 */
	 suspend fun openFileChooser(
		boundingRect: IpcClientRect,
	): List<String>
	/**
	 * Opens OS file picker for selecting a folder. Only on desktop.
	 */
	 suspend fun openFolderChooser(
	): String?
	 suspend fun deleteFile(
		file: String,
	): Unit
	 suspend fun getName(
		file: String,
	): String
	 suspend fun getMimeType(
		file: String,
	): String
	 suspend fun getSize(
		file: String,
	): Int
	 suspend fun putFileIntoDownloadsFolder(
		localFileUri: String,
	): String
	 suspend fun upload(
		fileUrl: String,
		targetUrl: String,
		method: String,
		headers: Map<String, String>,
	): UploadTaskResponse
	 suspend fun download(
		sourceUrl: String,
		filename: String,
		headers: Map<String, String>,
	): DownloadTaskResponse
	/**
	 * Calculates specified file hash (with SHA-256). Returns first 6 bytes of it as Base64.
	 */
	 suspend fun hashFile(
		fileUri: String,
	): String
	 suspend fun clearFileData(
	): Unit
	 suspend fun joinFiles(
		filename: String,
		files: List<String>,
	): String
	 suspend fun splitFile(
		fileUri: String,
		maxChunkSizeBytes: Int,
	): List<String>
	 suspend fun writeDataFile(
		file: DataFile,
	): String
	 suspend fun readDataFile(
		filePath: String,
	): DataFile?
}
