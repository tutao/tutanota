package de.tutao.tutashared

import java.io.File

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