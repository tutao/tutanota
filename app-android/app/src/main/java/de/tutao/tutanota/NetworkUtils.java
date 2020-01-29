package de.tutao.tutanota;

import java.net.HttpURLConnection;

public class NetworkUtils {

	private static final int SYS_MODEL_VERSION = 55;

	public static void addCommonHeaders(HttpURLConnection urlConnection) {
		urlConnection.setRequestProperty("v", Integer.toString(SYS_MODEL_VERSION));
		urlConnection.setRequestProperty("cv", BuildConfig.VERSION_NAME);
	}
}
