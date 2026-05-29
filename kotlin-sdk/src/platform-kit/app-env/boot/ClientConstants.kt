/* Generated file. timestamp: 29::1780065495436*/
import org.tutao.Env.assertMainOrNodeBoot

import org.tutao.ClientDetector.ClientPlatform

/*TRANSPILIER: CallExpression at topLevel is not repersentable outside ts
assertMainOrNodeBoot()
*/

public enum class ErrorReportClientType {
	Browser,
	Android,
	Ios,
	MacOS,
	Linux,
	Windows
}

public enum class BrowserType {
	CHROME,
	FIREFOX,
	EDGE,
	SAFARI,
	ANDROID,
	OPERA,
	OTHER
}

public enum class DeviceType {
	IPHONE,
	IPAD,
	ANDROID,
	DESKTOP,
	OTHER_MOBILE
}

public data class BrowserData(needsMicrotaskHack: bool, needsExplicitIDBIds: bool, indexedDbSupported: bool, clientPlatform: ClientPlatform)

const val companyTeamLabel: String = "Tuta Team"

/** File End **/