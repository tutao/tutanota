/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class FileFacadeReceiveDispatcher(
	private val facade: FileFacade
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"open" -> {
				val location: String = Json.decodeFromString(arg[0])
				val mimeType: String = Json.decodeFromString(arg[1])
				val result: Unit = this.facade.open(
					location,
					mimeType,
				)
				return Json.encodeToString(result)
			}
			"openFileChooser" -> {
				val boundingRect: IpcClientRect = Json.decodeFromString(arg[0])
				val result: List<String> = this.facade.openFileChooser(
					boundingRect,
				)
				return Json.encodeToString(result)
			}
			"deleteFile" -> {
				val file: String = Json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteFile(
					file,
				)
				return Json.encodeToString(result)
			}
			"getName" -> {
				val file: String = Json.decodeFromString(arg[0])
				val result: String = this.facade.getName(
					file,
				)
				return Json.encodeToString(result)
			}
			"getMimeType" -> {
				val file: String = Json.decodeFromString(arg[0])
				val result: String = this.facade.getMimeType(
					file,
				)
				return Json.encodeToString(result)
			}
			"getSize" -> {
				val file: String = Json.decodeFromString(arg[0])
				val result: Int = this.facade.getSize(
					file,
				)
				return Json.encodeToString(result)
			}
			"putFileIntoDownloadsFolder" -> {
				val localFileUri: String = Json.decodeFromString(arg[0])
				val result: String = this.facade.putFileIntoDownloadsFolder(
					localFileUri,
				)
				return Json.encodeToString(result)
			}
			"upload" -> {
				val fileUrl: String = Json.decodeFromString(arg[0])
				val targetUrl: String = Json.decodeFromString(arg[1])
				val method: String = Json.decodeFromString(arg[2])
				val headers: Map<String, String> = Json.decodeFromString(arg[3])
				val result: UploadTaskResponse = this.facade.upload(
					fileUrl,
					targetUrl,
					method,
					headers,
				)
				return Json.encodeToString(result)
			}
			"download" -> {
				val sourceUrl: String = Json.decodeFromString(arg[0])
				val filename: String = Json.decodeFromString(arg[1])
				val headers: Map<String, String> = Json.decodeFromString(arg[2])
				val result: DownloadTaskResponse = this.facade.download(
					sourceUrl,
					filename,
					headers,
				)
				return Json.encodeToString(result)
			}
			"hashFile" -> {
				val fileUri: String = Json.decodeFromString(arg[0])
				val result: String = this.facade.hashFile(
					fileUri,
				)
				return Json.encodeToString(result)
			}
			"clearFileData" -> {
				val result: Unit = this.facade.clearFileData(
				)
				return Json.encodeToString(result)
			}
			"joinFiles" -> {
				val filename: String = Json.decodeFromString(arg[0])
				val files: List<String> = Json.decodeFromString(arg[1])
				val result: String = this.facade.joinFiles(
					filename,
					files,
				)
				return Json.encodeToString(result)
			}
			"splitFile" -> {
				val fileUri: String = Json.decodeFromString(arg[0])
				val maxChunkSizeBytes: Int = Json.decodeFromString(arg[1])
				val result: List<String> = this.facade.splitFile(
					fileUri,
					maxChunkSizeBytes,
				)
				return Json.encodeToString(result)
			}
			"saveDataFile" -> {
				val name: String = Json.decodeFromString(arg[0])
				val dataBase64: String = Json.decodeFromString(arg[1])
				val result: String = this.facade.saveDataFile(
					name,
					dataBase64,
				)
				return Json.encodeToString(result)
			}
			"writeFile" -> {
				val file: String = Json.decodeFromString(arg[0])
				val contentB64: String = Json.decodeFromString(arg[1])
				val result: Unit = this.facade.writeFile(
					file,
					contentB64,
				)
				return Json.encodeToString(result)
			}
			"readFile" -> {
				val file: String = Json.decodeFromString(arg[0])
				val result: String = this.facade.readFile(
					file,
				)
				return Json.encodeToString(result)
			}
			else -> throw Error("unknown method for FileFacade: $method")
		}
	}
}
