/* Generated file. timestamp: 2::1780384965019*/
import org.tutao.Env.assertMainOrNodeBoot;
import org.tutao.ClientDetector.ClientPlatform;
assertMainOrNodeBoot();

public enum ErrorReportClientType { Browser, Android, Ios, MacOS, Linux, Windows }
public enum BrowserType { CHROME, FIREFOX, EDGE, SAFARI, ANDROID, OPERA, OTHER }
public enum DeviceType { IPHONE, IPAD, ANDROID, DESKTOP, OTHER_MOBILE }
public data class BrowserData(needsMicrotaskHack: Boolean, needsExplicitIDBIds: Boolean, indexedDbSupported: Boolean, clientPlatform: ClientPlatform)
const val companyTeamLabel: String = "Tuta Team";

