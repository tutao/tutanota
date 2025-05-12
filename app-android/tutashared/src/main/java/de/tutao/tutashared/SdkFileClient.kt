package de.tutao.tutashared

import de.tutao.tutasdk.FileClient
import de.tutao.tutasdk.FileClientException
import java.io.File

class SdkFileClient(private val appDir: File) : FileClient {

	override suspend fun persistContent(name: String, content: ByteArray) {
		try {
			return File(appDir, name).writeBytes(content)
		} catch (e: Exception) {
			throw FileClientException.NotFound()
		}
	}

	override suspend fun readContent(name: String): ByteArray {
		try {
			return File(appDir, name).readBytes()
		} catch (e: Exception) {
			throw FileClientException.NotFound()
		}
	}
}