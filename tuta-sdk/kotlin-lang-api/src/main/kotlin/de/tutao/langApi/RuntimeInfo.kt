package de.tutao.langApi

import de.tutao.langApi.types.KtString

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

		fun globallyDefinedEnv(): KtString {
			return KtString("")
		}
	}
}