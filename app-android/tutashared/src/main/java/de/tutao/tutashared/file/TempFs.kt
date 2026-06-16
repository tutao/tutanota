package de.tutao.tutashared.file

import android.content.Context
import android.net.Uri
import androidx.core.net.toFile
import androidx.core.net.toUri
import de.tutao.tutashared.FileInfo
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.getFileInfo
import de.tutao.tutashared.getNonClobberingFileName
import java.io.File
import java.io.FileNotFoundException
import java.io.InputStream
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap

class TempFs(private val context: Context, private val random: SecureRandom, private val tempDir: TempDir) {
	private val openStreams: MutableMap<Filename, InputStream> = ConcurrentHashMap()
	private val inMemoryFiles: MutableMap<Filename, ByteArray> = ConcurrentHashMap()

	fun createTempFileEncrypt(name: String): File {
		val newFileName = getNonClobberingFileName(tempDir.encrypt, name)
		return File(tempDir.decrypt, newFileName)
	}

	fun createTempFileDecrypt(name: String): File {
		val newFileName = getNonClobberingFileName(tempDir.decrypt, name)
		return File(tempDir.decrypt, newFileName)
	}

	fun isInTemp(path: String): Boolean = path.startsWith(tempDir.root.path)

	fun clearTempDir() {
		clearDirectory(tempDir.root)
	}

	fun fileStream(uri: String): InputStream {
		return when (val parsed = uri.toTutaUrl()) {
			is TutaUrl.Tmp -> this.inMemoryFiles[parsed.name]?.inputStream() ?: throw FileNotFoundException(uri)
			is TutaUrl.Stream -> this.openStreams[parsed.name] ?: throw FileNotFoundException(uri)
			is TutaUrl.File -> context.contentResolver.openInputStream(parsed.url) ?: throw FileNotFoundException(uri)
		}
	}

	fun createInMemoryFile(data: ByteArray): String {
		val fileName = this.generateFilename()
		this.inMemoryFiles[fileName] = data
		return TutaUrl.Tmp(fileName).asString()
	}

	fun deleteFile(uri: String) {
		when (val parsed = uri.toTutaUrl()) {
			is TutaUrl.Tmp -> this.inMemoryFiles.remove(parsed.name)
			is TutaUrl.Stream -> error("Cannot delete stream url")
			is TutaUrl.File -> {
				val file = parsed.url.toFile()
				file.assertInTmp()
				try {
					file.delete()
				} catch (_: FileNotFoundException) {
					throw FileNotFoundException(uri)
				}
			}
		}
	}

	fun openFileForReading(fileUri: String): String {
		return when (val parsed = fileUri.toTutaUrl()) {
			is TutaUrl.File -> {
				val stream = context.contentResolver.openInputStream(parsed.url)
					?: throw FileNotFoundException(fileUri)
				val fileName = generateFilename()
				openStreams[fileName] = stream
				TutaUrl.Stream(fileName).asString()
			}

			else -> fileUri.invalidUrl()
		}
	}

	fun closeFile(streamUri: String) {
		when (val parsed = streamUri.toTutaUrl()) {
			is TutaUrl.Stream -> this.openStreams.remove(parsed.name)?.close()
			else -> streamUri.invalidUrl()
		}
	}

	fun fileInfo(uri: String): FileInfo {
		return when (val parsed = uri.toTutaUrl()) {
			is TutaUrl.Tmp -> {
				val file = this.inMemoryFiles[parsed.name] ?: throw FileNotFoundException(uri)
				FileInfo(parsed.name.fileName, file.size.toLong())
			}

			is TutaUrl.Stream -> uri.invalidUrl()
			is TutaUrl.File -> getFileInfo(context, parsed.url)
		}
	}

	private fun generateFilename(): Filename {
		val bytes = ByteArray(12)
		random.nextBytes(bytes)
		return Filename(bytes.joinToString("") { "%02x".format(it) })
	}

	private fun File.assertInTmp() {
		if (!path.startsWith(tempDir.root.path)) {
			throw FileNotFoundException("File not found: $path")
		}
	}

	private fun clearDirectory(file: File) {
		file.listFiles()?.let { children ->
			for (child in children) {
				if (child.isDirectory) {
					clearDirectory(child)
				}
				child.delete()
			}
		}
	}
}

@JvmInline
private value class Filename(val fileName: String)

private sealed interface TutaUrl {
	data class Tmp(val name: Filename) : TutaUrl {
		override fun asString(): String {
			return "tuta-tmp:${name.fileName}"
		}
	}

	data class Stream(val name: Filename) : TutaUrl {
		override fun asString(): String {
			return "tuta-stream:${name.fileName}"
		}
	}

	data class File(val url: Uri) : TutaUrl {
		override fun asString(): String {
			return url.toString()
		}
	}

	fun asString(): String
}

private fun String.toTutaUrl(): TutaUrl {
	val uri = this.toUri()
	return when (uri.scheme) {
		"tuta-tmp" -> TutaUrl.Tmp(Filename(uri.schemeSpecificPart ?: invalidUrl()))
		"tuta-stream" -> TutaUrl.Stream(Filename(uri.schemeSpecificPart ?: invalidUrl()))
		"file", "content" -> TutaUrl.File(uri)
		else -> invalidUrl()
	}
}

private fun String.invalidUrl(): Nothing {
	throw Error("Invalid url: $this")
}