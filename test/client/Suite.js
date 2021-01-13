import "./contact/VCardExporterTest"
import "./contact/VCardImporterTest"
import "./common/ClientDetectorTest"
import "./common/LanguageViewModelTest"
import "./common/FormatterTest"
import "./common/UrlifierTest"
import "./common/PasswordUtilsTest"
import "./gui/animation/AnimationsTest"
import "./gui/base/ButtonTest"
import "./gui/base/ListTest"
import "./common/EntropyCollectorTest"
import "./common/HtmlSanitizerTest"
import "./mail/InboxRuleHandlerTest"
import "./mail/MailUtilsTest"
import "./mail/MailUtilsSignatureTest"
import "./mail/MailModelTest"
import "./misc/U2fClientTest"
import "./contact/ContactUtilsTest"
import "./contact/ContactMergeUtilsTest"
import "./calendar/CalendarModelTest"
import "./calendar/CalendarUtilsTest"
import "./calendar/CalendarParserTest"
import "./calendar/CalendarImporterTest"
import "./support/FaqModelTest"
import "./search/PlainTextSearchTest"
import "./gui/base/WizardDialogNTest"
import "./calendar/CalendarEventViewModelTest"
import "./gui/ColorTest"
import "./mail/SendMailModelTest"
import o from "ospec/ospec.js"

node(() => {
	require("./desktop/DesktopUtilsTest.js")
	require("./desktop/DesktopConfigTest")
	require("./desktop/config/migrations/DesktopConfigMigratorTest")
	require("./desktop/ElectronUpdaterTest")
	require("./desktop/DesktopNotifierTest")
	require("./desktop/DesktopWindowManagerTest.js")
	require("./desktop/DesktopTrayTest.js")
	require("./desktop/ApplicationWindowTest.js")
	require("./desktop/sse/DesktopSseClientTest.js")
	require("./desktop/sse/DesktopAlarmStorageTest.js")
	require("./desktop/sse/DesktopAlarmSchedulerTest.js")
	require("./desktop/DesktopDownloadManagerTest.js")
	require("./desktop/IPCTest.js")
	require("./desktop/SocketeerTest.js")
	require("./desktop/integration/DesktopIntegratorTest.js")
	require("./desktop/DesktopCryptoFacadeTest.js")
	require("./desktop/DesktopContextMenuTest.js")
})()
o.run()


