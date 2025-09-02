package de.tutao.tutashared

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Date
import java.util.concurrent.TimeUnit

const val TAG = "SuspensionH"

class SuspensionHandler(private val dateProvider: DateProvider) {
	private var suspensionEndTime: Date? = null
	private val coroutineScope = CoroutineScope(Dispatchers.Default)

	fun activateSuspensionIfInactive(suspensionDurationSeconds: Int, resourceURL: String) {
		if (this.suspensionEndTime == null) {
			Log.d(TAG, "Activating suspension $resourceURL: ${suspensionDurationSeconds}s")
			this.suspensionEndTime = this.dateProvider.now.plusSec(suspensionDurationSeconds.toLong())

			coroutineScope.launch {
				delay(TimeUnit.SECONDS.toMillis(suspensionDurationSeconds.toLong()))
				this@SuspensionHandler.suspensionEndTime = null
				Log.d(TAG, "Suspension released after ${suspensionDurationSeconds}s")
			}
		}
	}

	suspend inline fun <T> deferRequest(request: () -> T): T {
		waitForSuspension()
		return request()
	}

	suspend fun waitForSuspension() {
		val suspensionEnd = this.suspensionEndTime
		if (suspensionEnd != null) {
			val waitTime = suspensionEnd.time - this.dateProvider.now.time
			delay(waitTime)
		}
	}
}

private fun Date.plusSec(seconds: Long) = Date(this.time + TimeUnit.SECONDS.toMillis(seconds))