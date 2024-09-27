package de.tutao.calendar

import de.tutao.tutashared.TempDir
import de.tutao.tutashared.ipc.CommonSystemFacade
import de.tutao.tutashared.ipc.SqlCipherFacade
import kotlinx.coroutines.CompletableDeferred
import org.apache.commons.io.IOUtils
import java.io.File
import java.nio.charset.Charset
import kotlin.random.Random

class AndroidCommonSystemFacade(
	private val activity: MainActivity,
	private val sqlCipherFacade: SqlCipherFacade,
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
		this.sqlCipherFacade.closeDb()
		this.webAppInitialized = CompletableDeferred()
		activity.reload(query)
	}

	@Suppress("BlockingMethodInNonBlockingContext")
	override suspend fun getLog(): String {
		val logFile = File(tempDir.root, "log-${System.currentTimeMillis()}-${Random.nextInt()}.txt")
		logFile.delete()
		logFile.createNewFile()
		// -d means print and exit without blocking, -T gets last lines, -f outputs to file
		val process = Runtime.getRuntime().exec(arrayOf("logcat", "-d", "-T", "1500", "-f", logFile.absolutePath))
		try {
			process.waitFor()
		} catch (ignored: InterruptedException) {
		}
		if (process.exitValue() != 0) {
			val error = IOUtils.toString(process.errorStream, Charset.defaultCharset())
			logFile.delete()
			throw RuntimeException("Reading logs failed: " + process.exitValue() + ", " + error)
		}

		val text = logFile.readText()

		logFile.delete()

		return text
	}

	suspend fun awaitForInit() {
		webAppInitialized.await()
	}
}