package de.tutao.calendar

import de.tutao.tutashared.TempDir
import de.tutao.tutashared.getLogcat
import de.tutao.tutashared.ipc.CommonSystemFacade
import de.tutao.tutashared.ipc.SqlCipherFacade
import kotlinx.coroutines.CompletableDeferred
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class AndroidCommonSystemFacade(
	private val activity: MainActivity,
	private val sqlCipherFacade: SqlCipherFacade,
	private val tempDir: TempDir,
	private val httpClient: OkHttpClient
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

	override suspend fun getLog(): String {
		return getLogcat(tempDir.root)
	}

	override suspend fun executePostRequest(postUrl: String, body: String): Boolean {
		val requestBuilder = Request.Builder()
			.url(postUrl)
			.post(body.toRequestBody())

		val req = requestBuilder.build()

		val response = httpClient
			.newBuilder()
			.connectTimeout(5, TimeUnit.SECONDS)
			.writeTimeout(5, TimeUnit.SECONDS)
			.readTimeout(5, TimeUnit.SECONDS)
			.build()
			.newCall(req)
			.execute()

		val responseCode = response.code
		return responseCode in 200..299
	}

	suspend fun awaitForInit() {
		webAppInitialized.await()
	}
}