package de.tutao.tutashared

import android.util.Log
import de.tutao.tutashared.ipc.ExternalCalendarFacade
import okhttp3.OkHttpClient
import okhttp3.Request
import org.apache.commons.io.IOUtils
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class AndroidCalendarFacade(
	private val defaultClient: OkHttpClient
) : ExternalCalendarFacade {
	override suspend fun fetchExternalCalendar(url: String): String {
		val requestBuilder = Request.Builder()
			.url(url)
			.method("GET", null)

		val req = requestBuilder.build()

		val response = defaultClient
			.newBuilder()
			.connectTimeout(30, TimeUnit.SECONDS)
			.writeTimeout(20, TimeUnit.SECONDS)
			.readTimeout(20, TimeUnit.SECONDS)
			.build()
			.newCall(req)
			.execute()

		val responseCode = response.code
		Log.d(TAG, "External calendar returned $responseCode")

		response.body?.byteStream().use { inputStream ->
			val responseString = IOUtils.toString(inputStream, StandardCharsets.UTF_8)
			Log.d(TAG, "Loaded external calendar response")
			return responseString
		}
	}

	companion object {
		private const val TAG = "CalendarFacade"
	}
}