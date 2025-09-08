package de.tutao.tutashared

import android.os.Build
import android.util.Log
import de.tutao.tutasdk.HttpMethod
import de.tutao.tutasdk.RestClient
import de.tutao.tutasdk.RestClientException
import de.tutao.tutasdk.RestClientOptions
import de.tutao.tutasdk.RestResponse
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.ConnectionSpec
import okhttp3.Dispatcher
import okhttp3.Headers.Companion.toHeaders
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.conscrypt.Conscrypt
import java.io.IOException
import java.security.Security
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class NetworkUtils {
	companion object {
		private const val TAG = "NU"
		val defaultClient = createHttpClient()
		private fun createHttpClient(): OkHttpClient {
			val dispatcher = Dispatcher(Executors.newFixedThreadPool(1));
			dispatcher.maxRequests = 3;
			val builder: OkHttpClient.Builder = OkHttpClient()
				.newBuilder()
				.dispatcher(dispatcher)
				.connectTimeout(5, TimeUnit.SECONDS)
				.writeTimeout(5, TimeUnit.SECONDS)
				.readTimeout(5, TimeUnit.SECONDS)
				.run {
					if (BuildConfig.DEBUG) {
						connectionSpecs(listOf(ConnectionSpec.CLEARTEXT, ConnectionSpec.RESTRICTED_TLS))
					} else {
						connectionSpecs(listOf(ConnectionSpec.RESTRICTED_TLS))
					}
				}

			if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
				// setup TLSv1.3 for old android versions
				val conscrypt = Conscrypt.newProvider()
				val result = Security.insertProviderAt(conscrypt, 1)
				if (result == 1) {
					Log.i(TAG, "enabled conscrypt for TLS1.3 support on legacy android")
				} else {
					Log.e(TAG, "failed to enable conscrypt")
				}
				try {
					// we need to pass conscrypt to the SSLContext. Just inserting the security provider is not enough to make okhttp pick it up
					val tm: X509TrustManager = Conscrypt.getDefaultX509TrustManager()
					val sslContext: SSLContext = SSLContext.getInstance("TLS", conscrypt)
					sslContext.init(null, arrayOf<TrustManager>(tm), null)
					builder.sslSocketFactory(TLS13SocketFactory(sslContext.getSocketFactory()), tm)
				} catch (e: Exception) {
					e.printStackTrace()
				}
			}

			val client: OkHttpClient = builder.build()
			return client
		}
	}
}

class SdkRestClient : RestClient {
	companion object {
		// See: SdkFileClient::mapExceptionToError
		private fun mapExceptionToError(e: Throwable): RestClientException {
			// note: we currently do not match against e, as we do not need specific error type
			// in RustSide.
			// Although it will be helpful at some point to match against e and return more concrete error.
			Log.e("RestClient", "Got exception from SdkRestClient: ${e}. Assuming .Unknown")
			return RestClientException.Unknown()
		}
	}

	@Throws(RestClientException::class)
	override suspend fun requestBinary(url: String, method: HttpMethod, options: RestClientOptions): RestResponse {
		val response = kotlin.runCatching {
			val request = Request.Builder()
				.url(url)
				.method(method.toString(), options.body?.toRequestBody())
				.headers(options.headers.toHeaders())
				.build()
			val response = NetworkUtils.defaultClient
				.newBuilder()
				.connectTimeout(30, TimeUnit.SECONDS)
				.writeTimeout(20, TimeUnit.SECONDS)
				.readTimeout(20, TimeUnit.SECONDS)
				.build()
				.newCall(request)
				.await()
			RestResponse(response.code.toUInt(), response.headers.toMap(), response.body?.bytes())
		}

		return response.getOrElse { e -> throw mapExceptionToError(e) }
	}
}


/**
 * Bridge OkHttp [Call] to Kotlin coroutines.
 * Will cancel the [Call] on coroutine cancellation.
 */
suspend inline fun Call.await(): Response {
	return suspendCancellableCoroutine { continuation ->
		val callback: Callback = object : Callback {
			override fun onResponse(call: Call, response: Response) {
				continuation.resume(response)
			}

			override fun onFailure(call: Call, e: IOException) {
				continuation.resumeWithException(e)
			}
		}
		this.enqueue(callback)
		continuation.invokeOnCancellation { this.cancel() }
	}
}