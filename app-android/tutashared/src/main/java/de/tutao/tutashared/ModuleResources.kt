package de.tutao.tutashared

import android.util.Log

class ModuleResources {
	companion object {
		private lateinit var resources: Map<String, String>;

		fun init(resources: Map<String, String>) {
			Log.i(
				"MODULE_RESOURCES", "Initializing resources with values $resources"
			)
			this.resources = resources
		}

		fun get() = resources

		fun getString(key: String) = resources[key] ?: ""
	}
}

