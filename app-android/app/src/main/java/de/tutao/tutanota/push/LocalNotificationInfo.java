package de.tutao.tutanota.push;


final class LocalNotificationInfo {
	final String message;
	final int counter;
	final PushMessage.NotificationInfo notificationInfo;

	LocalNotificationInfo(String message, int counter, PushMessage.NotificationInfo notificationInfo) {
		this.message = message;
		this.counter = counter;
		this.notificationInfo = notificationInfo;
	}

	LocalNotificationInfo incremented(int by) {
		return new LocalNotificationInfo(message, counter + by, notificationInfo);
	}

	@Override
	public String toString() {
		return "LocalNotificationInfo{" +
				"message='" + message + '\'' +
				", counter=" + counter +
				", notificationInfo=" + notificationInfo +
				'}';
	}
}
