package de.tutao.tutashared

import android.content.Context
import java.io.File
import java.security.SecureRandom

class TempDir(
	private val context: Context,
	random: SecureRandom = SecureRandom()
) {
	private val randomTempDirectory = random.bytes(16).toBase64().base64ToBase64Url()

	// We can only read from the temp/ subdir as configured in paths.xml
	val root get() = File(context.filesDir, "temp/$randomTempDirectory").apply { mkdirs() }
	val encrypt get() = File(context.filesDir, "temp/$randomTempDirectory/encrypted").apply { mkdirs() }
	val decrypt get() = File(context.filesDir, "temp/$randomTempDirectory/decrypted").apply { mkdirs() }
}