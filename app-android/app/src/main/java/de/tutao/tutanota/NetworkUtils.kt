package de.tutao.tutanota

import android.os.Build
import android.util.Log
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.Request
import org.conscrypt.Conscrypt
import java.security.Security
import java.util.*
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

fun addCommonHeaders(request: Request.Builder) {
	request.header("v", BuildConfig.SYS_MODEL_VERSION)
	request.header("cv", BuildConfig.VERSION_NAME)
}

class NetworkUtils {
	companion object {
		private const val TAG = "NU"
		val defaultClient = createHttpClient()
		private fun createHttpClient(): OkHttpClient {
			val builder: OkHttpClient.Builder = OkHttpClient()
					.newBuilder()
					.connectTimeout(5, TimeUnit.SECONDS)
					.writeTimeout(5, TimeUnit.SECONDS)
					.readTimeout(5, TimeUnit.SECONDS)
					.connectionSpecs(Collections.singletonList(ConnectionSpec.RESTRICTED_TLS))
			if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
				// setup TLSv1.3 for old android versions
				val conscrypt = Conscrypt.newProvider()
				var result = Security.insertProviderAt(conscrypt, 1)
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

