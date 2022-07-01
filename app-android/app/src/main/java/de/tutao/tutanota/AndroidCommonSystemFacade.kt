package de.tutao.tutanota

import de.tutao.tutanota.ipc.CommonSystemFacade
import kotlinx.coroutines.CompletableDeferred
import org.apache.commons.io.IOUtils
import java.io.File
import java.nio.charset.Charset

class AndroidCommonSystemFacade(
		private val activity: MainActivity,
		private val tempDir: TempDir
) : CommonSystemFacade {

	@Volatile
	private var webAppInitialized = CompletableDeferred<Unit>()

	val initialized: Boolean
		get() = webAppInitialized.isCompleted

	override suspend fun initializeRemoteBridge() {
		this.webAppInitialized.complete(Unit)
	}

	override suspend fun reload(query: Map<String, String>) {
		this.webAppInitialized = CompletableDeferred()
		activity.reload(query)
	}

	override suspend fun getLog(): String {
		val logFile = File(tempDir.root, "log.txt")
		logFile.delete()
		logFile.createNewFile()
		// -d means print and exit, -T gets last lines, -f outputs to file
		val process = Runtime.getRuntime().exec(arrayOf("logcat", "-d", "-T", "1500"))
		try {
			process.waitFor()
		} catch (ignored: InterruptedException) {
		}
		if (process.exitValue() != 0) {
			val error = IOUtils.toString(process.errorStream, Charset.defaultCharset())
			throw RuntimeException("Reading logs failed: " + process.exitValue() + ", " + error)
		}

		return process.inputStream.bufferedReader().readText()
	}

	suspend fun awaitForInit() {
		webAppInitialized.await()
	}
}