package de.tutao.tutashared.push;

import android.app.job.JobParameters
import android.content.Intent
import android.util.Log
import androidx.lifecycle.lifecycleScope
import de.tutao.tutashared.LifecycleJobService
import de.tutao.tutashared.data.SseInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

abstract class PushNotificationService : LifecycleJobService() {


	@Volatile
	private var jobParameters: JobParameters? = null
	/** Indicates whether the service has an active job. A wrapper class is used so that the job state value can be
	 * modified by the SseClient's NetworkObserver  */
	protected val jobState = PushNotificationJobState(false)
	private lateinit var sseClient: SseClient
	// the below wrapper class is necessary because the push notification service state needs to be modifiable by function calls from the CommonPushNotificationModule.
	// since function inputs are immutable in Kotlin, this means we can't just pass a variable with a value of PushNotificationServiceStates.
	protected var serviceState = PushNotificationServiceStateIndicator(PushNotificationServiceState.STOPPED)
		set(value) {
			Log.d(getTAG(), "State $field -> $value")
			field = value
		}
	protected val finishJobThread = LooperThread {}


	abstract fun  getTAG(): String

	fun afterOnCreate(sseClient: SseClient, sseStorage: SseStorage, localNotificationsFacade: LocalNotificationsFacade) {
		lifecycleScope.launch {
			sseStorage.observeUsers().collect { userInfos ->
				Log.d(getTAG(), "sse storage updated " + userInfos.size)
				// Closing the connection sends RST packets over network and it triggers StrictMode
				// violations so we dispatch it to another thread.
				withContext(Dispatchers.IO) {
					val userIds = userInfos.mapTo(HashSet()) { it.userId }

					if (userIds.isEmpty()) {
						sseClient.stopConnection()
						finishJobIfNeeded()
					} else {
						sseClient.restartConnectionIfNeeded(
							SseInfo(
								sseStorage.getPushIdentifier()!!,
								userIds,
								sseStorage.getSseOrigin()!!
							)
						)
					}
				}
			}
		}
		localNotificationsFacade.createNotificationChannels()
	}


	final override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		super.onStartCommand(intent, flags, startId)
		val maybeSender = intent?.getStringExtra("sender")
		Log.d(getTAG(), "onStartCommand, sender: $maybeSender")

		this.serviceState.state = when (this.serviceState.state) {
			PushNotificationServiceState.STOPPED, PushNotificationServiceState.CREATED, PushNotificationServiceState.STARTED -> PushNotificationServiceState.STARTED
			PushNotificationServiceState.CONNECTING, PushNotificationServiceState.CONNECTED -> this.serviceState.state
		}

		return START_STICKY
	}

	final override fun onStartJob(params: JobParameters): Boolean {
		Log.d(getTAG(), "onStartJob")
		jobParameters = params
		jobState.active = true
		return true
	}

	final override fun onStopJob(params: JobParameters): Boolean {
		Log.d(getTAG(), "The job is finished")
		return true
	}

	protected fun scheduleJobFinish() {
		Log.d(getTAG(), "scheduleJobFinish, will actually schedule: ${jobParameters != null}")
		if (jobParameters != null) {
			finishJobThread.handler.postDelayed({
				Log.d(getTAG(), "Executing scheduled jobFinished")
				finishJobIfNeeded()
			}, TimeUnit.SECONDS.toMillis(20))
		}
	}

	protected fun finishJobIfNeeded() {
		if (jobParameters != null) {
			// We pass `true` for `wantsReschedule` here because we want to be rescheduled again if system doesn't
			// mind so we can run a bit more.
			jobFinished(jobParameters, true)
			jobParameters = null
			jobState.active = false
		}
	}

	final override fun onDestroy() {
		Log.d(getTAG(), "onDestroy")
		this.serviceState.state = PushNotificationServiceState.STOPPED
		super.onDestroy()
	}


}
