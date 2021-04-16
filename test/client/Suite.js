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
import "./calendar/AlarmSchedulerTest"
import "./support/FaqModelTest"
import "./search/PlainTextSearchTest"
import "./gui/base/WizardDialogNTest"
import "./calendar/CalendarEventViewModelTest"
import "./gui/ColorTest"
import "./mail/SendMailModelTest"
import "./common/OutOfOfficeNotificationTest"
import "./subscription/SubscriptionUtilsTest"
import "./subscription/SwitchSubscriptionDialogModelTest"
import "./mail/TemplateSearchFilterTest"
import "./mail/KnowledgeBaseSearchFilterTest"
import "./mail/export/ExporterTest"
import "./mail/export/BundlerTest"
import "./common/utils/FileUtilsTest"
import "./gui/GuiUtilsTest"
import "./misc/ParserTest"
import "./templates/TemplateEditorModelTest"
import "./misc/SchedulerTest"
import o from "ospec"
import {random} from "../../src/api/worker/crypto/Randomizer"
import {EntropySrc} from "../../src/api/common/TutanotaConstants"
import {preTest, reportTest} from "../api/TestUtils"

(async () => {
	if (typeof process != "undefined") {
		// setup the Entropy for all testcases
		random.addEntropy([{data: 36, entropy: 256, source: EntropySrc.key}])
		await import("./desktop/PathUtilsTest.js")
		await import("./desktop/config/migrations/DesktopConfigMigratorTest")
		await import("./desktop/ElectronUpdaterTest")
		await import("./desktop/DesktopNotifierTest")
		await import("./desktop/ApplicationWindowTest.js")
		await import("./desktop/sse/DesktopSseClientTest.js")
		await import("./desktop/sse/DesktopAlarmStorageTest.js")
		await import("./desktop/sse/DesktopAlarmSchedulerTest.js")
		await import("./desktop/DesktopDownloadManagerTest.js")
		await import("./desktop/IPCTest.js")
		await import("./desktop/SocketeerTest.js")
		await import("./desktop/integration/DesktopIntegratorTest.js")
		await import("./desktop/DesktopCryptoFacadeTest.js")
		await import("./desktop/DesktopContextMenuTest.js")
		await import("./desktop/DeviceKeyProviderTest.js")
	}

	preTest()
	o.run(reportTest)
})()




