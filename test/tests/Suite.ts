import o from "@tutao/otest"

import "./api/common/error/RestErrorTest.js"
import "./api/common/error/TutanotaErrorTest.js"
import "./api/common/mail/CommonMailUtilsTest.js"
import "./api/common/utils/BirthdayUtilsTest.js"
import "./api/common/utils/CommonFormatterTest.js"
import "./api/common/utils/EntityUtilsTest.js"
import "./api/common/EntityFunctionsTest.js"
import "./api/common/utils/FileUtilsTest.js"
import "./api/common/utils/LoggerTest.js"
import "./api/common/utils/PlainTextSearchTest.js"
import "./api/main/EntropyCollectorTest.js"
import "./api/worker/CompressionTest.js"
import "./api/worker/EventBusClientTest.js"
import "./api/worker/EventBusEventCoordinatorTest.js"
import "./api/worker/SuspensionHandlerTest.js"
import "./api/worker/UrlifierTest.js"
import "./api/worker/crypto/AsymmetricCryptoFacadeTest.js"
import "./api/worker/crypto/CompatibilityTest.js"
import "./api/worker/crypto/CryptoMapperTest.js"
import "./api/worker/crypto/CryptoFacadeTest.js"
import "./api/worker/crypto/CryptoWrapperTest.js"
import "./api/worker/crypto/EntityAdapterTest.js"
import "./api/worker/crypto/ModelMapperTest.js"
import "./api/worker/crypto/ModelMapperTransformationsTest.js"
import "./api/worker/crypto/OwnerEncSessionKeysUpdateQueueTest.js"
import "./api/worker/crypto/TypeMapperTest.js"
import "./api/worker/facades/ApplicationTypesFacadeTest.js"
import "./api/worker/facades/BlobAccessTokenFacadeTest.js"
import "./api/worker/facades/BlobFacadeTest.js"
import "./api/worker/facades/CalendarFacadeTest.js"
import "./api/worker/facades/ConfigurationDbTest.js"
import "./api/worker/facades/ContactFacadeTest.js"
import "./api/worker/facades/GroupManagementFacadeTest.js"
import "./api/worker/facades/AdminKeyLoaderFacadeTest.js"
import "./api/worker/facades/IdentityKeyCreatorTest.js"
import "./api/worker/facades/KeyAuthenticationFacadeTest.js"
import "./api/worker/facades/KeyCacheTest.js"
import "./api/worker/facades/KeyLoaderFacadeTest.js"
import "./api/worker/facades/KeyRotationFacadeTest.js"
import "./api/worker/facades/KyberFacadeTest.js"
import "./api/worker/facades/LoginFacadeTest.js"
import "./api/worker/facades/MailAddressFacadeTest.js"
import "./api/worker/facades/MailExportFacadeTest.js"
import "./api/worker/facades/MailExportTokenFacadeTest.js"
import "./api/worker/facades/MailFacadeTest.js"
import "./api/worker/facades/PQFacadeTest.js"
import "./api/worker/facades/PQMessageTest.js"
import "./api/worker/facades/PublicEncryptionKeyProviderTest.js"
import "./api/worker/facades/PublicIdentityKeyProviderTest.js"
import "./api/worker/facades/IdentityKeyTrustDatabaseTest.js"
import "./api/worker/facades/RolloutFacadeTest.js"
import "./api/worker/facades/RsaPqPerformanceTest.js"
import "./api/worker/facades/UserFacadeTest.js"
import "./api/worker/facades/PublicKeySignatureFacadeTest.js"
import "./api/worker/invoicegen/PdfInvoiceGeneratorTest.js"
import "./api/worker/invoicegen/XRechnungInvoiceGeneratorTest.js"
import "./api/worker/pdf/DeflaterTest.js"
import "./api/worker/pdf/PdfDocumentTest.js"
import "./api/worker/pdf/PdfObjectTest.js"
import "./api/worker/pdf/PdfWriterTest.js"
import "./api/worker/rest/CacheStorageProxyTest.js"
import "./api/worker/rest/CborDateEncoderTest.js"
import "./api/worker/rest/CustomCacheHandlerTest.js"
import "./api/worker/rest/EntityRestCacheTest.js"
import "./api/worker/rest/EntityRestClientTest.js"
import "./api/worker/rest/EphemeralCacheStorageTest.js"
import "./api/worker/rest/PatchGeneratorTest.js"
import "./api/worker/rest/ServiceExecutorTest.js"
import "./api/worker/search/BulkMailLoaderTest.js"
import "./api/worker/search/ContactIndexerTest.js"
import "./api/worker/search/EventQueueTest.js"
import "./api/worker/search/IndexUtilsTest.js"
import "./api/worker/search/IndexerCoreTest.js"
import "./api/worker/search/IndexedDbIndexerTest.js"
import "./api/worker/search/MailIndexerTest.js"
import "./api/worker/search/IndexedDbMailIndexerBackendTest.js"
import "./api/worker/search/IndexedDbSearchFacadeTest.js"
import "./api/worker/search/SearchIndexEncodingTest.js"
import "./api/worker/search/SuggestionFacadeTest.js"
import "./serviceworker/SwTest.js"
import "./api/worker/facades/KeyVerificationFacadeTest.js"
import "./api/worker/utils/SleepDetectorTest.js"
import "./api/worker/utils/spamClassification/HashingVectorizerTest.js"
import "./api/worker/utils/spamClassification/PreprocessPatternsTest.js"
import "./calendar/AlarmSchedulerTest.js"
import "./calendar/CalendarAgendaViewTest.js"
import "./calendar/CalendarGuiUtilsTest.js"
import "./calendar/CalendarImporterTest.js"
import "./calendar/CalendarInvitesTest.js"
import "./calendar/CalendarModelTest.js"
import "./calendar/CalendarParserTest.js"
import "./calendar/CalendarUtilsTest.js"
import "./calendar/CalendarViewModelTest.js"
import "./calendar/EventDragHandlerTest.js"
import "./calendar/eventeditor/CalendarEventAlarmModelTest.js"
import "./calendar/eventeditor/CalendarEventModelTest.js"
import "./calendar/eventeditor/CalendarEventWhenModelTest.js"
import "./calendar/eventeditor/CalendarEventWhoModelTest.js"
import "./calendar/eventeditor/CalendarNotificationModelTest.js"
import "./calendar/CalendarEventsRepositoryTest.js"
import "./contacts/ContactListEditorTest.js"
import "./contacts/ContactMergeUtilsTest.js"
import "./contacts/ContactUtilsTest.js"
import "./contacts/VCardExporterTest.js"
import "./contacts/VCardImporterTest.js"
import "./file/FileControllerTest.js"
import "./gui/ColorTest.js"
import "./gui/GuiUtilsTest.js"
import "./gui/ScopedRouterTest.js"
import "./gui/ThemeControllerTest.js"
import "./gui/animation/AnimationsTest.js"
import "./gui/base/WizardDialogNTest.js"
import "./login/LoginViewModelTest.js"
import "./login/PostLoginUtilsTest.js"
import "./mail/InboxRuleHandlerTest.js"
import "./mail/KnowledgeBaseSearchFilterTest.js"
import "./mail/MailModelTest.js"
import "./mail/MailUtilsSignatureTest.js"
import "./mail/SendMailModelTest.js"
import "./mail/TemplateSearchFilterTest.js"
import "./mail/export/BundlerTest.js"
import "./mail/export/ExporterTest.js"
import "./mail/model/ConversationListModelTest.js"
import "./mail/model/FolderSystemTest.js"
import "./mail/model/MailListModelTest.js"
import "./mail/view/ConversationViewModelTest.js"
import "./mail/view/MailViewModelTest.js"
import "./mail/view/MailViewerViewModelTest.js"
import "./misc/ClientDetectorTest.js"
import "./misc/DeviceConfigTest.js"
import "./misc/FormatValidatorTest.js"
import "./misc/FormatterTest.js"
import "./misc/HtmlSanitizerTest.js"
import "./misc/UserSatisfactionDialogTests.js"
import "./misc/RecipientKeyVerificationRecoveryModelTest.js"
import "./misc/LanguageViewModelTest.js"
import "./misc/ListElementListModelTest.js"
import "./misc/ListModelTest.js"
import "./misc/NewsModelTest.js"
import "./misc/OutOfOfficeNotificationTest.js"
import "./misc/ParserTest.js"
import "./misc/PasswordGeneratorTest.js"
import "./misc/PasswordModelTest.js"
import "./misc/PasswordUtilsTest.js"
import "./misc/RecipientsModelTest.js"
import "./misc/SchedulerTest.js"
import "./misc/UsageTestModelTest.js"
import "./misc/credentials/CredentialsProviderTest.js"
import "./misc/news/items/ReferralLinkNewsTest.js"
import "./misc/parsing/MailAddressParserTest.js"
import "./misc/webauthn/WebauthnClientTest.js"
import "./native/main/MailExportControllerTest.js"
import "./settings/TemplateEditorModelTest.js"
import "./settings/UserDataExportTest.js"
import "./settings/login/secondfactor/SecondFactorEditModelTest.js"
import "./settings/mailaddress/MailAddressTableModelTest.js"
import "./settings/whitelabel/CustomColorEditorViewModelTest.js"
import "./settings/keymanagement/KeyVerificationModelTest.js"
import "./subscription/CreditCardViewModelTest.js"
import "./subscription/PriceUtilsTest.js"
import "./subscription/SignupFormTest.js"
import "./subscription/CaptchaTest.js"
import "./subscription/SubscriptionUtilsTest.js"
import "./support/FaqModelTest.js"
import "./translations/TranslationKeysTest.js"
import "./api/worker/search/IndexedDbContactIndexerBackendTest.js"
import "./api/worker/search/IndexedDbContactSearchFacadeTest.js"
import "./api/worker/search/OfflineStorageContactIndexerBackendTest.js"
import "./api/worker/search/OfflineStorageContactSearchFacadeTest.js"
import "./api/worker/rest/CustomUserCacheHandlerTest.js"
import "./api/common/utils/QueryTokenUtilsTest.js"
import "./api/worker/offline/PatchMergerTest.js"
import "./contacts/ContactModelTest.js"
import "./api/worker/search/OfflinestorageIndexerTest.js"
import "./api/worker/EventInstancePrefetcherTest.js"
import "./misc/parsing/ParserCombinatorTest.js"
import "./sharing/GroupSettingsModelTest.js"
import "./mail/editor/OpenLocallySavedDraftActionTest.js"
import "./mail/SpamClassificationHandlerTest.js"
import "./misc/quickactions/QuickActionsModelTest.js"
import "./calendar/TimeViewTest"

import * as td from "testdouble"
import { random } from "@tutao/tutanota-crypto"
import { Mode } from "../../src/common/api/common/Env.js"

export async function run({ integration, filter }: { integration?: boolean; filter?: string } = {}) {
	await setupSuite({ integration })
	const result = await o.run({ filter })

	o.printReport(result)

	return result
}

async function setupSuite({ integration }: { integration?: boolean }) {
	const { WorkerImpl } = await import("../../src/mail-app/workerUtils/worker/WorkerImpl.js")
	globalThis.testWorker = WorkerImpl

	if (typeof process !== "undefined") {
		if (integration) {
			console.log("\nRunning with integration tests because was run with -i\n")
			await import("./api/main/WorkerTest.js")
			await import("./IntegrationTest.js")
		} else {
			console.log("\nRunning without integration tests because run without -i\n")
		}
	}

	if (typeof process !== "undefined") {
		// setup the Entropy for all testcases
		await random.addEntropy([{ data: 36, entropy: 256, source: "key" }])
		await import("./api/worker/utils/spamClassification/SpamClassifierTest.js")
		await import("./api/worker/offline/OfflineStorageMigratorTest.js")
		await import("./api/worker/offline/OfflineStorageTest.js")
		await import("./api/worker/rest/RestClientTest.js")
		await import("./desktop/ApplicationWindowTest.js")
		await import("./desktop/DesktopContextMenuTest.js")
		await import("./desktop/DesktopCryptoFacadeTest.js")
		await import("./desktop/DesktopKeyStoreFacadeTest.js")
		await import("./desktop/notifications/DesktopNotifierTest.js")
		await import("./desktop/CommandExecutorTest.js")
		await import("./desktop/notifications/WindowsNotificationFactoryTest.js")
		await import("./desktop/ElectronUpdaterTest.js")
		await import("./desktop/PathUtilsTest.js")
		await import("./desktop/SocketeerTest.js")
		await import("./desktop/config/ConfigFileTest.js")
		await import("./desktop/config/DesktopConfigTest.js")
		await import("./desktop/DesktopUtilsTest.js")
		await import("./desktop/config/migrations/DesktopConfigMigratorTest.js")
		await import("./desktop/credentials/AppPassHandlerTest.js")
		await import("./desktop/credentials/DesktopCredentialsStorageTest.js")
		await import("./desktop/credentials/DesktopNativeCredentialsFacadeTest.js")
		await import("./desktop/credentials/KeychainEncryptionTest.js")
		await import("./desktop/db/OfflineDbFacadeTest.js")
		await import("./desktop/export/DesktopExportFacadeTest.js")
		await import("./desktop/files/DesktopFileFacadeTest.js")
		await import("./desktop/files/TempFsTest.js")
		await import("./desktop/files/TempFsTest.js")
		await import("./desktop/integration/DesktopIntegratorTest.js")
		await import("./desktop/integration/WindowsRegistryFacadeTest.js")
		await import("./desktop/integration/RegistryScriptGeneratorTest.js")
		await import("./desktop/net/ProtocolProxyTest.js")
		await import("./desktop/sse/DesktopAlarmSchedulerTest.js")
		await import("./desktop/sse/DesktopAlarmStorageTest.js")
		await import("./desktop/sse/SecretStorageTest.js")
		await import("./desktop/sse/SseClientTest.js")
		await import("./desktop/sse/TutaNotificationHandlerTest.js")
		await import("./desktop/sse/TutaSseFacadeTest.js")
		await import("./api/worker/search/OfflineStorageMailIndexerBackendTest.js")
		await import("./api/worker/search/OfflineStoragePersistenceTest.js")
		await import("./api/worker/search/OfflineStorageSearchFacadeTest.js")
		await import("./api/worker/facades/OfflineStorageAutosaveFacadeTest.js")
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
