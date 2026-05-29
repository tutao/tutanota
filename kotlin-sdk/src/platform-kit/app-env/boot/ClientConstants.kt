/* Generated file. timestamp: 29::1780060506844*/
import org.tutao..Env.assertMainOrNodeBoot

import org.tutao.ClientDetector.ClientPlatform

/*TRANSPILIER: CallExpression at topLevel is not repersentable outside ts
assertMainOrNodeBoot()
*/

enum class ErrorReportClientType {
	Browser,
	Android,
	Ios,
	MacOS,
	Linux,
	Windows
}

enum class BrowserType {
	CHROME,
	FIREFOX,
	EDGE,
	SAFARI,
	ANDROID,
	OPERA,
	OTHER
}

enum class DeviceType {
	IPHONE,
	IPAD,
	ANDROID,
	DESKTOP,
	OTHER_MOBILE
}

data class BrowserData(needsMicrotaskHack: bool, needsExplicitIDBIds: bool, indexedDbSupported: bool, clientPlatform: ClientPlatform)

const val companyTeamLabel = 

NOT SUPPORTED