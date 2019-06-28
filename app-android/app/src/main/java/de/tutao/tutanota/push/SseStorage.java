package de.tutao.tutanota.push;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.util.Log;
import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;


public final class SseStorage {

	private static final String SSE_INFO_PREF = "sseInfo";
	private static final String TAG = SseStorage.class.getSimpleName();

	private Context context;

	public SseStorage(Context context) {
		this.context = context;
	}

	@Nullable
	public String getPushIdentifier() {
		SseInfo sseInfo = getSseInfo();
		if (sseInfo != null) {
			return sseInfo.getPushIdentifier();
		}
		return null;
	}

	@Nullable
	public SseInfo getSseInfo() {
		String pushIdentifierPref = getPrefs().getString(SSE_INFO_PREF, null);
		if (pushIdentifierPref == null) {
			return null;
		}
		return SseInfo.fromJson(pushIdentifierPref);
	}


	public void storePushIdentifier(String identifier, String userId, String sseOrigin) {
		final SseInfo sseInfo = getSseInfo();
		SseInfo newInfo;
		if (sseInfo == null) {
			newInfo = new SseInfo(identifier, Collections.singletonList(userId), sseOrigin);
		} else {
			List<String> userList = new ArrayList<>(sseInfo.getUserIds());
			if (!userList.contains(userId)) {
				userList.add(userId);
			}
			newInfo = new SseInfo(identifier, userList, sseOrigin);
		}
		getPrefs().edit().putString(SSE_INFO_PREF, newInfo.toJSON()).apply();
	}

	public void clear() {
		this.getPrefs().edit().remove(SSE_INFO_PREF).apply();
	}

	private SharedPreferences getPrefs() {
		return PreferenceManager.getDefaultSharedPreferences(context);
	}

	public void storePushEncSessionKeys(Map<String, String> keys) throws IOException {
		File file = getKeysFile();
		JSONObject keysJson = new JSONObject();
		try {
			for (String key : keys.keySet()) {
				keysJson.put(key, keys.get(key));
			}
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}

		IOUtils.write(keysJson.toString(), new FileOutputStream(file), StandardCharsets.UTF_8);
	}

	public Map<String, String> getPushIdentifierKeys() throws IOException {
		JSONObject keysJson = getKeysJson(getKeysFile());
		Map<String, String> keyMap = new HashMap<>();
		Iterator<String> keys = keysJson.keys();
		try {
			while (keys.hasNext()) {
				String key = keys.next();
				keyMap.put(key, keysJson.getString(key));
			}
		} catch (JSONException e) {
			throw new RuntimeException(e);
		}
		return keyMap;
	}

	private File getKeysFile() {
		return new File(context.getFilesDir(), "keys.json");
	}

	private JSONObject getKeysJson(File file) throws IOException {
		JSONObject keyMapJson;
		if (file.createNewFile()) {
			keyMapJson = new JSONObject();
		} else {
			String jsonString = IOUtils.toString(new FileInputStream(file), StandardCharsets.UTF_8);
			if (jsonString.isEmpty()) {
				keyMapJson = new JSONObject();
			} else {
				try {
					keyMapJson = new JSONObject(jsonString);
				} catch (JSONException e) {
					Log.w(TAG, "Failed to read keys file", e);
					keyMapJson = new JSONObject();
				}
			}
		}
		return keyMapJson;
	}
}

