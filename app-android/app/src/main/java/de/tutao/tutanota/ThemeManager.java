package de.tutao.tutanota;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static de.tutao.tutanota.Utils.jsonObjectToMap;

/**
 * ThemeManager impl like in other native parts.
 * 4 methods correspond to ThemeStorage from web plus two convenience methods getCurrentTheme() and getCurrentThemeWithFallback().
 */
public class ThemeManager {
	private static final String CURRENT_THEME_KEY = "theme";
	private static final String THEMES_KEY = "themes";
	private static final String TAG = "ThemeStorage";

	private final Context context;

	public ThemeManager(Context context) {
		this.context = context;
	}

	@Nullable
	String getSelectedThemeId() {
		return getPrefs().getString(CURRENT_THEME_KEY, null);
	}

	void setSelectedThemeId(@NonNull String themeId) {
		getPrefs().edit().putString(CURRENT_THEME_KEY, themeId).apply();
	}

	List<Map<String, String>> getThemes() {
		Set<String> themesStrings = Objects.requireNonNull(getPrefs().getStringSet(THEMES_KEY, Collections.emptySet()));
		List<Map<String, String>> themes = new ArrayList<>();
		for (String string : themesStrings) {
			try {
				JSONObject jsonTheme = new JSONObject(string);
				Map<String, String> theme = jsonObjectToMap(jsonTheme);
				themes.add(theme);
			} catch (JSONException e) {
				Log.e(TAG, "Could not parse theme", e);
			}
		}
		return themes;
	}

	void setThemes(JSONArray themes) {
		Set<String> themeStrings = new HashSet<>();
		for (int i = 0; i < themes.length(); i++) {
			try {
				JSONObject jsonObject = themes.getJSONObject(i);
				themeStrings.add(jsonObject.toString());
			} catch (JSONException e) {
				Log.e(TAG, "Could not parse theme", e);
			}
		}
		getPrefs().edit().putStringSet(THEMES_KEY, themeStrings).apply();
	}

	@Nullable
	Map<String, String> getCurrentTheme() {
		String themeId = this.getSelectedThemeId();
		if (themeId == null) {
			themeId = "light";
		}

		List<Map<String, String>> themes = this.getThemes();
		for (Map<String, String> theme : themes) {
			if (Objects.equals(themeId, theme.get("themeId"))) {
				return theme;
			}
		}
		return null;
	}

	@NonNull
	Map<String, String> getCurrentThemeWithFallback() {
		Map<String, String> theme = this.getCurrentTheme();
		if (theme == null) {
			theme = new HashMap<>();
			theme.put("themeId", "light-fallback");
			theme.put("content_bg", "#ffffff");
			theme.put("header_bg", "#ffffff");
		}
		return theme;
	}

	private SharedPreferences getPrefs() {
		return PreferenceManager.getDefaultSharedPreferences(context);
	}
}
