package de.tutao.tutanota

import java.net.HttpURLConnection

private const val SYS_MODEL_VERSION = 64
fun addCommonHeaders(urlConnection: HttpURLConnection) {
	urlConnection.setRequestProperty("v", SYS_MODEL_VERSION.toString())
	urlConnection.setRequestProperty("cv", BuildConfig.VERSION_NAME)
}