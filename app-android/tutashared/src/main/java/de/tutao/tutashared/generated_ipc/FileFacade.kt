/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * filesystem-related operations. none of the methods writing files to disk guarantee a fixed file name or location, except for putFileIntoDownloadsFolder.
 */
interface FileFacade {
	/**
	 * Opens the file with the built-in viewer or external program.
	 */
	suspend fun open(
		location: String,
		mimeType: String,
	): Unit
	/**
	 * Opens OS file picker. Returns the list of URIs for the selected files. add a list of extensions (without dot) to filter the options.
	 */
	suspend fun openFileChooser(
		boundingRect: IpcClientRect,
		filter: List<String>?,
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
	/**
	 * get the absolute size in bytes of the file at the given location
	 */
	suspend fun getSize(
		file: String,
	): Int
	/**
	 * move and rename a decrypted file from the decryption location to the download location preferred by the user and return the absolute path to the moved file
	 */
	suspend fun putFileIntoDownloadsFolder(
		localFileUri: String,
		fileNameToUse: String,
	): String
	suspend fun upload(
		fileUrl: String,
		targetUrl: String,
		method: String,
		headers: Map<String, String>,
	): UploadTaskResponse
	/**
	 * download an encrypted file to the file system and return the location of the data
	 */
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
	/**
	 * given a list of chunk file locations, will re-join them in order to reconstruct a single file and returns the location of that file on disk.
	 */
	suspend fun joinFiles(
		filename: String,
		files: List<String>,
	): String
	/**
	 * split a given file on disk into as many chunks as necessary to limit their size to the max byte size. returns the list of chunk file locations.
	 */
	suspend fun splitFile(
		fileUri: String,
		maxChunkSizeBytes: Int,
	): List<String>
	/**
	 * Save the unencrypted data file to the disk into a fixed temporary location, not the user's preferred download dir.
	 */
	suspend fun writeDataFile(
		file: DataFile,
	): String
	/**
	 * read the file at the given location into a DataFile. Returns null if reading fails for any reason.
	 */
	suspend fun readDataFile(
		filePath: String,
	): DataFile?
}
