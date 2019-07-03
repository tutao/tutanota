package de.tutao.tutanota.push;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

final class PushMessage {
	private static final String TITLE_KEY = "title";
	private static final String ADDRESS_KEY = "address";
	private static final String COUNTER_KEY = "counter";
	private static final String USER_ID_KEY = "userId";
	private static final String NOTIFICATIONS_KEY = "notificationInfos";
	private static final String CONFIRMATION_ID_KEY = "confirmationId";
	private static final String HAS_ALARM_NOTIFICATIONS_KEY = "hasAlarmNotifications";

	private final String title;
	private final String confirmationId;
	private final List<NotificationInfo> notificationInfos;
	private final boolean hasAlarmNotifications;
	private final String changeTime;

	public static PushMessage fromJson(String json) throws JSONException {
		JSONObject jsonObject = new JSONObject(json);
		String title = jsonObject.getString(TITLE_KEY);
		String confirmationId = jsonObject.getString(CONFIRMATION_ID_KEY);
		JSONArray recipientInfosJsonArray = jsonObject.getJSONArray(NOTIFICATIONS_KEY);
		List<NotificationInfo> notificationInfos = new ArrayList<>(recipientInfosJsonArray.length());
		for (int i = 0; i < recipientInfosJsonArray.length(); i++) {
			JSONObject itemObject = recipientInfosJsonArray.getJSONObject(i);
			notificationInfos.add(NotificationInfo.fromJson(itemObject));
		}
		boolean hasAlarmNotifications = jsonObject.getBoolean(HAS_ALARM_NOTIFICATIONS_KEY);
		String changeTime = jsonObject.getString("changeTime");
		return new PushMessage(title, confirmationId, notificationInfos, hasAlarmNotifications, changeTime);
	}

	private PushMessage(String title, String confirmationId,
						List<NotificationInfo> notificationInfos,
						boolean hasAlarmNotifications, String changeTime) {
		this.title = title;
		this.confirmationId = confirmationId;
		this.notificationInfos = notificationInfos;
		this.hasAlarmNotifications = hasAlarmNotifications;
		this.changeTime = changeTime;
	}

	public String getTitle() {
		return title;
	}

	public List<NotificationInfo> getNotificationInfos() {
		return notificationInfos;
	}

	public String getConfirmationId() {
		return confirmationId;
	}

	public boolean hasAlarmNotifications() {
		return hasAlarmNotifications;
	}

	public String getChangeTime() {
		return changeTime;
	}

	final static class NotificationInfo {
		private final String address;
		private final int counter;
		private String userId;

		public static NotificationInfo fromJson(JSONObject jsonObject) throws JSONException {
			String address = jsonObject.getString(ADDRESS_KEY);
			int counter = jsonObject.getInt(COUNTER_KEY);
			String userId = jsonObject.getString(USER_ID_KEY);
			return new NotificationInfo(address, counter, userId);
		}

		NotificationInfo(String address, int counter, String userId) {
			this.address = address;
			this.counter = counter;
			this.userId = userId;
		}

		public String getAddress() {
			return address;
		}

		public int getCounter() {
			return counter;
		}

		public String getUserId() {
			return userId;
		}
	}
}
