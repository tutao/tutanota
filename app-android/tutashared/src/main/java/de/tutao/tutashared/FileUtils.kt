package de.tutao.tutashared

import org.apache.commons.io.input.BoundedInputStream
import java.io.File
import java.io.InputStream

fun getNonClobberingFileName(parentFile: File, child: String): String {
	// should only happen if parent is not a dir
	val siblings = parentFile.listFiles() ?: return child

	val file = File(child)
	val base = file.nameWithoutExtension
	val ext = file.extension

	fun doGetNonClobberingFileName(
		siblings: Array<File>,
		base: String,
		ext: String, suffix: Int = 0
	): String {
		val nameToTry = if (suffix == 0) {
			"$base.$ext"
		} else {
			"$base ($suffix).$ext"
		}
		if (siblings.firstOrNull { it.name == nameToTry } == null) {
			return nameToTry
		}
		// yay tail recursion
		return doGetNonClobberingFileName(siblings, base, ext, suffix + 1)
	}
	return doGetNonClobberingFileName(siblings, base, ext)
}

fun InputStream.bounded(start: Long, length: Long): InputStream {
	this.skip(start)
	return BoundedInputStream.builder()
		.setInputStream(this)
		.setMaxCount(length)
		.get()
}