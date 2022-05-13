package de.tutao.tutanota

import android.annotation.SuppressLint
import android.content.Context
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import android.util.Base64
import androidx.annotation.ColorInt
import org.apache.commons.io.IOUtils
import org.jdeferred.Deferred
import org.jdeferred.impl.DeferredObject
import org.json.JSONException
import org.json.JSONObject
import java.io.*
import java.util.*

object Utils {
	fun bytesToBase64(bytes: ByteArray): String {
		return Base64.encodeToString(bytes, Base64.NO_WRAP)
	}

	fun base64ToBytes(base64: String): ByteArray {
		return Base64.decode(base64, Base64.NO_WRAP)
	}

	fun base64ToBase64Url(base64: String?): String {
		return base64!!.replace("\\+".toRegex(), "-")
				.replace("/".toRegex(), "_")
				.replace("=".toRegex(), "")
	}

	@Throws(IOException::class)
	fun readFile(file: File?): ByteArray {
		FileInputStream(file).use { `in` -> return IOUtils.toByteArray(`in`) }
	}

	@Throws(IOException::class)
	fun writeFile(outputFile: File, bytes: ByteArray?) {
		outputFile.parentFile!!.let {
			if (!it.exists()) {
				it.mkdirs()
			}
		}
		if (!outputFile.exists()) {
			outputFile.createNewFile()
		}
		FileOutputStream(outputFile).use { out -> IOUtils.write(bytes, out) }
	}

	fun fileToUri(file: File?): String {
		return Uri.fromFile(file).toString()
	}

	@SuppressLint("Range")
	@Throws(FileNotFoundException::class)
	fun getFileInfo(context: Context, fileUri: Uri): FileInfo {
		val scheme = fileUri.scheme
		if (scheme == null || scheme == "file") {
			return FileInfo(fileUri.lastPathSegment!!, File(fileUri.path!!).length())
		} else if (scheme == "content") {
			try {
				context.contentResolver.query(fileUri, null, null, null, null).use { cursor ->
					if (cursor != null && cursor.moveToFirst()) {
						var filename = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME))
						if (filename == null) {
							// From Android docs:
							// "If this is not provided then the name should default to the the last
							// segment of the file's URI."
							// It's not clear if it's responsibility of the provider or of us but it
							// seems like some providers are not implemented correctly so we default
							// by ourselves.
							filename = fileUri.lastPathSegment
						}
						return FileInfo(filename, cursor.getLong(cursor.getColumnIndex(OpenableColumns.SIZE)))
					}
				}
			} catch (e: SecurityException) {
				// When file is deleted SecurityException may be thrown instead.
				throw FileNotFoundException(fileUri.toString())
			}
		}
		throw RuntimeException("could not resolve file name / size for uri $fileUri")
	}

	fun merge(vararg arrays: ByteArray): ByteArray {
		var length = 0
		for (bytes in arrays) {
			length += bytes.size
		}
		val merged = ByteArray(length)
		var position = 0
		for (array in arrays) {
			System.arraycopy(array, 0, merged, position, array.size)
			position += array.size
		}
		return merged
	}

	fun getDir(context: Context): File {
		return context.filesDir
	}

	fun atLeastOreo(): Boolean {
		return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
	}

	fun atLeastNougat(): Boolean {
		return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
	}

	fun <D, F, P> resolvedDeferred(result: D): Deferred<D, F, P> {
		return DeferredObject<D, F, P>()
				.resolve(result)
	}

	@Throws(JSONException::class)
	fun jsonObjectToMap(jsonObject: JSONObject): MutableMap<String, String> {
		val map: MutableMap<String, String> = HashMap()
		val keys = jsonObject.keys()
		while (keys.hasNext()) {
			val key = keys.next()
			map[key] = jsonObject.getString(key)
		}
		return map
	}

	fun isColorLight(color: String): Boolean {
		val argb = parseColor(color)
		val r = argb shr 16 and 0xff // extract red
		val g = argb shr 8 and 0xff // extract green
		val b = argb and 0xff // extract blue

		// Counting the perceptive luminance
		// human eye favors green color...
		val a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255
		return a < 0.5
	}

	/** parse #RGB or #RRGGBB color codes into an 0xAARRGGBB int  */
	@ColorInt
	fun parseColor(color: String): Int {
		var color = color
		require(!(color[0] != '#' || color.length != 4 && color.length != 7)) { "Invalid color format: $color" }
		if (color.length == 4) {
			val chars = charArrayOf(
					'#',
					color[1],
					color[1],
					color[2],
					color[2],
					color[3],
					color[3]
			)
			color = String(chars)
		}
		val rgb = color.substring(1).toInt(16)

		// alpha channel is always max
		return rgb or -0x1000000
	}
}

class FileInfo(var name: String, var size: Long)