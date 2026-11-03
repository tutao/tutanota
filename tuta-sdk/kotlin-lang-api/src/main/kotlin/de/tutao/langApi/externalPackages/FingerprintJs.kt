package de.tutao.langApi.fingerprintJs

import de.tutao.langApi.TsString
import de.tutao.langApi.types.Promise

data class BotdResult(val bot: Boolean, val botKind: BotKind)

enum class BotKind(val __ts_value: TsString) {
	Electron(TsString("Electron")),
	Unknown(TsString("Unknown")),
}

class FingerprintJs {
	companion object {
		fun detect(monitoring: Boolean): Promise<BotdResult> {
			return null!!
		}
	}
}