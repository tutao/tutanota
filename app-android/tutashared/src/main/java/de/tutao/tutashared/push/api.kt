package de.tutao.tutashared.push

import de.tutao.tutashared.BuildConfig
import okhttp3.Request

fun Request.Builder.addSysVersionHeaders() = apply {
	header("v", "126") // TODO: give valid SYS_MODEL_VERSION env variable
	header("cv", "365.261030.0") // TODO: give valid VERSION_NAME env variable
}