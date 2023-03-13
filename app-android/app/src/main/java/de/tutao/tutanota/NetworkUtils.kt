package de.tutao.tutanota

import java.net.HttpURLConnection

fun addCommonHeaders(urlConnection: HttpURLConnection) {
	urlConnection.setRequestProperty("v", BuildConfig.SYS_MODEL_VERSION)
	urlConnection.setRequestProperty("cv", BuildConfig.VERSION_NAME)
}