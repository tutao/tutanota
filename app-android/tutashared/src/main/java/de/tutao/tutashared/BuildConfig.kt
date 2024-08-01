package de.tutao.tutashared

import android.util.Log

data class BuildConfig(
	val SYS_MODEL_VERSION: String,
	val TUTANOTA_MODEL_VERSION: String,
	val VERSION_NAME: String,
	val DEBUG: Boolean
);

class ModuleBuildConfig {
	companion object {
		private lateinit var config: BuildConfig;

		fun init(sysModelVersion: String, versionName: String, tutanotaModelVersion: String, debug: Boolean) {
			Log.i(
				"BUILD_CONFIG", "Initializing build config with values " +
						"SYS_MODEL_VERSION: $sysModelVersion " +
						"TUTANOTA_MODEL_VERSION: $tutanotaModelVersion " +
						"VERSION_NAME: $versionName " +
						"DEBUG: $debug"
			)
			config = BuildConfig(sysModelVersion, versionName, tutanotaModelVersion, debug)
		}

		fun get() = config
	}
}

