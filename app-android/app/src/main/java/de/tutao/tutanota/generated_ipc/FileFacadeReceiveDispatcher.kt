/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class FileFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: FileFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"open" -> {
				val location: String = json.decodeFromString(arg[0])
				val mimeType: String = json.decodeFromString(arg[1])
				val result: Unit = this.facade.open(
					location,
					mimeType,
				)
				return json.encodeToString(result)
			}
			"openFileChooser" -> {
				val boundingRect: IpcClientRect = json.decodeFromString(arg[0])
				val result: List<String> = this.facade.openFileChooser(
					boundingRect,
				)
				return json.encodeToString(result)
			}
			"openFolderChooser" -> {
				val result: String? = this.facade.openFolderChooser(
				)
				return json.encodeToString(result)
			}
			"deleteFile" -> {
				val file: String = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteFile(
					file,
				)
				return json.encodeToString(result)
			}
			"getName" -> {
				val file: String = json.decodeFromString(arg[0])
				val result: String = this.facade.getName(
					file,
				)
				return json.encodeToString(result)
			}
			"getMimeType" -> {
				val file: String = json.decodeFromString(arg[0])
				val result: String = this.facade.getMimeType(
					file,
				)
				return json.encodeToString(result)
			}
			"getSize" -> {
				val file: String = json.decodeFromString(arg[0])
				val result: Int = this.facade.getSize(
					file,
				)
				return json.encodeToString(result)
			}
			"putFileIntoDownloadsFolder" -> {
				val localFileUri: String = json.decodeFromString(arg[0])
				val result: String = this.facade.putFileIntoDownloadsFolder(
					localFileUri,
				)
				return json.encodeToString(result)
			}
			"upload" -> {
				val fileUrl: String = json.decodeFromString(arg[0])
				val targetUrl: String = json.decodeFromString(arg[1])
				val method: String = json.decodeFromString(arg[2])
				val headers: Map<String, String> = json.decodeFromString(arg[3])
				val result: UploadTaskResponse = this.facade.upload(
					fileUrl,
					targetUrl,
					method,
					headers,
				)
				return json.encodeToString(result)
			}
			"download" -> {
				val sourceUrl: String = json.decodeFromString(arg[0])
				val filename: String = json.decodeFromString(arg[1])
				val headers: Map<String, String> = json.decodeFromString(arg[2])
				val result: DownloadTaskResponse = this.facade.download(
					sourceUrl,
					filename,
					headers,
				)
				return json.encodeToString(result)
			}
			"hashFile" -> {
				val fileUri: String = json.decodeFromString(arg[0])
				val result: String = this.facade.hashFile(
					fileUri,
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
				val files: List<String> = json.decodeFromString(arg[1])
				val result: String = this.facade.joinFiles(
					filename,
					files,
				)
				return json.encodeToString(result)
			}
			"splitFile" -> {
				val fileUri: String = json.decodeFromString(arg[0])
				val maxChunkSizeBytes: Int = json.decodeFromString(arg[1])
				val result: List<String> = this.facade.splitFile(
					fileUri,
					maxChunkSizeBytes,
				)
				return json.encodeToString(result)
			}
			"saveDataFile" -> {
				val name: String = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val result: String = this.facade.saveDataFile(
					name,
					data,
				)
				return json.encodeToString(result)
			}
			"writeFile" -> {
				val file: String = json.decodeFromString(arg[0])
				val data: DataWrapper = json.decodeFromString(arg[1])
				val result: Unit = this.facade.writeFile(
					file,
					data,
				)
				return json.encodeToString(result)
			}
			"readFile" -> {
				val file: String = json.decodeFromString(arg[0])
				val result: String = this.facade.readFile(
					file,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for FileFacade: $method")
		}
	}
}
