package de.tutao.tutashared

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Date
import java.util.HashMap
import java.util.concurrent.TimeUnit

const val TAG = "SuspensionH"

/**
 * Shared state and controller for the "suspension" state when the server indicates that no further requests can be
 * issues at the moment.
 */
class SuspensionHandler(private val dateProvider: DateProvider) {
	private var currentSuspensions: HashMap<String, Date> = HashMap<String, Date>()
	private val coroutineScope = CoroutineScope(Dispatchers.Default)

	fun isSuspended (resourceURL: String): Boolean {
		return this.currentSuspensions.containsKey(resourceURL)
	}

	fun activateSuspensionIfInactive(suspensionDurationSeconds: Int, resourceURL: String) {
		if (!this.currentSuspensions.containsKey(resourceURL)) {
			Log.d(TAG, "Activating suspension $resourceURL: ${suspensionDurationSeconds}s")
			currentSuspensions[resourceURL] = this.dateProvider.now.plusSec(suspensionDurationSeconds.toLong())

			coroutineScope.launch {
				delay(TimeUnit.SECONDS.toMillis(suspensionDurationSeconds.toLong()))
				this@SuspensionHandler.currentSuspensions.remove(resourceURL)
				Log.d(TAG, "Suspension released after ${suspensionDurationSeconds}s")
			}
		}
	}

	suspend inline fun <T> deferRequest(request: () -> T, resourceURL: String): T {
		while(isSuspended(resourceURL)) {
			waitForSuspension(resourceURL)
		}

		return request()
	}

	suspend fun waitForSuspension(resourceURL: String) {
		val suspensionEnd = this.currentSuspensions[resourceURL]
		if (suspensionEnd != null) {
			val waitTime = suspensionEnd.time - this.dateProvider.now.time
			delay(waitTime)
		}
	}
}

private fun Date.plusSec(seconds: Long) = Date(this.time + TimeUnit.SECONDS.toMillis(seconds))
