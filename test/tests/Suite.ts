import o from "ospec"

import "./api/worker/facades/LoginFacadeTest.js"
import "./api/common/utils/LoggerTest.js"
import "./api/common/utils/BirthdayUtilsTest.js"
import "./api/worker/rest/EntityRestClientTest.js"
import "./api/worker/crypto/CryptoFacadeTest.js"
import "./api/worker/crypto/OwnerEncSessionKeysUpdateQueueTest.js"
import "./api/worker/crypto/CompatibilityTest.js"
import "./api/common/error/RestErrorTest.js"
import "./api/common/error/TutanotaErrorTest.js"
import "./api/worker/rest/RestClientTest.js"
import "./api/worker/rest/EntityRestCacheTest.js"
import "./api/worker/rest/EphemeralCacheStorageTest.js"
import "./api/worker/EventBusClientTest.js"
import "./api/worker/search/TokenizerTest.js"
import "./api/worker/search/IndexerTest.js"
import "./api/worker/search/IndexerCoreTest.js"
import "./api/worker/search/ContactIndexerTest.js"
import "./api/worker/search/GroupInfoIndexerTest.js"
import "./api/worker/search/MailIndexerTest.js"
import "./api/worker/search/IndexUtilsTest.js"
import "./api/worker/search/SearchFacadeTest.js"
import "./api/worker/search/SuggestionFacadeTest.js"
import "./api/worker/search/SearchIndexEncodingTest.js"
import "./serviceworker/SwTest.js"
import "./api/worker/search/EventQueueTest.js"
import "./api/worker/facades/MailFacadeTest.js"
import "./api/worker/facades/CalendarFacadeTest.js"
import "./api/worker/facades/UserFacadeTest.js"
import "./api/worker/SuspensionHandlerTest.js"
import "./api/worker/facades/ConfigurationDbTest.js"
import "./api/worker/CompressionTest.js"
import "./api/common/utils/PlainTextSearchTest.js"
import "./api/common/utils/EntityUtilsTest.js"
import "./api/worker/rest/CborDateEncoderTest.js"
import "./api/worker/facades/BlobFacadeTest.js"
import "./api/worker/facades/BlobAccessTokenFacadeTest.js"
import "./api/worker/utils/SleepDetectorTest.js"
import "./api/worker/rest/ServiceExecutorTest.js"
import "./api/worker/rest/CacheStorageProxyTest.js"
import "./contacts/VCardExporterTest.js"
import "./contacts/VCardImporterTest.js"
import "./misc/ClientDetectorTest.js"
import "./misc/LanguageViewModelTest.js"
import "./misc/FormatterTest.js"
import "./api/worker/UrlifierTest.js"
import "./misc/PasswordUtilsTest.js"
import "./gui/animation/AnimationsTest.js"
import "./gui/base/ListTest.js"
import "./gui/ThemeControllerTest.js"
import "./api/main/EntropyCollectorTest.js"
import "./misc/HtmlSanitizerTest.js"
import "./mail/InboxRuleHandlerTest.js"
import "./mail/MailUtilsSignatureTest.js"
import "./mail/MailModelTest.js"
import "./mail/model/MailUtilsTest.js"
import "./contacts/ContactUtilsTest.js"
import "./contacts/ContactMergeUtilsTest.js"
import "./calendar/CalendarModelTest.js"
import "./calendar/CalendarUtilsTest.js"
import "./calendar/CalendarParserTest.js"
import "./calendar/CalendarImporterTest.js"
import "./calendar/AlarmSchedulerTest.js"
import "./support/FaqModelTest.js"
import "./gui/base/WizardDialogNTest.js"
import "./calendar/CalendarEventViewModelTest.js"
import "./gui/ColorTest.js"
import "./mail/SendMailModelTest.js"
import "./misc/OutOfOfficeNotificationTest.js"
import "./subscription/SubscriptionUtilsTest.js"
import "./subscription/SwitchSubscriptionDialogModelTest.js"
import "./subscription/PriceUtilsTest.js"
import "./subscription/CreditCardViewModelTest.js"
import "./mail/TemplateSearchFilterTest.js"
import "./mail/KnowledgeBaseSearchFilterTest.js"
import "./mail/export/ExporterTest.js"
import "./mail/export/BundlerTest.js"
import "./api/common/utils/FileUtilsTest.js"
import "./gui/GuiUtilsTest.js"
import "./misc/ParserTest.js"
import "./settings/TemplateEditorModelTest.js"
import "./settings/UserDataExportTest.js"
import "./settings/login/secondfactor/SecondFactorEditModelTest.js"
import "./misc/SchedulerTest.js"
import "./misc/parsing/MailAddressParserTest.js"
import "./misc/FormatValidatorTest.js"
import "./settings/whitelabel/CustomColorEditorTest.js"
import "./login/LoginViewModelTest.js"
import "./misc/credentials/CredentialsProviderTest.js"
import "./misc/DeviceConfigTest.js"
import "./calendar/EventDragHandlerTest.js"
import "./calendar/CalendarGuiUtilsTest.js"
import "./calendar/CalendarViewModelTest.js"
import "./misc/credentials/NativeCredentialsEncryptionTest.js"
import "./misc/credentials/CredentialsKeyProviderTest.js"
import "./misc/webauthn/WebauthnClientTest.js"
import "./translations/TranslationKeysTest.js"
import "./misc/UsageTestModelTest.js"
import "./misc/NewsModelTest.js"
import "./file/FileControllerTest.js"
import "./api/worker/rest/CustomCacheHandlerTest.js"
import "./misc/RecipientsModelTest.js"
import "./api/worker/facades/MailAddressFacadeTest.js"
import "./mail/model/FolderSystemTest.js"
import * as td from "testdouble"
import { random } from "@tutao/tutanota-crypto"
import { Mode } from "../../src/api/common/Env.js"
import { assertNotNull, neverNull } from "@tutao/tutanota-utils"

await setupSuite()

preTest()

// @ts-ignore
o.run(reportTest)

async function setupSuite() {
	const { WorkerImpl } = await import("../../src/api/worker/WorkerImpl.js")
	globalThis.testWorker = WorkerImpl

	if (typeof process != "undefined") {
		if (process.argv.includes("-i")) {
			console.log("\nRunning with integration tests because was run with -i\n")
			await import("./api/main/WorkerTest.js")
			await import("./IntegrationTest.js")
		} else {
			console.log("\nRunning without integration tests because run without -i\n")
		}
	}

	if (typeof process != "undefined") {
		// setup the Entropy for all testcases
		await random.addEntropy([{ data: 36, entropy: 256, source: "key" }])
		await import("./desktop/PathUtilsTest.js")
		await import("./desktop/DesktopUtilsTest.js")
		await import("./desktop/config/migrations/DesktopConfigMigratorTest.js")
		await import("./desktop/ElectronUpdaterTest.js")
		await import("./desktop/DesktopNotifierTest.js")
		await import("./desktop/ApplicationWindowTest.js")
		await import("./desktop/sse/DesktopSseClientTest.js")
		await import("./desktop/sse/DesktopAlarmStorageTest.js")
		await import("./desktop/sse/DesktopAlarmSchedulerTest.js")
		await import("./desktop/net/DesktopDownloadManagerTest.js")
		await import("./desktop/net/ProtocolProxyTest.js")
		await import("./desktop/SocketeerTest.js")
		await import("./desktop/integration/DesktopIntegratorTest.js")
		await import("./desktop/integration/RegistryScriptGeneratorTest.js")
		await import("./desktop/DesktopCryptoFacadeTest.js")
		await import("./desktop/DesktopContextMenuTest.js")
		await import("./desktop/KeyStoreFacadeTest.js")
		await import("./desktop/config/ConfigFileTest.js")
		await import("./desktop/db/OfflineDbFacadeTest.js")
		await import("./desktop/credentials/DesktopCredentialsEncryptionTest.js")
		await import("./api/worker/offline/OfflineStorageMigratorTest.js")
		await import("./api/worker/offline/OfflineStorageMigrationsTest.js")
		await import("./api/worker/offline/OfflineStorageTest.js")
		await import("./mail/view/CoversationViewModelTest.js")
	}

	// testdouble complains about certain mocking related code smells, and also prints a warning whenever you replace a property on an object.
	// it's very very noisy, so we turn it off
	td.config({
		ignoreWarnings: true,
	})

	o.before(async function () {
		// setup the Entropy for all testcases
		await random.addEntropy([{ data: 36, entropy: 256, source: "key" }])
	})

	o.afterEach(function () {
		td.reset()
		// Reset env.mode in case any tests have fiddled with it
		env.mode = Mode.Test
	})
}

export function preTest() {
	if (globalThis.isBrowser) {
		const p = document.createElement("p")
		p.id = "report"
		p.style.fontWeight = "bold"
		p.style.fontSize = "30px"
		p.style.fontFamily = "sans-serif"
		p.textContent = "Running tests..."
		neverNull(document.body).appendChild(p)
	}
}

export function reportTest(results: any, stats: any) {
	// @ts-ignore
	const errCount = o.report(results, stats)
	if (typeof process != "undefined" && errCount !== 0) process.exit(1) // eslint-disable-line no-process-exit
	if (globalThis.isBrowser) {
		const p = assertNotNull(document.getElementById("report"))
		// errCount includes bailCount
		p.textContent = errCount === 0 ? "No errors" : `${errCount} error(s) (see console)`
		p.style.color = errCount === 0 ? "green" : "red"
	}
}
