package de.tutao.tutanota

import android.content.Context
import android.net.Uri
import org.apache.commons.io.IOUtils
import java.io.File
import java.io.IOException
import java.nio.charset.Charset

object LogReader {
	fun getLogFile(context: Context): Uri {
		return try {
			val tempDirectory = File(Utils.getDir(context), "temp")
			tempDirectory.mkdirs()
			val logFile = File(tempDirectory, "log.txt")
			logFile.delete()
			logFile.createNewFile()
			// -d means print and exit, -T gets last lines, -f outputs to file
			val process = Runtime.getRuntime().exec(arrayOf("logcat", "-d", "-T", "1500", "-f", logFile.absolutePath))
			try {
				process.waitFor()
			} catch (ignored: InterruptedException) {
			}
			if (process.exitValue() != 0) {
				val error = IOUtils.toString(process.errorStream, Charset.defaultCharset())
				throw RuntimeException("Reading logs failed: " + process.exitValue() + ", " + error)
			}
			Uri.fromFile(logFile)
		} catch (e: IOException) {
			throw RuntimeException(e)
		}
	}
}