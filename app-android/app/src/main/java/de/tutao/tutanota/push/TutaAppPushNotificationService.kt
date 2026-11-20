package de.tutao.tutanota.push

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.lifecycle.lifecycleScope
import de.tutao.tutanota.alarms.TutaAppAlarmIntentFactory
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.DateProviderImpl
import de.tutao.tutashared.NetworkUtils
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.alarms.AlarmNotificationsManager
import de.tutao.tutashared.alarms.SystemAlarmFacade
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.file.TempFs
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.push.NetworkObserver
import de.tutao.tutashared.push.PushNotificationService
import de.tutao.tutashared.push.PushNotificationServiceState
import de.tutao.tutashared.push.SseClient
import de.tutao.tutashared.push.SseListener
import de.tutao.tutashared.push.SseStorage
import java.security.SecureRandom
import java.util.TimeZone

/**
 * Main entry point for the background service that listens for notifications via SSE.
 *
 * The service is started in multiple ways
 *
 * 1. The main way the service is started is JobManager. It solves two things for us: periodic run and wakeLock. We try
 * to not hold wakeLock more than necessary so as soon as we receive a response from the server we schedule to release
 * it (after delay). This does not mean that the system will immediately kill the service (and in practice it does not).
 * 2. We also start the service from MainActivity, mostly to make sure that we still receive notifications.
 * 3. We start it on boot (see [TutaAppBootBroadcastReceiver]
 * 4. We start it when a notification is dismissed (with [NOTIFICATION_DISMISSED_ADDR_EXTRA].
 *
 * SSE has its own event loop, we are just listening for events here and mediating between it and SSE storage.
 */
class TutaAppPushNotificationService : PushNotificationService() {

	override fun onCreate() {
		super.onCreate()
		Log.d(TAG, "onCreate")
		serviceState.state = PushNotificationServiceState.CREATED

		finishJobThread.start()

		val appDatabase: AppDatabase = AppDatabase.getDatabase(this, allowMainThreadAccess = true)
		val crypto = AndroidNativeCryptoFacade(this, TempFs(this, SecureRandom(), TempDir(this)))
		val nativeCredentialsFacade = CredentialsEncryptionFactory.create(this, crypto, appDatabase)
		val keyStoreFacade = createAndroidKeyStoreFacade()
		val sseStorage = SseStorage(appDatabase, keyStoreFacade)
		val localNotificationsFacade = TutaAppLocalNotificationsFacade(this, sseStorage)
		val systemAlarmFacade = SystemAlarmFacade(this, TutaAppAlarmIntentFactory())
		val dateProvider = DateProviderImpl()
		val alarmNotificationsManager = AlarmNotificationsManager(
			sseStorage,
			crypto,
			systemAlarmFacade,
			localNotificationsFacade,
			dateProvider,
			TimeZone.getDefault()
		)
		val suspensionHandler = SuspensionHandler(dateProvider)
		val notificationsHandler = TutaAppNotificationsHandler(
			localNotificationsFacade,
			sseStorage,
			nativeCredentialsFacade,
			alarmNotificationsManager,
			NetworkUtils.defaultClient,
			lifecycleScope,
			{ AndroidSqlCipherFacade(this@TutaAppPushNotificationService) },
			this.filesDir,
			suspensionHandler
		)
		val sseListener = SseListener(serviceState, notificationsHandler, ::finishJobIfNeeded, ::scheduleJobFinish)
		val sseClient = SseClient(
			crypto,
			sseStorage,
			NetworkObserver(this, this, jobState),
			sseListener,
			NetworkUtils.defaultClient
		)
		alarmNotificationsManager.reScheduleAlarms()
		afterOnCreate(sseClient, sseStorage, localNotificationsFacade)
	}

	override fun getTAG(): String {
		return TAG
	}


	companion object {
		private const val TAG = "TutaPushNotificationService"
		private const val SENDER_EXTRA = "sender"

		fun startIntent(context: Context?, sender: String?): Intent {
			val intent = Intent(context, TutaAppPushNotificationService::class.java)
			intent.putExtra(SENDER_EXTRA, sender)
			return intent
		}
	}
}
