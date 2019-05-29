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
import "./mail/MailModelTest"
import "./misc/U2fClientTest"
import "./contact/ContactUtilsTest"
import "./contact/ContactMergeUtilsTest"
import "./calendar/CalendarModelTest"

import o from "ospec/ospec.js"

node(() => {
	require("./desktop/DesktopUtilsTest.js")
	require("./desktop/DesktopConfigHandlerTest")
	require("./desktop/ElectronUpdaterTest")
	require("./desktop/DesktopNotifierTest")
	require("./desktop/DesktopWindowManagerTest.js")
	require("./desktop/DesktopTrayTest.js")
	require("./desktop/ApplicationWindowTest.js")
})()

o.run()


