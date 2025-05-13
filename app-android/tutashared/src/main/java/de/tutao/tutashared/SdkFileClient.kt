package de.tutao.tutashared

import de.tutao.tutasdk.FileClient
import de.tutao.tutasdk.FileClientException
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException

class SdkFileClient(private val appDir: File) : FileClient {
	companion object {
		// None of the SdkComponent should throw Exception that is not known to Rust Side,
		// always catch all exception and convert it to something that can be converted to rust Result::E
		private fun mapExceptionToError(e: Throwable): FileClientException {
			return when (e) {
				is FileNotFoundException -> FileClientException.NotFound()
				is IOException -> FileClientException.IoException()
				else -> FileClientException.Unknown()
			}
		}
	}

	@Throws(FileClientException::class)
	override suspend fun persistContent(name: String, content: ByteArray) {
		val writeResult = runCatching { File(appDir, name).writeBytes(content) }
		writeResult.getOrElse { e -> throw mapExceptionToError(e) }
	}

	@Throws(FileClientException::class)
	override suspend fun readContent(name: String): ByteArray {
		val fileContent = runCatching { File(appDir, name).readBytes() }
		return fileContent.getOrElse { e -> throw mapExceptionToError(e) }
	}
}