package de.tutao.tutashared

import de.tutao.tutasdk.FileClient
import java.io.File

class SdkFileClient(private val appDir: File) : FileClient {

	override suspend fun persistContent(name: String, content: ByteArray) {
		File(appDir, name).writeBytes(content)
	}

	override suspend fun readContent(name: String): ByteArray {
		return File(appDir, name).readBytes()
	}
}