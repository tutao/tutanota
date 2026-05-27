package de.tutao.tutashared.file

import android.content.Context
import android.net.Uri
import androidx.core.net.toUri
import de.tutao.tutashared.FileInfo
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.bytes
import de.tutao.tutashared.getFileInfo
import de.tutao.tutashared.toBase64
import org.apache.commons.io.input.BoundedInputStream
import java.io.FileNotFoundException
import java.io.InputStream
import java.security.SecureRandom

class TempFs(private val context: Context, private val random: SecureRandom) {
	// FIXME: thread-safe
	val tutaUriToNativeUri: MutableMap<Uri, String> = HashMap()

	fun createFileChunkUri(fileUri: String, start: Long, length: Long): Uri {
		val chunkId = random.bytes(16).toBase64().base64ToBase64Url()
		val tutaUri = "tuta-chunk:${chunkId}?start=${start}&length=${length}".toUri()
		tutaUriToNativeUri[tutaUri] = fileUri

		return tutaUri
	}

	fun fileStream(uri: String): InputStream {
		val parsed = uri.toUri()
		if (parsed.scheme == "tuta-chunk") {
			val contentInputStream = tutaUriToNativeUri[parsed]
				?.let { context.contentResolver.openInputStream(it.toUri()) }
				?: throw FileNotFoundException(uri)
			val start = parsed.getQueryParameter("start")?.toLong() ?: throw Error("Invalid uri $uri")
			val length = parsed.getQueryParameter("length")?.toLong() ?: throw Error("Invalid uri $uri")

			contentInputStream.skip(start)
			return BoundedInputStream.builder()
				.setInputStream(contentInputStream)
				.setMaxCount(length)
				.get()
		} else {
			return context.contentResolver.openInputStream(parsed) ?: throw FileNotFoundException(uri)
		}
	}

	fun fileInfo(uri: String): FileInfo {
		val parsed = uri.toUri()
		if (parsed.scheme == "tuta-chunk") {
			val native = tutaUriToNativeUri[parsed] ?: throw FileNotFoundException()
			val fileInfo = getFileInfo(context, native.toUri())
			fileInfo.size = parsed.getQueryParameter("length")?.toLong() ?: throw Error("Invalid uri $uri")
			return fileInfo
		} else {
			return getFileInfo(context, parsed)
		}
	}
}