package de.tutao.tutanota.push;

import android.annotation.TargetApi;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.v4.app.NotificationCompat;
import android.text.TextUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import de.tutao.tutanota.MainActivity;
import de.tutao.tutanota.R;

import static de.tutao.tutanota.Utils.atLeastNougat;
import static de.tutao.tutanota.alarms.AlarmBroadcastReceiver.ALARM_NOTIFICATION_CHANNEL_ID;

public final class LocalNotificationsFacade {

	static final String NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed";
	private static final String EMAIL_NOTIFICATION_CHANNEL_ID = "notifications";
	private static final long[] VIBRATION_PATTERN = {100, 200, 100, 200};
	private static final String NOTIFICATION_EMAIL_GROUP = "de.tutao.tutanota.email";
	private static final int SUMMARY_NOTIFICATION_ID = 45;
	private static final String PERSISTENT_NOTIFICATION_CHANNEL_ID = "service_intent";

	private Context context;

	public LocalNotificationsFacade(Context context) {
		this.context = context;
	}


	private NotificationManager getNotificationManager() {
		return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
	}

	private final Map<String, LocalNotificationInfo> aliasNotification =
			new ConcurrentHashMap<>();

	public Notification makeConnectionNotification() {
		return new NotificationCompat
				.Builder(context, PERSISTENT_NOTIFICATION_CHANNEL_ID)
				.setContentTitle("Notification service")
				.setSmallIcon(R.drawable.ic_status)
				.build();
	}

	public void notificationDismissed(List<String> dissmissAddrs, boolean isSummary) {
		if (isSummary) {
			// If the user clicked on summary directly, reset counter for all notifications
			aliasNotification.clear();
		} else {
			if (dissmissAddrs != null) {
				for (String addr : dissmissAddrs) {
					aliasNotification.remove(addr);
					getNotificationManager().cancel(makeNotificationId(addr));
				}
			}
		}
		if (aliasNotification.isEmpty()) {
			getNotificationManager().cancel(SUMMARY_NOTIFICATION_ID);
		} else {
			boolean allAreZero = true;
			for (LocalNotificationInfo info : aliasNotification.values()) {
				if (info.counter > 0) {
					allAreZero = false;
					break;
				}
			}
			if (allAreZero) {
				getNotificationManager().cancel(SUMMARY_NOTIFICATION_ID);
			} else {
				for (LocalNotificationInfo info : aliasNotification.values()) {
					if (info.counter > 0) {
						sendSummaryNotification(getNotificationManager(),
								info.message, info.notificationInfo, false);
						break;
					}
				}
			}
		}
	}

	public void sendEmailNotifications(String title, List<PushMessage.NotificationInfo> notificationInfos) {
		if (notificationInfos.isEmpty()) {
			return;
		}

		for (int i = 0; i < notificationInfos.size(); i++) {
			PushMessage.NotificationInfo notificationInfo = notificationInfos.get(i);

			LocalNotificationInfo counterPerAlias =
					aliasNotification.get(notificationInfo.getAddress());
			if (counterPerAlias == null) {
				counterPerAlias = new LocalNotificationInfo(
						title,
						notificationInfo.getCounter(), notificationInfo);
			} else {
				counterPerAlias = counterPerAlias.incremented(notificationInfo.getCounter());
			}
			aliasNotification.put(notificationInfo.getAddress(), counterPerAlias);

			int notificationId = makeNotificationId(notificationInfo.getAddress());


			NotificationCompat.Builder notificationBuilder =
					new NotificationCompat.Builder(context, EMAIL_NOTIFICATION_CHANNEL_ID)
							.setLights(context.getResources().getColor(R.color.red), 1000, 1000);
			ArrayList<String> addresses = new ArrayList<>();
			addresses.add(notificationInfo.getAddress());
			notificationBuilder.setContentTitle(title)
					.setColor(context.getResources().getColor(R.color.red))
					.setContentText(notificationContent(notificationInfo.getAddress()))
					.setNumber(counterPerAlias.counter)
					.setSmallIcon(R.drawable.ic_status)
					.setDeleteIntent(this.intentForDelete(addresses))
					.setContentIntent(intentOpenMailbox(notificationInfo, false))
					.setGroup(NOTIFICATION_EMAIL_GROUP)
					.setAutoCancel(true)
					.setGroupAlertBehavior(atLeastNougat() ? NotificationCompat.GROUP_ALERT_CHILDREN : NotificationCompat.GROUP_ALERT_SUMMARY)
					.setDefaults(Notification.DEFAULT_ALL);

			getNotificationManager().notify(notificationId, notificationBuilder.build());
		}

		sendSummaryNotification(getNotificationManager(), title,
				notificationInfos.get(0), true);
	}

	private void sendSummaryNotification(NotificationManager notificationManager,
										 String title,
										 PushMessage.NotificationInfo notificationInfo,
										 boolean sound) {
		int summaryCounter = 0;
		ArrayList<String> addresses = new ArrayList<>();
		NotificationCompat.InboxStyle inboxStyle = new NotificationCompat.InboxStyle();

		for (Map.Entry<String, LocalNotificationInfo> entry : aliasNotification.entrySet()) {
			int count = entry.getValue().counter;
			if (count > 0) {
				summaryCounter += count;
				inboxStyle.addLine(notificationContent(entry.getKey()));
				addresses.add(entry.getKey());
			}
		}

		NotificationCompat.Builder builder = new NotificationCompat.Builder(context, EMAIL_NOTIFICATION_CHANNEL_ID)
				.setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL);

		Notification notification = builder.setContentTitle(title)
				.setContentText(notificationContent(notificationInfo.getAddress()))
				.setSmallIcon(R.drawable.ic_status)
				.setGroup(NOTIFICATION_EMAIL_GROUP)
				.setGroupSummary(true)
				.setColor(context.getResources().getColor(R.color.red))
				.setNumber(summaryCounter)
				.setStyle(inboxStyle)
				.setContentIntent(intentOpenMailbox(notificationInfo, true))
				.setDeleteIntent(intentForDelete(addresses))
				.setAutoCancel(true)
				// We need to update summary without sound when one of the alarms is cancelled
				// but we need to use sound if it's API < N because GROUP_ALERT_CHILDREN doesn't
				// work with sound there (pehaps summary consumes it somehow?) and we must do
				// summary with sound instead on the old versions.
				.setDefaults(sound ? NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE : 0)
				.setGroupAlertBehavior(atLeastNougat() ? NotificationCompat.GROUP_ALERT_CHILDREN : NotificationCompat.GROUP_ALERT_SUMMARY)
				.build();
		notificationManager.notify(SUMMARY_NOTIFICATION_ID, notification);
	}

	public void showErrorNotification() {
		Notification notification = new NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
				.setSmallIcon(R.drawable.ic_status)
				.setContentTitle("Could not schedule the alarm")
				.setContentText("Please update the application")
				.setDefaults(NotificationCompat.DEFAULT_ALL)
				.build();
		getNotificationManager().notify(1000, notification);
	}


	@TargetApi(Build.VERSION_CODES.O)
	public void createNotificationChannels() {
		NotificationChannel notificationsChannel = new NotificationChannel(
				EMAIL_NOTIFICATION_CHANNEL_ID,
				context.getString(R.string.notificationChannelEmail_label),
				NotificationManager.IMPORTANCE_DEFAULT);
		notificationsChannel.setShowBadge(true);
		Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
		AudioAttributes att = new AudioAttributes.Builder()
				.setUsage(AudioAttributes.USAGE_NOTIFICATION)
				.setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
				.build();
		notificationsChannel.setSound(ringtoneUri, att);
		notificationsChannel.setVibrationPattern(VIBRATION_PATTERN);
		notificationsChannel.enableLights(true);
		notificationsChannel.setLightColor(Color.RED);
		notificationsChannel.setShowBadge(true);
		getNotificationManager().createNotificationChannel(notificationsChannel);

		NotificationChannel serviceNotificationChannel = new NotificationChannel(
				PERSISTENT_NOTIFICATION_CHANNEL_ID, "Notification service",
				NotificationManager.IMPORTANCE_LOW);
		getNotificationManager().createNotificationChannel(serviceNotificationChannel);

		NotificationChannel alarmNotificationsChannel = new NotificationChannel(
				ALARM_NOTIFICATION_CHANNEL_ID,
				context.getString(R.string.reminder_label),
				NotificationManager.IMPORTANCE_HIGH);
		alarmNotificationsChannel.setShowBadge(true);
		alarmNotificationsChannel.setSound(ringtoneUri, att);
		alarmNotificationsChannel.setVibrationPattern(VIBRATION_PATTERN);
		alarmNotificationsChannel.enableLights(true);
		alarmNotificationsChannel.setLightColor(Color.RED);
		alarmNotificationsChannel.setShowBadge(true);
		getNotificationManager().createNotificationChannel(notificationsChannel);
	}


	@NonNull
	private String notificationContent(String address) {
		return aliasNotification.get(address).counter + " " + address;
	}

	private int makeNotificationId(String address) {
		return Math.abs(1 + address.hashCode());
	}

	private PendingIntent intentForDelete(ArrayList<String> addresses) {
		Intent deleteIntent = new Intent(context, PushNotificationService.class);
		deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, addresses);
		return PendingIntent.getService(
				context.getApplicationContext(),
				makeNotificationId("dismiss" + TextUtils.join("+", addresses)),
				deleteIntent,
				PendingIntent.FLAG_UPDATE_CURRENT);
	}

	private PendingIntent intentOpenMailbox(PushMessage.NotificationInfo notificationInfo,
											boolean isSummary) {
		Intent openMailboxIntent = new Intent(context, MainActivity.class);
		openMailboxIntent.setAction(MainActivity.OPEN_USER_MAILBOX_ACTION);
		openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_MAILADDRESS_KEY,
				notificationInfo.getAddress());
		openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY,
				notificationInfo.getUserId());
		openMailboxIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary);
		return PendingIntent.getActivity(
				context.getApplicationContext(),
				makeNotificationId(notificationInfo.getAddress() + "@isSummary" + isSummary),
				openMailboxIntent,
				PendingIntent.FLAG_UPDATE_CURRENT);
	}


	public static Intent notificationDismissedIntent(Context context,
													 ArrayList<String> emailAddresses,
													 String sender,
													 boolean isSummary) {
		Intent deleteIntent = new Intent(context, PushNotificationService.class);
		deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, emailAddresses);
		deleteIntent.putExtra("sender", sender);
		deleteIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary);
		return deleteIntent;
	}

	public static void showAlarmNotification(Context context, long when, String summary, Intent intent) {
		String contentText = String.format("%tR %s", when, summary);
		NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.notify((int) System.currentTimeMillis(),
				new NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
						.setSmallIcon(R.drawable.ic_status)
						.setContentTitle(context.getString(R.string.reminder_label))
						.setContentText(contentText)
						.setDefaults(NotificationCompat.DEFAULT_ALL)
						.setColor(context.getResources().getColor(R.color.red))
						.setContentIntent(openCalendarIntent(context, intent))
						.setAutoCancel(true)
						.build());
	}

	private static PendingIntent openCalendarIntent(Context context, Intent alarmIntent) {
		String userId = alarmIntent.getStringExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY);
		Intent openCalendarEventIntent = new Intent(context, MainActivity.class);
		openCalendarEventIntent.setAction(MainActivity.OPEN_CALENDAR_ACTION);
		openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId);
		return PendingIntent.getActivity(
				context,
				alarmIntent.getData().toString().hashCode(),
				openCalendarEventIntent,
				PendingIntent.FLAG_UPDATE_CURRENT);
	}
}
