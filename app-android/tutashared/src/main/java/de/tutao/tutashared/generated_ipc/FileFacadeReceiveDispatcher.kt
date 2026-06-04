/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class FileFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: FileFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"open" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val mimeType: String = json.decodeFromString(arg[1])
				val result: Unit = this.facade.open(
					fileUrl,
					mimeType,
				)
				return json.encodeToString(result)
			}
			"openFileChooser" -> {
				val boundingRect: IpcClientRect = json.decodeFromString(arg[0])
				val filter: List<String>? = json.decodeFromString(arg[1])
				val isFileOnly: Boolean? = json.decodeFromString(arg[2])
				val result: List<String> = this.facade.openFileChooser(
					boundingRect,
					filter,
					isFileOnly,
				)
				return json.encodeToString(result)
			}
			"openFolderChooser" -> {
				val result: String? = this.facade.openFolderChooser(
				)
				return json.encodeToString(result)
			}
			"openMacImportFileChooser" -> {
				val result: List<String> = this.facade.openMacImportFileChooser(
				)
				return json.encodeToString(result)
			}
			"deleteFile" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteFile(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"getName" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: String = this.facade.getName(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"getMimeType" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: String = this.facade.getMimeType(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"getSize" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: Long = this.facade.getSize(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"putFileIntoDownloadsFolder" -> {
				val localFileUri: String = json.decodeFromString(arg[0])
				val fileNameToUse: String = json.decodeFromString(arg[1])
				val result: String = this.facade.putFileIntoDownloadsFolder(
					localFileUri,
					fileNameToUse,
				)
				return json.encodeToString(result)
			}
			"upload" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val targetUrl: String = json.decodeFromString(arg[1])
				val method: String = json.decodeFromString(arg[2])
				val headers: Map<String, String> = json.decodeFromString(arg[3])
				val fileId: String = json.decodeFromString(arg[4])
				val result: UploadTaskResponse = this.facade.upload(
					fileUrl,
					targetUrl,
					method,
					headers,
					fileId,
				)
				return json.encodeToString(result)
			}
			"abortUpload" -> {
				val fileId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.abortUpload(
					fileId,
				)
				return json.encodeToString(result)
			}
			"download" -> {
				val sourceUrl: String = json.decodeFromString(arg[0])
				val filename: String = json.decodeFromString(arg[1])
				val headers: Map<String, String> = json.decodeFromString(arg[2])
				val fileId: String = json.decodeFromString(arg[3])
				val result: DownloadTaskResponse = this.facade.download(
					sourceUrl,
					filename,
					headers,
					fileId,
				)
				return json.encodeToString(result)
			}
			"abortDownload" -> {
				val fileId: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.abortDownload(
					fileId,
				)
				return json.encodeToString(result)
			}
			"hashFile" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: String = this.facade.hashFile(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"clearFileData" -> {
				val result: Unit = this.facade.clearFileData(
				)
				return json.encodeToString(result)
			}
			"joinFiles" -> {
				val filename: String = json.decodeFromString(arg[0])
				val filePartsUrls: List<String> = json.decodeFromString(arg[1])
				val result: String = this.facade.joinFiles(
					filename,
					filePartsUrls,
				)
				return json.encodeToString(result)
			}
			"openFileForReading" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: String = this.facade.openFileForReading(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"closeFile" -> {
				val streamUrl: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.closeFile(
					streamUrl,
				)
				return json.encodeToString(result)
			}
			"readChunk" -> {
				val streamUrl: String = json.decodeFromString(arg[0])
				val maxChunkSize: Long = json.decodeFromString(arg[1])
				val result: String? = this.facade.readChunk(
					streamUrl,
					maxChunkSize,
				)
				return json.encodeToString(result)
			}
			"writeTempDataFile" -> {
				val file: DataFile = json.decodeFromString(arg[0])
				val result: String = this.facade.writeTempDataFile(
					file,
				)
				return json.encodeToString(result)
			}
			"writeToAppDir" -> {
				val content: DataWrapper = json.decodeFromString(arg[0])
				val name: String = json.decodeFromString(arg[1])
				val result: Unit = this.facade.writeToAppDir(
					content,
					name,
				)
				return json.encodeToString(result)
			}
			"readFromAppDir" -> {
				val name: String = json.decodeFromString(arg[0])
				val result: DataWrapper = this.facade.readFromAppDir(
					name,
				)
				return json.encodeToString(result)
			}
			"deleteFromAppDir" -> {
				val name: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteFromAppDir(
					name,
				)
				return json.encodeToString(result)
			}
			"readDataFile" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val result: DataFile? = this.facade.readDataFile(
					fileUrl,
				)
				return json.encodeToString(result)
			}
			"readDirectory" -> {
				val directoryUrl: String = json.decodeFromString(arg[0])
				val result: DirectoryContents = this.facade.readDirectory(
					directoryUrl,
				)
				return json.encodeToString(result)
			}
			"readDirectory" -> {
				val filePath: String = json.decodeFromString(arg[0])
				val result: DirectoryContents = this.facade.readDirectory(
					filePath,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for FileFacade: $method")
		}
	}
}
