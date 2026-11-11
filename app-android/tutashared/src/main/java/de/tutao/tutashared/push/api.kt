package de.tutao.tutashared.push

import de.tutao.tutashared.BuildConfig
import okhttp3.Request

fun Request.Builder.addSysVersionHeaders() = apply {
	header("v", BuildConfig.SYS_MODEL_VERSION)
	header("cv", BuildConfig.VERSION_NAME)
}