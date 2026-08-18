package de.tutao.langApi

import de.tutao.platformKit.appEnv.EnvType

class RuntimeInfo {
	companion object {
		val _isWorker: Boolean = true
		val _isNode: Boolean = true

		fun indexedDbIsSupported(): Boolean {
			return true
		}

		fun hasTouchEvent(): Boolean {
			return false
		}

		fun <E> globallyDefinedEnv(): EnvType? {
			return EnvType(null!!, null!!, null!!, null!!, null!!, null!!, null!!, null!!, null!!)
		}
	}
}