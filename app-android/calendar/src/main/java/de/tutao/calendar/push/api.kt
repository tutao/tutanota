package de.tutao.calendar.push

import de.tutao.calendar.BuildConfig
import okhttp3.Request

fun Request.Builder.addSysVersionHeaders() = apply {
	header("v", BuildConfig.SYS_MODEL_VERSION)
	header("cv", BuildConfig.VERSION_NAME)
}