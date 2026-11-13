package de.tutao.calendar.push

import android.app.job.JobParameters
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.lifecycle.lifecycleScope
import de.tutao.calendar.alarms.CalendarAlarmIntentFactory
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.push.NetworkObserver
import de.tutao.tutashared.DateProviderImpl
import de.tutao.tutashared.LifecycleJobService
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.alarms.AlarmNotificationsManager
import de.tutao.tutashared.alarms.SystemAlarmFacade
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.file.TempFs
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.push.IPushNotificationJobState
import de.tutao.tutashared.push.LooperThread
import de.tutao.tutashared.push.NotificationSseListener
import de.tutao.tutashared.push.PushNotificationServiceStateIndicator
import de.tutao.tutashared.push.PushNotificationServiceStates
import de.tutao.tutashared.push.SseClient
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.security.SecureRandom
import java.util.TimeZone
import java.util.concurrent.TimeUnit


/**
 * Main entry point for the background service that listens for notifications via SSE.
 *
 * The service is started in multiple ways
 *
 * 1. The main way the service is started is JobManager. It solves two things for us: periodic run and wakeLock. We try
 * to not hold wakeLock more than necessary so as soon as we receive a response from the server we schedule to release
 * it (after delay). This does not mean that the system will immediately kill the service (and in practice it does not).
 * 2. We also start the service from MainActivity, mostly to make sure that we still receive notifications.
 * 3. We start it on boot (see [BootBroadcastReceiver]
 * 4. We start it when a notification is dismissed (with [NOTIFICATION_DISMISSED_ADDR_EXTRA].
 *
 * SSE has its own event loop, we are just listening for events here and mediating between it and SSE storage.
 */
class PushNotificationService : LifecycleJobService() {
	@Volatile
	private var jobParameters: JobParameters? = null
	private val jobState = PushNotificationJobState(false)
	private lateinit var localNotificationsFacade: LocalNotificationsFacade
	private lateinit var sseClient: SseClient
	// the below wrapper class is necessary because the push notification service state needs to be modifiable by function calls from the CommonPushNotificationModule.
	// since function inputs are immutable in Kotlin, this means we can't just pass a variable with a value of PushNotificationServiceStates.
	private var state = PushNotificationServiceStateIndicator(PushNotificationServiceStates.STOPPED)
		set(value) {
			Log.d(TAG, "State $field -> $value")
			field = value
		}
	private val finishJobThread = LooperThread {}

	override fun onCreate() {
		super.onCreate()
		Log.d(TAG, "onCreate")
		state.state = PushNotificationServiceStates.CREATED

		finishJobThread.start()

		val appDatabase: AppDatabase = AppDatabase.getDatabase(this, allowMainThreadAccess = true)
		val crypto = AndroidNativeCryptoFacade(this, TempFs(this, SecureRandom(), TempDir(this)))
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(this, crypto, appDatabase)
		val sseStorage = SseStorage(appDatabase, keyStoreFacade)
		localNotificationsFacade = LocalNotificationsFacade(this, sseStorage)
		val dateProvider = DateProviderImpl()
		val alarmNotificationsManager = AlarmNotificationsManager(
			sseStorage,
			crypto,
			SystemAlarmFacade(this, CalendarAlarmIntentFactory()),
			localNotificationsFacade,
			dateProvider,
			TimeZone.getDefault()
		)
		alarmNotificationsManager.reScheduleAlarms()
		val suspensionHandler = SuspensionHandler(dateProvider)
		val notificationsHandler = CalendarNotificationsHandler(localNotificationsFacade, sseStorage, nativeCredentialsFacade,
			alarmNotificationsManager,  NetworkUtils.defaultClient, lifecycleScope, { AndroidSqlCipherFacade (this@PushNotificationService) }, this.filesDir, suspensionHandler)
		sseClient = SseClient(
			crypto,
			sseStorage,
			NetworkObserver(this, this, jobState),
			NotificationSseListener(
				state,
				notificationsHandler
			),
			NetworkUtils.defaultClient
		)
		lifecycleScope.launch {
			sseStorage.observeUsers().collect { userInfos ->
				Log.d(TAG, "sse storage updated " + userInfos.size)
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

	override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		super.onStartCommand(intent, flags, startId)
		val maybeSender = intent?.getStringExtra("sender")
		Log.d(TAG, "onStartCommand, sender: $maybeSender")

		this.state = when (this.state) {
			PushNotificationServiceStates.STOPPED, PushNotificationServiceStates.CREATED, PushNotificationServiceStates.STARTED -> PushNotificationServiceStates.STARTED
			PushNotificationServiceStates.CONNECTING, PushNotificationServiceStates.CONNECTED -> this.state
		}

		return START_STICKY
	}

	override fun onStartJob(params: JobParameters): Boolean {
		Log.d(TAG, "onStartJob")
		jobParameters = params
		jobState.active = true
		return true
	}

	override fun onStopJob(params: JobParameters): Boolean {
		Log.d(TAG, "The job is finished")
		return true
	}

	private fun scheduleJobFinish() {
		Log.d(TAG, "scheduleJobFinish, will actually schedule: ${jobParameters != null}")
		if (jobParameters != null) {
			finishJobThread.handler.postDelayed({
				Log.d(TAG, "Executing scheduled jobFinished")
				finishJobIfNeeded()
			}, TimeUnit.SECONDS.toMillis(20))
		}
	}

	private fun finishJobIfNeeded() {
		if (jobParameters != null) {
			// We pass `true` for `wantsReschedule` here because we want to be rescheduled again if system doesn't
			// mind so we can run a bit more.
			jobFinished(jobParameters, true)
			jobParameters = null
			jobState.active = false
		}
	}

	override fun onDestroy() {
		Log.d(TAG, "onDestroy")
		this.state = PushNotificationServiceStates.STOPPED
		super.onDestroy()
	}

	companion object {
		private const val TAG = "PushNotificationService"
		private const val SENDER_EXTRA = "sender"

		fun startIntent(context: Context?, sender: String?): Intent {
			val intent = Intent(context, PushNotificationService::class.java)
			intent.putExtra(SENDER_EXTRA, sender)
			return intent
		}
	}

	internal class PushNotificationJobState(
		/** Whether jobParameters is not null; should be true when a job is currently running. */
		override var active: Boolean
	) : IPushNotificationJobState
}