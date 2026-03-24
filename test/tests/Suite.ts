import o from "@tutao/otest"
import "./misc/WebsocketConnectivityModelTest"
import "./api/common/error/RestErrorTest"
import "./api/common/error/TutanotaErrorTest"
import "./api/common/mail/CommonMailUtilsTest"
import "./api/common/utils/BirthdayUtilsTest"
import "./api/common/utils/CommonFormatterTest"
import "./api/common/utils/EntityUtilsTest"
import "./api/common/EntityFunctionsTest"
import "./api/common/utils/FileUtilsTest"
import "./api/common/utils/LoggerTest"
import "./api/common/utils/PlainTextSearchTest"
import "./api/main/EntropyCollectorTest"
import "./api/main/SyncTrackerTest"
import "./api/worker/CompressionTest"
import "./api/worker/EventBusClientTest"
import "./api/worker/EventBusEventCoordinatorTest"
import "./api/worker/SuspensionHandlerTest"
import "./api/worker/UrlifierTest"
import "./api/worker/crypto/AsymmetricCryptoFacadeTest"
import "./api/worker/crypto/CompatibilityTest"
import "./api/worker/crypto/CryptoMapperTest"
import "./api/worker/crypto/CryptoFacadeTest"
import "./api/worker/crypto/CryptoWrapperTest"
import "./api/worker/crypto/EntityAdapterTest"
import "./api/worker/crypto/ModelMapperTest"
import "./api/worker/crypto/ModelMapperTransformationsTest"
import "./api/worker/crypto/TypeMapperTest"
import "./api/worker/facades/ApplicationTypesFacadeTest"
import "./api/worker/facades/BlobAccessTokenFacadeTest"
import "./api/worker/facades/BlobFacadeTest"
import "./api/worker/facades/CalendarFacadeTest"
import "./api/worker/facades/ConfigurationDbTest"
import "./api/worker/facades/ContactFacadeTest"
import "./api/worker/facades/DriveFacadeTest"
import "./api/worker/facades/GroupManagementFacadeTest"
import "./api/worker/facades/AdminKeyLoaderFacadeTest"
import "./api/worker/facades/IdentityKeyCreatorTest"
import "./api/worker/facades/KeyAuthenticationFacadeTest"
import "./api/worker/facades/KeyCacheTest"
import "./api/worker/facades/KeyLoaderFacadeTest"
import "./api/worker/facades/KeyRotationFacadeTest"
import "./api/worker/facades/KyberFacadeTest"
import "./api/worker/facades/LoginFacadeTest"
import "./api/worker/facades/MailAddressFacadeTest"
import "./api/worker/facades/CustomerFacadeTest"
import "./api/worker/facades/MailExportFacadeTest"
import "./api/worker/facades/MailExportTokenFacadeTest"
import "./api/worker/facades/MailFacadeTest"
import "./api/worker/facades/PQFacadeTest"
import "./api/worker/facades/PQMessageTest"
import "./api/worker/facades/PublicEncryptionKeyProviderTest"
import "./api/worker/facades/PublicEncryptionKeyCacheTest"
import "./api/worker/facades/PublicIdentityKeyProviderTest"
import "./api/worker/facades/IdentityKeyTrustDatabaseTest"
import "./api/worker/facades/RolloutFacadeTest"
import "./api/worker/facades/RsaPqPerformanceTest"
import "./api/worker/facades/UserFacadeTest"
import "./api/worker/facades/PublicKeySignatureFacadeTest"
import "./api/worker/facades/InstanceSessionKeysCacheTest"
import "./api/worker/invoicegen/PdfInvoiceGeneratorTest"
import "./api/worker/invoicegen/XRechnungInvoiceGeneratorTest"
import "./api/worker/pdf/DeflaterTest"
import "./api/worker/pdf/PdfDocumentTest"
import "./api/worker/pdf/PdfObjectTest"
import "./api/worker/pdf/PdfWriterTest"
import "./api/worker/rest/CacheStorageProxyTest"
import "./api/worker/rest/CborDateEncoderTest"
import "./api/worker/rest/CustomCacheHandlerTest"
import "./api/worker/rest/EntityRestCacheTest"
import "./api/worker/rest/EntityRestClientTest"
import "./api/worker/rest/EphemeralCacheStorageTest"
import "./api/worker/rest/PatchGeneratorTest"
import "./api/worker/rest/ServiceExecutorTest"
import "./api/worker/search/BulkMailLoaderTest"
import "./api/worker/search/ContactIndexerTest"
import "./api/worker/search/EventQueueTest"
import "./api/worker/search/IndexUtilsTest"
import "./api/worker/search/IndexerCoreTest"
import "./api/worker/search/IndexedDbIndexerTest"
import "./api/worker/search/MailIndexerTest"
import "./api/worker/search/IndexedDbMailIndexerBackendTest"
import "./api/worker/search/IndexedDbSearchFacadeTest"
import "./api/worker/search/SearchIndexEncodingTest"
import "./api/worker/search/SuggestionFacadeTest"
import "./serviceworker/SwTest"
import "./api/worker/facades/KeyVerificationFacadeTest"
import "./api/worker/utils/SleepDetectorTest"
import "./api/worker/utils/spamClassification/HashingVectorizerTest"
import "./api/worker/utils/spamClassification/SpamClassifierDataDealerTest"
import "./api/worker/utils/spamClassification/PreprocessPatternsTest"
import "./calendar/AlarmSchedulerTest"
import "./calendar/CalendarAgendaViewTest"
import "./calendar/CalendarGuiUtilsTest"
import "./calendar/CalendarImporterTest"
import "./calendar/CalendarInvitesTest"
import "./calendar/CalendarModelTest"
import "./calendar/CalendarEventUpdateCoordinatorTest"
import "./calendar/gui/ImportExportUtilsTest"
import "./calendar/CalendarParserTest"
import "./calendar/CalendarUtilsTest"
import "./calendar/CalendarViewModelTest"
import "./calendar/EventDragHandlerTest"
import "./calendar/eventeditor/CalendarEventAlarmModelTest"
import "./calendar/eventeditor/CalendarEventModelTest"
import "./calendar/eventeditor/CalendarEventWhenModelTest"
import "./calendar/eventeditor/CalendarEventWhoModelTest"
import "./calendar/eventeditor/CalendarNotificationModelTest"
import "./calendar/CalendarEventsRepositoryTest"
import "./contacts/ContactListEditorTest"
import "./contacts/ContactMergeUtilsTest"
import "./contacts/ContactUtilsTest"
import "./contacts/VCardExporterTest"
import "./contacts/VCardImporterTest"
import "./drive/DriveViewModelTest"
import "./file/FileControllerTest"
import "./gui/ColorTest"
import "./gui/GuiUtilsTest"
import "./gui/ScopedRouterTest"
import "./gui/ThemeControllerTest"
import "./gui/animation/AnimationsTest"
import "./gui/base/QrCodeScannerTest"
import "./gui/base/WizardDialogNTest"
import "./login/LoginViewModelTest"
import "./login/PostLoginUtilsTest"
import "./mail/InboxRuleHandlerTest"
import "./mail/ProcessInboxHandlerTest"
import "./mail/KnowledgeBaseSearchFilterTest"
import "./mail/MailModelTest"
import "./mail/MailUtilsSignatureTest"
import "./mail/SendMailModelTest"
import "./mail/TemplateSearchFilterTest"
import "./mail/export/BundlerTest"
import "./mail/export/ExporterTest"
import "./mail/model/ConversationListModelTest"
import "./mail/model/FolderSystemTest"
import "./mail/model/MailListModelTest"
import "./mail/view/ConversationViewModelTest"
import "./mail/view/MailViewModelTest"
import "./mail/view/MailViewerViewModelTest"
import "./misc/ClientDetectorTest"
import "./misc/DeviceConfigTest"
import "./misc/FormatValidatorTest"
import "./misc/FormatterTest"
import "./misc/HtmlSanitizerTest"
import "./misc/UserSatisfactionDialogTests"
import "./misc/RecipientKeyVerificationRecoveryModelTest"
import "./misc/LanguageViewModelTest"
import "./misc/ListElementListModelTest"
import "./misc/ListModelTest"
import "./misc/NewsModelTest"
import "./misc/OutOfOfficeNotificationTest"
import "./misc/ParserTest"
import "./misc/PasswordGeneratorTest"
import "./misc/PasswordModelTest"
import "./misc/PasswordUtilsTest"
import "./misc/RecipientsModelTest"
import "./misc/SchedulerTest"
import "./misc/UsageTestModelTest"
import "./misc/credentials/CredentialsProviderTest"
import "./misc/news/items/ReferralLinkNewsTest"
import "./misc/parsing/MailAddressParserTest"
import "./misc/webauthn/WebauthnClientTest"
import "./native/main/MailExportControllerTest"
import "./settings/TemplateEditorModelTest"
import "./settings/UserDataExportTest"
import "./settings/login/secondfactor/SecondFactorEditModelTest"
import "./settings/mailaddress/MailAddressTableModelTest"
import "./settings/whitelabel/CustomColorEditorViewModelTest"
import "./settings/keymanagement/KeyVerificationModelTest"
import "./subscription/CreditCardViewModelTest"
import "./subscription/PriceUtilsTest"
import "./subscription/SignupFormTest"
import "./subscription/CaptchaTest"
import "./subscription/SubscriptionUtilsTest"
import "./support/FaqModelTest"
import "./translations/TranslationKeysTest"
import "./api/worker/search/IndexedDbContactIndexerBackendTest"
import "./api/worker/search/IndexedDbContactSearchFacadeTest"
import "./api/worker/search/OfflineStorageContactIndexerBackendTest"
import "./api/worker/search/OfflineStorageContactSearchFacadeTest"
import "./api/worker/rest/CustomUserCacheHandlerTest"
import "./api/common/utils/QueryTokenUtilsTest"
import "./api/worker/offline/PatchMergerTest"
import "./contacts/ContactModelTest"
import "./api/worker/search/OfflinestorageIndexerTest"
import "./api/worker/EventInstancePrefetcherTest"
import "./misc/parsing/ParserCombinatorTest"
import "./sharing/GroupSettingsModelTest"
import "./mail/editor/OpenLocallySavedDraftActionTest"
import "./mail/SpamClassificationHandlerTest"
import "./misc/quickactions/QuickActionsModelTest"
import "./calendar/CalendarTimeGridTest"
import "./calendar/AllDaySectionTest"
import "./mail/view/LabelsPopupViewModelTest"
import "./settings/NotificationSettingsViewerModelTest"
import "./crypto/Suite"
import "./licc/Suite"
import "./usagetests/Suite"
import * as td from "testdouble"
import { Mode } from "../../src/common/api/common/Env"

export async function run({ integration, filter }: { integration?: boolean; filter?: string } = {}) {
	await setupSuite({ integration })
	const result = await o.run({ filter })

	o.printReport(result)

	return result
}

async function setupSuite({ integration }: { integration?: boolean }) {
	const { random } = await import("@tutao/crypto")
	const { WorkerImpl } = await import("../../src/mail-app/workerUtils/worker/WorkerImpl")
	globalThis.testWorker = WorkerImpl

	if (typeof process !== "undefined") {
		if (integration) {
			console.log("\nRunning with integration tests because was run with -i\n")
			await import("./api/main/WorkerTest")
			await import("./IntegrationTest")
		} else {
			console.log("\nRunning without integration tests because run without -i\n")
		}
	}

	if (typeof process !== "undefined") {
		// setup the Entropy for all testcases

		await random.addEntropy([{ data: 36, entropy: 256, source: "key" }])

		await import("./api/worker/utils/spamClassification/SparseVectorCompressorTest")
		await import("./api/worker/utils/spamClassification/SpamMailProcessorTest")
		await import("./api/worker/utils/spamClassification/SpamClassifierTest")
		await import("./api/worker/offline/OfflineStorageMigratorTest")
		await import("./api/worker/offline/OfflineStorageTest")
		await import("./api/worker/rest/RestClientTest")
		await import("./desktop/ApplicationWindowTest")
		await import("./desktop/DesktopContextMenuTest")
		await import("./desktop/DesktopCryptoFacadeTest")
		await import("./desktop/DesktopKeyStoreFacadeTest")
		await import("./desktop/notifications/DesktopNotifierTest")
		await import("./desktop/CommandExecutorTest")
		await import("./desktop/notifications/WindowsNotificationFactoryTest")
		await import("./desktop/ElectronUpdaterTest")
		await import("./desktop/PathUtilsTest")
		await import("./desktop/SocketeerTest")
		await import("./desktop/config/ConfigFileTest")
		await import("./desktop/config/DesktopConfigTest")
		await import("./desktop/DesktopUtilsTest")
		await import("./desktop/config/migrations/DesktopConfigMigratorTest")
		await import("./desktop/credentials/AppPassHandlerTest")
		await import("./desktop/credentials/DesktopCredentialsStorageTest")
		await import("./desktop/credentials/DesktopNativeCredentialsFacadeTest")
		await import("./desktop/credentials/KeychainEncryptionTest")
		await import("./desktop/db/OfflineDbFacadeTest")
		await import("./desktop/export/DesktopExportFacadeTest")
		await import("./desktop/files/DesktopFileFacadeTest")
		await import("./desktop/files/TempFsTest")
		await import("./desktop/files/TempFsTest")
		await import("./desktop/integration/DesktopIntegratorTest")
		await import("./desktop/integration/WindowsRegistryFacadeTest")
		await import("./desktop/integration/RegistryScriptGeneratorTest")
		await import("./desktop/net/ProtocolProxyTest")
		await import("./desktop/sse/DesktopAlarmSchedulerTest")
		await import("./desktop/sse/DesktopAlarmStorageTest")
		await import("./desktop/sse/SecretStorageTest")
		await import("./desktop/sse/SseClientTest")
		await import("./desktop/sse/TutaNotificationHandlerTest")
		await import("./desktop/sse/TutaSseFacadeTest")
		await import("./api/worker/search/OfflineStorageMailIndexerBackendTest")
		await import("./api/worker/search/OfflineStoragePersistenceTest")
		await import("./api/worker/search/OfflineStorageSearchFacadeTest")
		await import("./api/worker/facades/OfflineStorageAutosaveFacadeTest")
		await import("./api/worker/facades/OfflineStorageSpamClassifierStorageFacadeTest")
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
