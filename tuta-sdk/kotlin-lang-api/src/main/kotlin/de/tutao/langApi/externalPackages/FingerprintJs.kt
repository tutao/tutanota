package de.tutao.langApi.fingerprintJs

import de.tutao.langApi.TsString
import de.tutao.langApi.types.KtString
import de.tutao.langApi.types.Promise
import de.tutao.langApi.types.StringBasedEnum

data class BotdResult(val bot: Boolean, val botKind: BotKind?)

enum class BotKind(override val __ts_value: TsString) : StringBasedEnum {
	Electron(KtString("electron")),
	Unknown(KtString("unknown")),
}

class FingerprintJs {
	companion object {
		fun detect(monitoring: Boolean): Promise<BotdResult> {
			TODO()
		}
	}
}
