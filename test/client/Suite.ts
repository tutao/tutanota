import "./contact/VCardExporterTest"
import "./contact/VCardImporterTest"
import "./common/ClientDetectorTest"
import "./common/LanguageViewModelTest"
import "./common/FormatterTest"
import "./common/UrlifierTest"
import "./common/PasswordUtilsTest"
import "./gui/animation/AnimationsTest"
import "./gui/base/ListTest"
import "./gui/ThemeControllerTest"
import "./common/EntropyCollectorTest"
import "./common/HtmlSanitizerTest"
import "./mail/InboxRuleHandlerTest"
import "./mail/MailUtilsTest"
import "./mail/MailUtilsSignatureTest"
import "./mail/MailModelTest"
import "./contact/ContactUtilsTest"
import "./contact/ContactMergeUtilsTest"
import "./calendar/CalendarModelTest"
import "./calendar/CalendarUtilsTest"
import "./calendar/CalendarParserTest"
import "./calendar/CalendarImporterTest"
import "./calendar/AlarmSchedulerTest"
import "./support/FaqModelTest"
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
import "./subscription/PriceUtilsTest"
import "./misc/parsing/MailAddressParserTest"
import "./misc/FormatValidatorTest"
import "./whitelabel/CustomColorEditorTest"
import "./login/LoginViewModelTest"
import "./misc/credentials/CredentialsProviderTest"
import "./misc/DeviceConfigTest"
import "./calendar/EventDragHandlerTest"
import "./calendar/CalendarGuiUtilsTest"
import "./calendar/CalendarViewModelTest"
import "./misc/credentials/NativeCredentialsEncryptionTest"
import "./misc/credentials/CredentialsKeyProviderTest"
import "./misc/credentials/CredentialsMigrationTest"
import "./misc/webauthn/WebauthnClientTest.js"
import "./common/TranslationKeysTest"
import "./misc/UsageTestModelTest.js"
import "./file/FileControllerTest.js"
import o from "ospec"
import {preTest, reportTest} from "../api/TestUtils"
import * as td from "testdouble"
import {random} from "@tutao/tutanota-crypto"

(async () => {
	if (typeof process != "undefined") {
		// setup the Entropy for all testcases
		await random.addEntropy([{data: 36, entropy: 256, source: "key"}])
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
		await import("./desktop/integration/RegistryScriptGeneratorTest.js")
		await import("./desktop/DesktopCryptoFacadeTest.js")
		await import("./desktop/DesktopContextMenuTest.js")
		await import("./desktop/KeyStoreFacadeTest.js")
		await import ("./desktop/config/ConfigFileTest.js")
		await import("./desktop/db/OfflineDbTest")
		await import ("./desktop/credentials/DesktopCredentialsEncryptionTest")
	}

	o.before(function () {
		// testdouble complains about certain mocking related code smells, and also prints a warning whenever you replace a property on an object.
		// it's very very noisy, so we turn it off
		td.config({
			ignoreWarnings: true
		})
	})

	o.afterEach(function () {
		td.reset()
	})

	preTest()
	// @ts-ignore
	o.run(reportTest)
})()




