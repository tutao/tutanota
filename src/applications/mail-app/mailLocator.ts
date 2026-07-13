import {
	AppType,
	assertMainOrNode,
	Const,
	FeatureType,
	isAdminClient,
	isAndroidApp,
	isApp,
	isBrowser,
	isDesktop,
	isIOSApp,
	isTest,
	ProgrammingError,
} from "../../platform-kit/app-env"
import { EventController } from "../common/api/main/EventController.js"
import { SearchModel } from "./search/model/SearchModel.js"
import { type MailboxDetail, MailboxModel } from "../common/mailFunctionality/MailboxModel.js"
import { MinimizedMailEditorViewModel } from "./mail/model/MinimizedMailEditorViewModel.js"
import { ContactModel } from "../common/contactsFunctionality/ContactModel.js"
import { EntityClient } from "../../platform-kit/network/EntityClient.js"
import { ProgressTracker } from "../common/api/main/ProgressTracker.js"
import { CredentialsProvider } from "../common/misc/credentials/CredentialsProvider.js"
import { bootstrapWorker, WorkerClient } from "../common/api/main/WorkerClient.js"
import { FileController } from "../common/file/FileController.js"
import { SecondFactorHandler } from "../common/misc/2fa/SecondFactorHandler.js"
import { WebauthnClient } from "../common/misc/2fa/webauthn/WebauthnClient.js"
import { LoginFacade } from "../../platform-kit/base/facades/LoginFacade.js"
import { LoginController } from "../common/api/main/LoginController.js"
import { AppHeaderAttrs, Header } from "../../ui/Header.js"
import { CustomerFacade } from "../common/api/worker/facades/lazy/CustomerFacade.js"
import { GiftCardFacade } from "../common/api/worker/facades/lazy/GiftCardFacade.js"
import { GroupManagementFacade } from "../../platform-kit/base/facades/lazy/GroupManagementFacade.js"
import { ConfigurationDatabase } from "../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "../common/api/worker/facades/lazy/CalendarFacade.js"
import { MailFacade } from "../common/api/worker/facades/lazy/MailFacade.js"
import { ShareFacade } from "../../platform-kit/base/facades/lazy/ShareFacade.js"
import { CounterFacade } from "../../platform-kit/network/CounterFacade.js"
import { BookingFacade } from "../common/api/worker/facades/lazy/BookingFacade.js"
import { MailAddressFacade } from "../common/api/worker/facades/lazy/MailAddressFacade.js"
import { BlobFacade } from "../common/api/worker/facades/lazy/BlobFacade.js"
import { UserManagementFacade } from "../common/api/worker/facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "../../platform-kit/base/facades/lazy/RecoverCodeFacade.js"
import { ContactFacade } from "../common/api/worker/facades/lazy/ContactFacade.js"
import { UsageTestController } from "@tutao/usagetests"
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestModel } from "../common/misc/UsageTestModel.js"
import { NewsModel } from "../common/misc/news/NewsModel.js"
import { IServiceExecutor } from "../../platform-kit/network/ServiceRequest.js"
import { CryptoFacade } from "../../platform-kit/base/base-crypto/CryptoFacade.js"
import {
	CommonSystemFacade,
	ContactSuggestion,
	DesktopSystemFacade,
	ExportFacade,
	ExternalCalendarFacade,
	MobileContactsFacade,
	MobilePaymentsFacade,
	MobileSystemFacade,
	NativeCredentialsFacade,
	SearchTextInAppFacade,
	SettingsFacade,
	SqlCipherFacade,
	ThemeFacade,
} from "@tutao/native-bridge/generatedIpc/types"
import { InterWindowEventFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { NativeFileApp } from "../../app-kit/native-bridge/common/FileApp.js"
import { WorkerFacade } from "../common/api/worker/facades/WorkerFacade.js"
import { PageContextLoginListener } from "../common/api/main/PageContextLoginListener.js"
import { WebsocketConnectivityModel } from "../common/misc/WebsocketConnectivityModel.js"
import { OperationProgressTracker } from "../common/api/main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../common/gui/InfoMessageHandler.js"
import { EntropyFacade } from "../../platform-kit/base/facades/EntropyFacade.js"
import { assert, assertNotNull, defer, DeferredObject, lazy, lazyAsync, LazyLoaded, lazyMemoized, noOp } from "../../platform-kit/utils"
import { RecipientsModel } from "../common/api/main/RecipientsModel.js"
import { NoZoneDateProvider } from "../../platform-kit/utils/NoZoneDateProvider.js"
import { SendMailModel } from "../common/mailFunctionality/SendMailModel.js"
import { OfflineIndicatorViewModel } from "../common/gui/base/OfflineIndicatorViewModel.js"
import { Router, ScopedThrottledRouter, ThrottledRouter } from "../../ui/ScopedThrottledRouter.js"
import { DeviceConfig, deviceConfig } from "../common/misc/DeviceConfig.js"
import { InboxRuleHandler } from "./mail/model/InboxRuleHandler.js"
import { SearchViewModel } from "./search/view/SearchViewModel.js"
import { SearchRouter } from "../common/search/view/SearchRouter.js"
import { MailOpenedListener } from "./mail/view/MailViewModel.js"
import { getEnabledMailAddressesWithUser } from "../common/mailFunctionality/SharedMailUtils.js"
import { ReceivedGroupInvitationsModel } from "../common/sharing/model/ReceivedGroupInvitationsModel.js"
import { CalendarViewModel } from "../calendar-app/calendar/view/CalendarViewModel.js"
import { CalendarEventModel, CalendarOperation } from "../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarEventsRepository } from "../common/calendar/date/CalendarEventsRepository.js"
import { showProgressDialog } from "../../ui/dialogs/ProgressDialog.js"
import { ContactSuggestionProvider, RecipientsSearchModel } from "../common/misc/RecipientsSearchModel.js"
import { ConversationViewModel, ConversationViewModelFactory } from "./mail/view/ConversationViewModel.js"
import { CreateMailViewerOptions } from "./mail/view/MailViewer.js"
import { MailViewerViewModel } from "./mail/view/MailViewerViewModel.js"
import { ExternalLoginViewModel } from "./mail/view/ExternalLoginView.js"
import { MailAddressNameChanger, MailAddressTableModel, UserInfo } from "../common/settings/mailaddress/MailAddressTableModel.js"
import { DrawerMenuAttrs, isPartnerEnabled } from "../common/gui/nav/DrawerMenu.js"
import { DomainConfigProvider } from "../common/api/common/DomainConfigProvider.js"
import { CredentialRemovalHandler } from "../common/login/CredentialRemovalHandler.js"
import { LoginViewModel } from "../common/login/LoginViewModel.js"
import { EntropyCollector } from "../common/api/main/EntropyCollector.js"
import { notifications } from "../../ui/Notifications.js"
import { windowFacade } from "../common/misc/WindowFacade.js"
import { BrowserWebauthn } from "../common/misc/2fa/webauthn/BrowserWebauthn.js"
import { FileControllerBrowser } from "../common/file/FileControllerBrowser.js"
import { FileControllerNative } from "../common/file/FileControllerNative.js"
import { CalendarInfo, CalendarModel } from "../calendar-app/calendar/model/CalendarModel.js"
import { CalendarInviteHandler } from "../calendar-app/calendar/view/CalendarInvites.js"
import { AlarmScheduler } from "../common/calendar/date/AlarmScheduler.js"
import { SchedulerImpl } from "../common/api/common/utils/Scheduler.js"
import type { CalendarEventPreviewViewModel } from "../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import { isCustomizationEnabledForCustomer } from "../common/api/common/utils/CustomerUtils.js"
import { NativeContactsSyncManager } from "./contacts/model/NativeContactsSyncManager.js"
import { PostLoginActions } from "../common/login/PostLoginActions.js"
import { CredentialFormatMigrator } from "../common/misc/credentials/CredentialFormatMigrator.js"
import { AddNotificationEmailDialog } from "./settings/AddNotificationEmailDialog.js"
import { NativeThemeFacade, ThemeController, WebThemeFacade } from "../../ui/ThemeController.js"
import { HtmlSanitizer } from "../common/misc/HtmlSanitizer.js"
import { theme } from "../../ui/theme.js"
import { SearchIndexStateInfo } from "../common/api/worker/search/SearchTypes.js"
import { MAIL_PREFIX } from "../../ui/utils/RouteChange.js"
import { getDisplayedSender } from "../common/api/common/CommonMailUtils.js"
import { MailModel } from "./mail/model/MailModel.js"
import type { CommonLocator } from "../common/api/main/CommonLocator.js"
import { WorkerRandomizer } from "../common/api/worker/workerInterfaces.js"
import { WorkerInterface } from "./workerUtils/worker/WorkerImpl.js"
import { isEditableDraft, isMailInSpamOrTrash } from "./mail/model/MailChecks.js"
import type { ContactImporter } from "./contacts/ContactImporter.js"
import type { CalendarContactPreviewViewModel } from "../calendar-app/calendar/gui/eventpopup/CalendarContactPreviewViewModel.js"
import { KeyLoaderFacade } from "../../platform-kit/base/base-crypto/KeyLoaderFacade.js"
import { KeyVerificationFacade } from "../../platform-kit/base/facades/lazy/KeyVerificationFacade"
import { MailImporter } from "./mail/import/MailImporter.js"
import type { MailExportController } from "./native/main/MailExportController.js"
import { BulkMailLoader } from "./workerUtils/index/BulkMailLoader.js"
import { MailExportFacade } from "../common/api/worker/facades/lazy/MailExportFacade.js"
import { SyncTracker } from "../common/api/main/SyncTracker.js"
import { Indexer } from "./workerUtils/index/Indexer"
import { SearchFacade } from "./workerUtils/index/SearchFacade"
import { getEventWithDefaultTimes, setNextHalfHour } from "../common/api/common/utils/CommonCalendarUtils.js"
import { OfflineStorageSettingsModel } from "../common/offline/OfflineStorageSettingsModel"
import { SearchToken } from "../../ui/utils/QueryTokenUtils"
import type { ContactSearchFacade } from "./workerUtils/index/ContactSearchFacade"
import PublicEncryptionKeyProvider from "../../platform-kit/base/base-crypto/PublicEncryptionKeyProvider"
import { IdentityKeyCreator } from "../../platform-kit/base/base-crypto/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../platform-kit/base/base-crypto/PublicIdentityKeyProvider"
import { WhitelabelThemeGenerator } from "../../ui/WhitelabelThemeGenerator"
import { UndoModel } from "./UndoModel"
import { GroupSettingsModel } from "../common/sharing/model/GroupSettingsModel"
import { AutosaveFacade } from "../common/api/worker/facades/lazy/AutosaveFacade"
import { lang } from "../../ui/utils/LanguageViewModel.js"
import { SpamClassificationHandler } from "./mail/model/SpamClassificationHandler"
import { SpamClassifier } from "./workerUtils/spamClassification/SpamClassifier"
import { ProcessInboxHandler } from "./mail/model/ProcessInboxHandler"
import type { QuickActionsModel } from "../common/misc/quickactions/QuickActionsModel"
import { DriveFacade } from "../common/api/worker/facades/lazy/DriveFacade"
import { DriveViewModel } from "../drive-app/drive/view/DriveViewModel"
import { TransferProgressDispatcher } from "../common/api/main/TransferProgressDispatcher"
import { FolderItem } from "../drive-app/drive/view/DriveUtils"
import { CalendarEventUpdateCoordinator } from "../calendar-app/calendar/model/CalendarEventUpdateCoordinator"
import { MoveItems } from "../drive-app/drive/view/DriveMoveItemDialog"
import { WebMobileFacade } from "../common/native/WebMobileFacade"
import { SystemPermissionHandler } from "../common/native/SystemPermissionHandler"
import { NativeInterfaces } from "../common/native/NativeInterfaceFactory"
import { NativeInterfaceMain } from "../common/native/NativeInterfaceMain"
import { NativePushServiceApp } from "../common/native/NativePushServiceApp"
import { DriveFilePicker } from "../drive-app/drive/view/DriveFilePicker"
import { ExposedCacheStorage } from "../../app-kit/local-store/CacheStorage"
import { CALENDAR_MIME_TYPE, MAIL_MIME_TYPES, VCARD_MIME_TYPES } from "../../platform-kit/utils/FileConstants"
import { CalendarEvent, CalendarEventAttendee, Contact, Mail, MailboxProperties } from "@tutao/entities/tutanota"
import { GroupType, ShareableGroupType } from "../../entities/sys/Utils"
import { ClientModelInfo } from "../../platform-kit/instance-pipeline/EntityFunctions"
import { WebFileResolver } from "../drive-app/drive/view/WebFileResolver"

import { ParsedEventAlarmTuple } from "../calendar-app/calendar/export/CalendarParser"

assertMainOrNode()

class MailLocator implements CommonLocator {
	clientModelInfo!: ClientModelInfo
	eventController!: EventController
	search!: SearchModel
	mailboxModel!: MailboxModel
	mailModel!: MailModel
	minimizedMailModel!: MinimizedMailEditorViewModel
	contactModel!: ContactModel
	entityClient!: EntityClient
	progressTracker!: ProgressTracker
	credentialsProvider!: CredentialsProvider
	worker!: WorkerClient
	fileController!: FileController
	secondFactorHandler!: SecondFactorHandler
	webAuthn!: WebauthnClient
	loginFacade!: LoginFacade
	logins!: LoginController
	header!: Header
	customerFacade!: CustomerFacade
	keyLoaderFacade!: KeyLoaderFacade
	giftCardFacade!: GiftCardFacade
	groupManagementFacade!: GroupManagementFacade
	identityKeyCreator!: IdentityKeyCreator
	configFacade!: ConfigurationDatabase
	calendarFacade!: CalendarFacade
	mailFacade!: MailFacade
	shareFacade!: ShareFacade
	counterFacade!: CounterFacade
	indexerFacade!: Indexer
	searchFacade!: SearchFacade
	contactSearchFacade!: ContactSearchFacade
	bookingFacade!: BookingFacade
	mailAddressFacade!: MailAddressFacade
	keyVerificationFacade!: KeyVerificationFacade
	publicEncryptionKeyProvider!: PublicEncryptionKeyProvider
	publicIdentityKeyProvider!: PublicIdentityKeyProvider
	blobFacade!: BlobFacade
	userManagementFacade!: UserManagementFacade
	recoverCodeFacade!: RecoverCodeFacade
	contactFacade!: ContactFacade
	usageTestController!: UsageTestController
	usageTestModel!: UsageTestModel
	newsModel!: NewsModel
	serviceExecutor!: IServiceExecutor
	cryptoFacade!: CryptoFacade
	searchTextFacade!: SearchTextInAppFacade
	desktopSettingsFacade!: SettingsFacade
	desktopSystemFacade!: DesktopSystemFacade
	exportFacade!: ExportFacade
	webMobileFacade!: WebMobileFacade
	systemPermissionHandler!: SystemPermissionHandler
	interWindowEventSender!: InterWindowEventFacadeSendDispatcher
	cacheStorage!: ExposedCacheStorage
	workerFacade!: WorkerFacade
	loginListener!: PageContextLoginListener
	random!: WorkerRandomizer
	connectivityModel!: WebsocketConnectivityModel
	operationProgressTracker!: OperationProgressTracker
	infoMessageHandler!: InfoMessageHandler
	themeController!: ThemeController
	Const!: Record<string, any>
	bulkMailLoader!: BulkMailLoader
	mailExportFacade!: MailExportFacade
	syncTracker!: SyncTracker
	spamClassifier!: SpamClassifier
	whitelabelThemeGenerator!: WhitelabelThemeGenerator
	autosaveFacade!: AutosaveFacade
	driveFacade!: DriveFacade
	transferProgressDispatcher!: TransferProgressDispatcher

	private nativeInterfaces: NativeInterfaces | null = null
	private mailImporter: MailImporter | null = null
	private entropyFacade!: EntropyFacade
	private sqlCipherFacade!: SqlCipherFacade

	readonly recipientsModel: lazyAsync<RecipientsModel> = lazyMemoized(async () => {
		const { RecipientsModel } = await import("../common/api/main/RecipientsModel.js")
		return new RecipientsModel(this.contactModel, this.logins, this.mailFacade, this.entityClient)
	})

	async noZoneDateProvider(): Promise<NoZoneDateProvider> {
		return new NoZoneDateProvider()
	}

	async sendMailModel(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<SendMailModel> {
		const factory = await this.sendMailModelSyncFactory(mailboxDetails, mailboxProperties)
		return factory()
	}

	private readonly redraw: lazyAsync<() => unknown> = lazyMemoized(async () => {
		const m = await import("mithril")
		return m.redraw
	})

	readonly offlineIndicatorViewModel = lazyMemoized(async () => {
		return new OfflineIndicatorViewModel(
			this.cacheStorage,
			this.loginListener,
			this.connectivityModel,
			this.logins,
			this.progressTracker,
			await this.redraw(),
		)
	})

	async appHeaderAttrs(): Promise<AppHeaderAttrs> {
		return {
			offlineIndicatorModel: await this.offlineIndicatorViewModel(),
			newsItemsCount: () => this.newsModel.liveNewsIds.length,
		}
	}

	readonly mailViewModel = lazyMemoized(async () => {
		const { MailViewModel } = await import("./mail/view/MailViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const router = new ScopedThrottledRouter("/mail")
		return new MailViewModel(
			this.mailboxModel,
			this.mailModel,
			this.entityClient,
			this.eventController,
			this.connectivityModel,
			this.cacheStorage,
			conversationViewModelFactory,
			this.mailOpenedListener,
			deviceConfig,
			this.processInboxHandler(),
			router,
			await this.redraw(),
			this.syncTracker,
			await this.unscopedSearchRouter(),
			this.search,
		)
	})

	readonly affiliateViewModel = lazyMemoized(async () => {
		const { AffiliateViewModel } = await import("../common/settings/AffiliateViewModel.js")
		return new AffiliateViewModel()
	})

	readonly inboxRuleHandler = lazyMemoized(() => {
		return new InboxRuleHandler(this.mailFacade, this.logins, this.mailModel)
	})

	readonly spamClassificationHandler = lazyMemoized(() => {
		return new SpamClassificationHandler(this.spamClassifier, this.contactModel, this.mailFacade, this.logins)
	})

	readonly processInboxHandler = lazyMemoized(() => {
		return new ProcessInboxHandler(this.logins, this.mailFacade, this.cryptoFacade, this.spamClassificationHandler, this.inboxRuleHandler)
	})

	async searchViewModelFactory(): Promise<() => SearchViewModel> {
		const { SearchViewModel } = await import("./search/view/SearchViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const redraw = await this.redraw()
		const searchRouter = await this.scopedSearchRouter()
		const calendarEventsRepository = await this.calendarEventsRepository()
		const offlineStorageSettings = await this.offlineStorageSettingsModel()
		const calendarModel = await this.calendarModel()
		return () => {
			return new SearchViewModel(
				searchRouter,
				this.search,
				this.mailboxModel,
				this.logins,
				this.indexerFacade,
				this.entityClient,
				this.eventController,
				this.mailOpenedListener,
				this.calendarFacade,
				this.progressTracker,
				conversationViewModelFactory,
				calendarEventsRepository,
				calendarModel,
				redraw,
				deviceConfig.getMailAutoSelectBehavior(),
				offlineStorageSettings,
			)
		}
	}

	readonly throttledRouter: lazy<Router> = lazyMemoized(() => new ThrottledRouter())

	readonly scopedSearchRouter: lazyAsync<SearchRouter> = lazyMemoized(async () => {
		const { SearchRouter } = await import("../common/search/view/SearchRouter.js")
		return new SearchRouter(new ScopedThrottledRouter("/search"))
	})

	readonly unscopedSearchRouter: lazyAsync<SearchRouter> = lazyMemoized(async () => {
		const { SearchRouter } = await import("../common/search/view/SearchRouter.js")
		return new SearchRouter(this.throttledRouter())
	})

	readonly mailOpenedListener: MailOpenedListener = {
		onEmailOpened: isDesktop()
			? (mail) => {
					this.desktopSystemFacade.sendSocketMessage(getDisplayedSender(mail).address)
				}
			: noOp,
	}

	readonly quickActionsModel: lazyAsync<QuickActionsModel> = lazyMemoized(async () => {
		const { QuickActionsModel } = await import("../common/misc/quickactions/QuickActionsModel.js")
		return new QuickActionsModel()
	})

	readonly contactViewModel = lazyMemoized(async () => {
		const { ContactViewModel } = await import("./contacts/view/ContactViewModel.js")
		const router = new ScopedThrottledRouter("/contact")
		return new ContactViewModel(
			this.contactModel,
			this.entityClient,
			this.eventController,
			router,
			await this.redraw(),
			await this.unscopedSearchRouter(),
			this.search,
		)
	})

	readonly contactListViewModel = lazyMemoized(async () => {
		const { ContactListViewModel } = await import("./contacts/view/ContactListViewModel.js")
		const router = new ScopedThrottledRouter("/contactlist")
		return new ContactListViewModel(
			this.entityClient,
			this.groupManagementFacade,
			this.logins,
			this.eventController,
			this.contactModel,
			await this.receivedGroupInvitationsModel(GroupType.ContactList),
			router,
			this.groupSettingsModel,
			await this.redraw(),
		)
	})

	readonly groupSettingsModel: lazy<Promise<GroupSettingsModel>> = lazyMemoized(async () => {
		const { GroupSettingsModel } = await import("../common/sharing/model/GroupSettingsModel.js")
		return new GroupSettingsModel(this.entityClient, this.logins)
	})

	async receivedGroupInvitationsModel<TypeOfGroup extends ShareableGroupType>(groupType: TypeOfGroup): Promise<ReceivedGroupInvitationsModel<TypeOfGroup>> {
		const { ReceivedGroupInvitationsModel } = await import("../common/sharing/model/ReceivedGroupInvitationsModel.js")
		return new ReceivedGroupInvitationsModel<TypeOfGroup>(groupType, this.eventController, this.entityClient, this.logins)
	}

	readonly calendarViewModel = lazyMemoized<Promise<CalendarViewModel>>(async () => {
		const { CalendarViewModel } = await import("../calendar-app/calendar/view/CalendarViewModel.js")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarViewModel(
			this.logins,
			async (mode: CalendarOperation, event: CalendarEvent) => {
				const mailboxDetail = await this.mailboxModel.getUserMailboxDetails()
				const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot)
				return await this.calendarEventModel(mode, event, mailboxDetail, mailboxProperties, null)
			},
			(...args) => this.calendarEventPreviewModel(...args),
			(...args) => this.calendarContactPreviewModel(...args),
			await this.calendarModel(),
			await this.calendarEventsRepository(),
			this.entityClient,
			this.eventController,
			this.progressTracker,
			deviceConfig,
			await this.receivedGroupInvitationsModel(GroupType.Calendar),
			timeZone,
			this.mailboxModel,
			this.contactModel,
			this.groupSettingsModel,
			this.operationProgressTracker,
		)
	})

	readonly calendarEventsRepository: lazyAsync<CalendarEventsRepository> = lazyMemoized(async () => {
		const { CalendarEventsRepository } = await import("../common/calendar/date/CalendarEventsRepository.js")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarEventsRepository(
			await this.calendarModel(),
			this.calendarFacade,
			timeZone,
			this.entityClient,
			this.eventController,
			this.contactModel,
			this.logins,
		)
	})

	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	private async sendMailModelSyncFactory(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<() => SendMailModel> {
		const { SendMailModel } = await import("../common/mailFunctionality/SendMailModel.js")
		const recipientsModel = await this.recipientsModel()
		const dateProvider = await this.noZoneDateProvider()
		const undoModel = await this.undoModel()
		return () =>
			new SendMailModel(
				this.mailFacade,
				this.entityClient,
				this.logins,
				this.mailboxModel,
				this.contactModel,
				this.eventController,
				mailboxDetails,
				recipientsModel,
				dateProvider,
				mailboxProperties,
				this.autosaveFacade,
				async (mail: Mail) => {
					return !isEditableDraft(mail) || (await isMailInSpamOrTrash(mail, mailLocator.mailModel))
				},
				this.syncTracker,
				undoModel,
			)
	}

	async calendarEventModel(
		editMode: CalendarOperation,
		event: Partial<CalendarEvent>,
		mailboxDetail: MailboxDetail,
		mailboxProperties: MailboxProperties,
		responseTo: Mail | null,
	): Promise<CalendarEventModel | null> {
		const [{ makeCalendarEventModel }, { getTimeZone }, { calendarNotificationSender }] = await Promise.all([
			import("../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"),
			import("../common/calendar/date/CalendarUtils.js"),
			import("../calendar-app/calendar/view/CalendarNotificationSender.js"),
		])
		const sendMailModelFactory = await this.sendMailModelSyncFactory(mailboxDetail, mailboxProperties)
		const showProgress = <T>(p: Promise<T>) => showProgressDialog("pleaseWait_msg", p)

		return await makeCalendarEventModel(
			editMode,
			event,
			await this.recipientsModel(),
			await this.calendarModel(),
			this.logins,
			mailboxDetail,
			mailboxProperties,
			sendMailModelFactory,
			calendarNotificationSender,
			this.entityClient,
			responseTo,
			await this.calendarInviteHandler(),
			getTimeZone(),
			showProgress,
		)
	}

	async recipientsSearchModel(): Promise<RecipientsSearchModel> {
		const { RecipientsSearchModel } = await import("../common/misc/RecipientsSearchModel.js")
		const suggestionsProvider = await this.contactSuggestionProvider()
		return new RecipientsSearchModel(await this.recipientsModel(), this.contactModel, suggestionsProvider, this.entityClient)
	}

	private async contactSuggestionProvider(): Promise<ContactSuggestionProvider> {
		if (isApp()) {
			const { MobileContactSuggestionProvider } = await import("../common/native/MobileContactSuggestionProvider.js")
			return new MobileContactSuggestionProvider(this.mobileContactsFacade)
		} else {
			return {
				async getContactSuggestions(_query: string): Promise<readonly ContactSuggestion[]> {
					return []
				},
			}
		}
	}

	readonly conversationViewModelFactory: lazyAsync<ConversationViewModelFactory> = async () => {
		const { ConversationViewModel } = await import("./mail/view/ConversationViewModel.js")
		const factory = await this.mailViewerViewModelFactory()
		const m = await import("mithril")
		return (options: CreateMailViewerOptions) => {
			return new ConversationViewModel(
				options,
				(options) => factory(options),
				this.entityClient,
				this.eventController,
				deviceConfig,
				this.mailModel,
				m.redraw,
			)
		}
	}

	async conversationViewModel(options: CreateMailViewerOptions): Promise<ConversationViewModel> {
		const factory = await this.conversationViewModelFactory()
		return factory(options)
	}

	contactImporter = async (): Promise<ContactImporter> => {
		const { ContactImporter } = await import("./contacts/ContactImporter.js")
		return new ContactImporter(
			this.contactFacade,
			this.systemPermissionHandler,
			isApp() ? this.mobileContactsFacade : null,
			isApp() ? this.nativeContactsSyncManager() : null,
		)
	}

	async mailViewerViewModelFactory(): Promise<(options: CreateMailViewerOptions) => MailViewerViewModel> {
		const { MailViewerViewModel } = await import("./mail/view/MailViewerViewModel.js")
		const eventRepository = await this.calendarEventsRepository()
		const undoModel = await this.undoModel()

		return ({ mail, showFolder, highlightedTokens }) =>
			new MailViewerViewModel(
				mail,
				showFolder,
				this.entityClient,
				this.mailboxModel,
				this.mailModel,
				isBrowser() ? null : this.commonSystemFacade,
				this.contactModel,
				this.configFacade,
				this.fileController,
				this.logins,
				this.eventController,
				this.workerFacade,
				this.search,
				this.mailFacade,
				this.cryptoFacade,
				() => this.contactImporter(),
				highlightedTokens ?? [],
				eventRepository,
				undoModel,
				this.transferProgressDispatcher,
				this.operationProgressTracker,
			)
	}

	async externalLoginViewModelFactory(): Promise<() => ExternalLoginViewModel> {
		const { ExternalLoginViewModel } = await import("./mail/view/ExternalLoginView.js")
		return () => new ExternalLoginViewModel(this.credentialsProvider)
	}

	get deviceConfig(): DeviceConfig {
		return deviceConfig
	}

	get native(): NativeInterfaceMain {
		return this.getNativeInterface("native")
	}

	get fileApp(): NativeFileApp {
		return this.getNativeInterface("fileApp")
	}

	get pushService(): NativePushServiceApp {
		return this.getNativeInterface("pushService")
	}

	get commonSystemFacade(): CommonSystemFacade {
		return this.getNativeInterface("commonSystemFacade")
	}

	get themeFacade(): ThemeFacade {
		return this.getNativeInterface("themeFacade")
	}

	get externalCalendarFacade(): ExternalCalendarFacade {
		return this.getNativeInterface("externalCalendarFacade")
	}

	get systemFacade(): MobileSystemFacade {
		return this.getNativeInterface("mobileSystemFacade")
	}

	get mobileContactsFacade(): MobileContactsFacade {
		return this.getNativeInterface("mobileContactsFacade")
	}

	get nativeCredentialsFacade(): NativeCredentialsFacade {
		return this.getNativeInterface("nativeCredentialsFacade")
	}

	get mobilePaymentsFacade(): MobilePaymentsFacade {
		return this.getNativeInterface("mobilePaymentsFacade")
	}

	async mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel> {
		const { MailAddressTableModel } = await import("../common/settings/mailaddress/MailAddressTableModel.js")
		const nameChanger = await this.ownMailAddressNameChanger()
		return new MailAddressTableModel(
			this.entityClient,
			this.serviceExecutor,
			this.mailAddressFacade,
			this.logins,
			this.eventController,
			{ user: this.logins.getUserController().user, userGroupInfo: this.logins.getUserController().userGroupInfo },
			nameChanger,
			await this.redraw(),
		)
	}

	async mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userInfo: UserInfo): Promise<MailAddressTableModel> {
		const { MailAddressTableModel } = await import("../common/settings/mailaddress/MailAddressTableModel.js")
		const nameChanger = await this.adminNameChanger(mailGroupId, userId)
		return new MailAddressTableModel(
			this.entityClient,
			this.serviceExecutor,
			this.mailAddressFacade,
			this.logins,
			this.eventController,
			userInfo,
			nameChanger,
			await this.redraw(),
		)
	}

	async ownMailAddressNameChanger(): Promise<MailAddressNameChanger> {
		const { OwnMailAddressNameChanger } = await import("../common/settings/mailaddress/OwnMailAddressNameChanger.js")
		return new OwnMailAddressNameChanger(this.mailboxModel, this.entityClient)
	}

	async adminNameChanger(mailGroupId: Id, userId: Id): Promise<MailAddressNameChanger> {
		const { AnotherUserMailAddressNameChanger } = await import("../common/settings/mailaddress/AnotherUserMailAddressNameChanger.js")
		return new AnotherUserMailAddressNameChanger(this.mailAddressFacade, mailGroupId, userId)
	}

	async drawerAttrsFactory(): Promise<() => DrawerMenuAttrs> {
		return () => ({
			logins: this.logins,
			newsModel: this.newsModel,
			desktopSystemFacade: this.desktopSystemFacade,
			isPartnerEnabled: isPartnerEnabled(this.logins),
		})
	}

	domainConfigProvider(): DomainConfigProvider {
		return new DomainConfigProvider()
	}

	async credentialsRemovalHandler(): Promise<CredentialRemovalHandler> {
		const { NoopCredentialRemovalHandler, AppsCredentialRemovalHandler } = await import("../common/login/CredentialRemovalHandler.js")
		return isBrowser()
			? new NoopCredentialRemovalHandler()
			: new AppsCredentialRemovalHandler(this.pushService, this.configFacade, async (login, userId) => {
					if (isApp()) {
						await mailLocator.nativeContactsSyncManager().disableSync(userId, login)
					}
					await mailLocator.indexerFacade.deleteIndex(userId)
					if (isDesktop()) {
						await mailLocator.exportFacade.clearExportState(userId)
					}
				})
	}

	loginViewModelFactory = lazyMemoized(async () => {
		const { LoginViewModel } = await import("../common/login/LoginViewModel.js")
		const credentialsRemovalHandler = await mailLocator.credentialsRemovalHandler()
		const { MobileAppLock, NoOpAppLock } = await import("../common/login/AppLock.js")
		const appLock = isApp()
			? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade)
			: new NoOpAppLock()
		return () => {
			const domainConfig = isBrowser()
				? mailLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port)
				: // in this case, we know that we have a staticUrl set that we need to use
					mailLocator.domainConfigProvider().getCurrentDomainConfig()

			return new LoginViewModel(
				mailLocator.logins,
				mailLocator.credentialsProvider,
				mailLocator.secondFactorHandler,
				deviceConfig,
				domainConfig,
				credentialsRemovalHandler,
				isBrowser() ? null : this.pushService,
				appLock,
			)
		}
	})

	private getNativeInterface<T extends keyof NativeInterfaces>(name: T): NativeInterfaces[T] {
		if (!this.nativeInterfaces) {
			throw new ProgrammingError(`Tried to use ${name} in web`)
		}

		return this.nativeInterfaces[name]
	}

	public getMailImporter(): MailImporter {
		if (this.mailImporter == null) {
			throw new ProgrammingError(`Tried to use mail importer in web or mobile`)
		}

		return this.mailImporter
	}

	private readonly _workerDeferred: DeferredObject<WorkerClient>
	private _entropyCollector!: EntropyCollector
	private _deferredInitialized: DeferredObject<void> = defer()

	get initialized(): Promise<void> {
		return this._deferredInitialized.promise
	}

	constructor() {
		this._workerDeferred = defer()
	}

	async init(clientModelInfo: ClientModelInfo): Promise<void> {
		this.clientModelInfo = clientModelInfo
		// Split init in two separate parts: creating modules and causing side effects.
		// We would like to do both on normal init but on HMR we just want to replace modules without a new worker. If we create a new
		// worker we end up losing state on the worker side (including our session).
		this.worker = bootstrapWorker(this)
		await this._createInstances()
		this._entropyCollector = new EntropyCollector(this.entropyFacade, await this.scheduler(), window)

		this._entropyCollector.start()

		this._deferredInitialized.resolve()
	}

	async _createInstances() {
		const {
			loginFacade,
			customerFacade,
			giftCardFacade,
			groupManagementFacade,
			identityKeyCreator,
			configFacade,
			calendarFacade,
			alarmFacade,
			mailFacade,
			shareFacade,
			counterFacade,
			indexerFacade,
			searchFacade,
			bookingFacade,
			mailAddressFacade,
			keyVerificationFacade,
			publicEncryptionKeyProvider,
			publicIdentityKeyProvider,
			blobFacade,
			userManagementFacade,
			recoverCodeFacade,
			restInterface,
			serviceExecutor,
			cryptoFacade,
			cacheStorage,
			random,
			eventBus,
			entropyFacade,
			workerFacade,
			sqlCipherFacade,
			contactFacade,
			bulkMailLoader,
			mailExportFacade,
			contactSearchFacade,
			autosaveFacade,
			spamClassifier,
			driveFacade,
		} = this.worker.getWorkerInterface() as WorkerInterface
		this.loginFacade = loginFacade
		this.customerFacade = customerFacade
		this.giftCardFacade = giftCardFacade
		this.groupManagementFacade = groupManagementFacade
		this.identityKeyCreator = identityKeyCreator
		this.configFacade = configFacade
		this.calendarFacade = calendarFacade
		this.mailFacade = mailFacade
		this.shareFacade = shareFacade
		this.counterFacade = counterFacade
		this.indexerFacade = indexerFacade
		this.searchFacade = searchFacade
		this.contactSearchFacade = contactSearchFacade
		this.bookingFacade = bookingFacade
		this.mailAddressFacade = mailAddressFacade
		this.keyVerificationFacade = keyVerificationFacade
		this.publicEncryptionKeyProvider = publicEncryptionKeyProvider
		this.publicIdentityKeyProvider = publicIdentityKeyProvider
		this.blobFacade = blobFacade
		this.userManagementFacade = userManagementFacade
		this.recoverCodeFacade = recoverCodeFacade
		this.contactFacade = contactFacade
		this.driveFacade = driveFacade
		this.serviceExecutor = serviceExecutor
		this.sqlCipherFacade = sqlCipherFacade
		this.logins = new LoginController(
			this.loginFacade,
			this.customerFacade,
			async () => this.loginListener,
			() => this.worker.reset(),
		)
		// Should be called elsewhere later e.g. in CommonLocator
		this.logins.init()
		this.progressTracker = new ProgressTracker()
		this.eventController = new EventController(mailLocator.logins)
		this.syncTracker = new SyncTracker()
		this.entityClient = new EntityClient(restInterface, this.clientModelInfo)
		this.search = new SearchModel(this.searchFacade, this.eventController, this.entityClient, () => this.calendarEventsRepository())
		this.cryptoFacade = cryptoFacade
		this.cacheStorage = cacheStorage
		this.entropyFacade = entropyFacade
		this.workerFacade = workerFacade
		this.bulkMailLoader = bulkMailLoader
		this.mailExportFacade = mailExportFacade
		this.connectivityModel = new WebsocketConnectivityModel(eventBus)
		this.mailboxModel = new MailboxModel(this.eventController, this.entityClient, this.logins)
		this.mailModel = new MailModel(
			notifications,
			this.mailboxModel,
			this.eventController,
			this.entityClient,
			this.logins,
			this.mailFacade,
			this.connectivityModel,
			this.processInboxHandler,
			this.bulkMailLoader,
		)
		this.operationProgressTracker = new OperationProgressTracker()
		this.infoMessageHandler = new InfoMessageHandler((state: SearchIndexStateInfo) => {
			mailLocator.search.indexState(state)
		})
		this.autosaveFacade = autosaveFacade

		this.usageTestModel = new UsageTestModel(
			{
				[StorageBehavior.Persist]: deviceConfig,
				[StorageBehavior.Ephemeral]: new EphemeralUsageTestStorage(),
			},
			{
				now(): number {
					return Date.now()
				},
				timeZone(): string {
					throw new Error("Not implemented by this provider")
				},
			},
			this.serviceExecutor,
			this.entityClient,
			this.logins,
			this.eventController,
			() => this.usageTestController,
			this.clientModelInfo,
		)
		this.usageTestController = new UsageTestController(this.usageTestModel)
		this.Const = Const
		this.whitelabelThemeGenerator = new WhitelabelThemeGenerator()
		this.spamClassifier = spamClassifier

		this.transferProgressDispatcher = new TransferProgressDispatcher()

		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("../common/native/WebDesktopFacade")
			const { WebMobileFacade } = await import("../common/native/WebMobileFacade.js")
			const { WebCommonNativeFacade } = await import("../common/native/WebCommonNativeFacade.js")
			const { WebInterWindowEventFacade } = await import("../common/native/WebInterWindowEventFacade.js")
			const { WebAuthnFacadeSendDispatcher } = await import("../../app-kit/native-bridge/common/generatedipc/dispatchers/WebAuthnFacadeSendDispatcher.js")
			const { OpenMailboxHandler } = await import("./native/main/OpenMailboxHandler.js")
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../common/native/NativeInterfaceFactory.js")
			const openMailboxHandler = new OpenMailboxHandler(this.logins, this.mailModel, this.mailboxModel)
			const { OpenCalendarHandler } = await import("../common/native/OpenCalendarHandler.js")
			const openCalendarHandler = new OpenCalendarHandler(this.logins, async (mode: CalendarOperation, date: Date) => {
				const mailboxDetail = await this.mailboxModel.getUserMailboxDetails()
				const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot)
				return await this.calendarEventModel(mode, getEventWithDefaultTimes(setNextHalfHour(new Date(date))), mailboxDetail, mailboxProperties, null)
			})
			const { OpenSettingsHandler } = await import("../common/native/OpenSettingsHandler.js")

			const openSettingsHandler = new OpenSettingsHandler(this.logins)
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, MAIL_PREFIX)

			this.nativeInterfaces = createNativeInterfaces(
				this.webMobileFacade,
				new WebDesktopFacade(
					this.logins,
					async () => this.native,
					() => this.desktopSettingsFacade,
				),
				new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig),
				new WebCommonNativeFacade(
					this.logins,
					this.mailboxModel,
					this.usageTestController,
					async () => this.fileApp,
					async () => this.pushService,
					this.handleFileImport.bind(this),
					(userId, address, requestedPath) => openMailboxHandler.openMailbox(userId, address, requestedPath),
					(userId, action, date, eventId) => openCalendarHandler.openCalendar(userId, action, date, eventId),
					AppType.Integrated,
					(path) => openSettingsHandler.openSettings(path),
					this.blobFacade,
				),
				cryptoFacade,
				calendarFacade,
				alarmFacade,
				this.entityClient,
				this.logins,
				AppType.Integrated,
			)

			this.credentialsProvider = await this.createCredentialsProvider()
			if (isDesktop() || isAdminClient()) {
				const desktopInterfaces = createDesktopInterfaces(this.native)
				this.searchTextFacade = desktopInterfaces.searchTextFacade
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade
					this.mailImporter = new MailImporter(
						this.domainConfigProvider(),
						this.logins,
						this.mailboxModel,
						this.entityClient,
						this.eventController,
						this.credentialsProvider,
						desktopInterfaces.nativeMailImportFacade,
						openSettingsHandler,
					)
					this.exportFacade = desktopInterfaces.exportFacade
				}
			} else if (isAndroidApp() || isIOSApp()) {
				const { SystemPermissionHandler } = await import("../common/native/SystemPermissionHandler.js")
				this.systemPermissionHandler = new SystemPermissionHandler(this.systemFacade)
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())

				this.systemFacade.storeServerRemoteOrigin(assertNotNull(env.staticUrl)).catch((e) => console.log("Failed to store remote URL: ", e))
			}
		} else {
			this.credentialsProvider = await this.createCredentialsProvider()
		}

		if (this.webAuthn == null) {
			this.webAuthn = new WebauthnClient(
				new BrowserWebauthn(navigator.credentials, this.domainConfigProvider().getCurrentDomainConfig()),
				this.domainConfigProvider(),
				isApp(),
			)
		}
		this.secondFactorHandler = new SecondFactorHandler(
			this.eventController,
			this.entityClient,
			this.webAuthn,
			this.loginFacade,
			this.domainConfigProvider(),
		)

		this.loginListener = new PageContextLoginListener(this.secondFactorHandler, this.credentialsProvider)
		this.random = random

		this.newsModel = new NewsModel(this.serviceExecutor, deviceConfig, async (name: string) => {
			switch (name) {
				case "usageOptIn": {
					const { UsageOptInNews } = await import("../common/misc/news/items/UsageOptInNews.js")
					return new UsageOptInNews(this.newsModel, this.usageTestModel)
				}
				case "recoveryCode": {
					const { RecoveryCodeNews } = await import("../common/misc/news/items/RecoveryCodeNews.js")
					return new RecoveryCodeNews(this.newsModel, this.logins.getUserController(), this.recoverCodeFacade)
				}
				case "pinBiometrics": {
					const { PinBiometricsNews } = await import("../common/misc/news/items/PinBiometricsNews.js")
					return new PinBiometricsNews(this.newsModel, this.credentialsProvider, this.logins.getUserController().userId)
				}
				case "referralLink": {
					const { ReferralLinkNews } = await import("../common/misc/news/items/ReferralLinkNews.js")
					const dateProvider = await this.noZoneDateProvider()
					return new ReferralLinkNews(this.newsModel, dateProvider, this.logins.getUserController())
				}
				case "richNotifications": {
					const { RichNotificationsNews } = await import("../common/misc/news/items/RichNotificationsNews.js")
					return new RichNotificationsNews(this.newsModel, isApp() || isDesktop() ? this.pushService : null, this.systemPermissionHandler)
				}
				case "colorCustomizationUpdate": {
					const { UpdateColorCustomizationNews } = await import("../common/misc/news/items/UpdateColorCustomizationNews.js")
					return new UpdateColorCustomizationNews(this.newsModel, this.logins.getUserController())
				}
				default:
					console.log(`No implementation for news named '${name}'`)
					return null
			}
		})

		this.fileController =
			this.nativeInterfaces == null ? new FileControllerBrowser(blobFacade) : new FileControllerNative(blobFacade, this.nativeInterfaces.fileApp)

		const { ContactModel } = await import("../common/contactsFunctionality/ContactModel.js")
		this.contactModel = new ContactModel(this.entityClient, this.logins, this.eventController, this.contactSearchFacade)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()

		// THEME
		// We need it because we want to run tests in node and real HTMLSanitizer does not work there.
		const sanitizerStub: Partial<HtmlSanitizer> = {
			sanitizeHTML: () => {
				return {
					html: "",
					blockedExternalContent: 0,
					inlineImageCids: [],
					links: [],
				}
			},
			sanitizeSVG(svg, configExtra?) {
				throw new Error("stub!")
			},
			sanitizeFragment(html, configExtra?) {
				throw new Error("stub!")
			},
		}
		const selectedThemeFacade =
			isApp() || isDesktop() ? new NativeThemeFacade(new LazyLoaded<ThemeFacade>(async () => mailLocator.themeFacade)) : new WebThemeFacade(deviceConfig)
		const lazySanitizer = isTest()
			? () => Promise.resolve(sanitizerStub as HtmlSanitizer)
			: () => import("../common/misc/HtmlSanitizer").then(({ getHtmlSanitizer }) => getHtmlSanitizer())

		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Mail, this.whitelabelThemeGenerator)

		// For native targets WebCommonNativeFacade notifies themeController because Android and Desktop do not seem to work reliably via media queries
		if (selectedThemeFacade instanceof WebThemeFacade) {
			selectedThemeFacade.addDarkListener(() => mailLocator.themeController.reloadTheme())
		}
	}

	readonly calendarModel: () => Promise<CalendarModel> = lazyMemoized(async () => {
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const { CalendarModel } = await import("../calendar-app/calendar/model/CalendarModel")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarModel(
			notifications,
			this.alarmScheduler,
			this.eventController,
			this.serviceExecutor,
			this.logins,
			this.progressTracker,
			this.operationProgressTracker,
			this.entityClient,
			this.mailboxModel,
			this.calendarFacade,
			this.fileController,
			this.contactModel,
			timeZone,
			!isBrowser() ? this.externalCalendarFacade : null,
			deviceConfig,
			!isBrowser() ? this.pushService : null,
			this.syncTracker,
			noOp,
			lang,
		)
	})

	readonly calendarInviteHandler: () => Promise<CalendarInviteHandler> = lazyMemoized(async () => {
		const { CalendarInviteHandler } = await import("../calendar-app/calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("../calendar-app/calendar/view/CalendarNotificationSender.js")
		return new CalendarInviteHandler(this.mailboxModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) =>
			this.sendMailModel(...arg),
		)
	})

	readonly calendarEventUpdateCoordinator: () => Promise<CalendarEventUpdateCoordinator> = lazyMemoized(async () => {
		const { CalendarEventUpdateCoordinator } = await import("../calendar-app/calendar/model/CalendarEventUpdateCoordinator")
		const calendarModel = await this.calendarModel()
		const connectivityModel: WebsocketConnectivityModel = this.connectivityModel
		return new CalendarEventUpdateCoordinator(
			connectivityModel,
			calendarModel,
			this.eventController,
			this.entityClient,
			this.mailboxModel,
			this.syncTracker,
		)
	})

	private async handleFileImport(filesUris: ReadonlyArray<string>) {
		const files = await this.fileApp.getFilesMetaData(filesUris)
		const areAllFilesVCard = files.every((file) => file.mimeType === VCARD_MIME_TYPES.X_VCARD || file.mimeType === VCARD_MIME_TYPES.VCARD)
		const areAllFilesICS = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE)
		const areAllFilesMail = files.every((file) => file.mimeType === MAIL_MIME_TYPES.EML || file.mimeType === MAIL_MIME_TYPES.MBOX)

		if (areAllFilesVCard) {
			const importer = await this.contactImporter()
			const { parseContacts } = await import("./contacts/ContactImporter.js")
			// For now, we just handle .vcf files, so we don't need to care about the file type
			const contacts = await parseContacts(files, this.fileApp)
			const vCardData = contacts.join("\n")
			const contactListId = assertNotNull(await this.contactModel.getContactListId())

			await importer.importContactsFromFile(vCardData, contactListId)
		} else if (areAllFilesICS) {
			const [
				{ parseCalendarFile },
				{ CalendarImporter },
				{ calendarSelectionDialog },
				{ EventSeriesResolver },
				{ ImportInteractionHandler },
				{ DefaultDateProvider },
			] = await Promise.all([
				import("../calendar-app/calendar/export/CalendarParser"),
				import("../common/calendar/import/CalendarImporter"),
				import("../common/calendar/gui/CalendarImporterDialog"),
				import("../common/calendar/import/EventSeriesResolver"),
				import("../common/calendar/gui/ImportInteractionHandler"),
				import("../common/calendar/date/CalendarUtils"),
			])

			const calendarModel = await this.calendarModel()
			const groupSettings = this.logins.getUserController().userSettingsGroupRoot.groupSettings
			const calendarInfos = await calendarModel.getCalendarInfos()
			const groupColors: Map<Id, string> = groupSettings.reduce((acc, gc) => {
				acc.set(gc.group, gc.color)
				return acc
			}, new Map())

			let parsedEvents: ParsedEventAlarmTuple[] = []

			for (const fileRef of files) {
				const dataFile = await this.fileApp.readDataFile(fileRef.location)
				if (dataFile == null) continue

				const data = parseCalendarFile(dataFile)
				parsedEvents.push(...data.contents)
			}

			calendarSelectionDialog(Array.from(calendarInfos.values()), this.logins.getUserController(), groupColors, async (dialog, selectedCalendar) => {
				dialog.close()

				const defaultDateProvider = new DefaultDateProvider()
				const calendarImporter = new CalendarImporter(
					calendarModel,
					new ImportInteractionHandler(),
					this.operationProgressTracker,
					new EventSeriesResolver(calendarModel, defaultDateProvider),
					defaultDateProvider.timeZone(),
				)
				await calendarImporter.import(
					selectedCalendar.groupRoot,
					selectedCalendar,
					parsedEvents,
					CalendarImporter.classifyImportedEvents,
					selectedCalendar.type,
				)
			})
		}
	}

	private alarmScheduler: () => Promise<AlarmScheduler> = lazyMemoized(async () => {
		const { AlarmScheduler } = await import("../common/calendar/date/AlarmScheduler")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const dateProvider = new DefaultDateProvider()
		return new AlarmScheduler(dateProvider, await this.scheduler())
	})

	private async scheduler(): Promise<SchedulerImpl> {
		const dateProvider = await this.noZoneDateProvider()
		return new SchedulerImpl(dateProvider, window, window)
	}

	async calendarEventPreviewModel(
		selectedEvent: CalendarEvent,
		calendars: ReadonlyMap<string, CalendarInfo>,
		highlightedTokens: readonly SearchToken[],
	): Promise<CalendarEventPreviewViewModel> {
		const { findAttendeeInAddresses } = await import("../common/api/common/utils/CommonCalendarUtils.js")
		const { getEventType } = await import("../calendar-app/calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")

		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()

		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)

		const userController = this.logins.getUserController()
		const customer = await userController.reloadCustomer()
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo)
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses)
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController)
		const hasBusinessFeature = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await userController.isNewPaidPlan())
		const lazyIndexEntry = async () =>
			selectedEvent.uid != null && selectedEvent._ownerGroup != null
				? this.calendarFacade.getEventsByUid(selectedEvent.uid, selectedEvent._ownerGroup)
				: null
		const popupModel = new CalendarEventPreviewViewModel(
			selectedEvent,
			await this.calendarModel(),
			eventType,
			hasBusinessFeature,
			ownAttendee,
			lazyIndexEntry,
			async (mode: CalendarOperation, event: CalendarEvent) => this.calendarEventModel(mode, event, mailboxDetails, mailboxProperties, null),
			this.calendarInviteHandler,
			highlightedTokens,
		)

		// If we have a preview model we want to display the description
		// so makes sense to already sanitize it after building the event
		await popupModel.sanitizeDescription()

		return popupModel
	}

	async calendarContactPreviewModel(event: CalendarEvent, contact: Contact, canEdit: boolean): Promise<CalendarContactPreviewViewModel> {
		const { CalendarContactPreviewViewModel } = await import("../calendar-app/calendar/gui/eventpopup/CalendarContactPreviewViewModel.js")
		return new CalendarContactPreviewViewModel(event, contact, canEdit)
	}

	readonly nativeContactsSyncManager: () => NativeContactsSyncManager = lazyMemoized(() => {
		assert(isApp(), "isApp")
		return new NativeContactsSyncManager(this.logins, this.mobileContactsFacade, this.entityClient, this.eventController, this.contactModel, deviceConfig)
	})

	postLoginActions: () => Promise<PostLoginActions> = lazyMemoized(async () => {
		const { PostLoginActions } = await import("../common/login/PostLoginActions")
		return new PostLoginActions(
			this.credentialsProvider,
			this.secondFactorHandler,
			this.connectivityModel,
			this.logins,
			await this.noZoneDateProvider(),
			this.entityClient,
			this.userManagementFacade,
			this.customerFacade,
			this.themeController,
			this.syncTracker,
			() => this.showSetupWizard(),
			() => this.updateClients(),
			this.loginFacade,
		)
	})

	showSetupWizard = async () => {
		if (isApp()) {
			const { showSetupWizard } = await import("../common/native/wizard/SetupWizard.js")
			return showSetupWizard(
				this.systemPermissionHandler,
				this.pushService,
				this.webMobileFacade,
				await this.contactImporter(),
				this.systemFacade,
				this.credentialsProvider,
				await this.nativeContactsSyncManager(),
				deviceConfig,
				true,
			)
		}
	}

	async updateClients(): Promise<void> {
		if (isDesktop()) {
			await this.desktopSettingsFacade.manualUpdate()
		} else if (isApp()) {
			if (isAndroidApp()) {
				this.nativeInterfaces?.mobileSystemFacade.openLink("market://details?id=de.tutao.tutanota")
			} else if (isIOSApp()) {
				this.nativeInterfaces?.mobileSystemFacade.openLink("itms-apps://itunes.apple.com/app/id922429609")
			}
		} else {
			// web version
			const registration = await navigator.serviceWorker?.getRegistration()
			if (registration?.waiting) {
				registration.waiting.postMessage("update")
			} else {
				windowFacade.reload({})
			}
		}
	}

	readonly credentialFormatMigrator: () => Promise<CredentialFormatMigrator> = lazyMemoized(async () => {
		const { CredentialFormatMigrator } = await import("../common/misc/credentials/CredentialFormatMigrator.js")
		if (isDesktop()) {
			return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, null)
		} else if (isApp()) {
			return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, this.systemFacade)
		} else {
			return new CredentialFormatMigrator(deviceConfig, null, null)
		}
	})

	async addNotificationEmailDialog(): Promise<AddNotificationEmailDialog> {
		const { AddNotificationEmailDialog } = await import("./settings/AddNotificationEmailDialog.js")
		return new AddNotificationEmailDialog(this.logins, this.entityClient)
	}

	readonly mailExportController: () => Promise<MailExportController> = lazyMemoized(async () => {
		const { getHtmlSanitizer } = await import("../common/misc/HtmlSanitizer")
		const { MailExportController } = await import("./native/main/MailExportController.js")
		return new MailExportController(
			this.mailExportFacade,
			getHtmlSanitizer(),
			this.exportFacade,
			this.logins,
			this.mailboxModel,
			await this.scheduler(),
			this.mailModel,
		)
	})

	async offlineStorageSettingsModel(): Promise<OfflineStorageSettingsModel | null> {
		if (!isBrowser() && !isAdminClient()) {
			return new OfflineStorageSettingsModel(this.logins.getUserController(), deviceConfig)
		} else {
			return null
		}
	}

	readonly undoModel: lazyAsync<UndoModel> = lazyMemoized(async () => {
		const { UndoModel } = await import("./UndoModel.js")
		return new UndoModel()
	})

	/**
	 * Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
	 */
	private async createCredentialsProvider(): Promise<CredentialsProvider> {
		const { CredentialsProvider } = await import("../common/misc/credentials/CredentialsProvider.js")
		if (isDesktop() || isApp()) {
			return new CredentialsProvider(this.nativeCredentialsFacade, this.sqlCipherFacade, isDesktop() ? this.interWindowEventSender : null)
		} else {
			const { WebCredentialsFacade } = await import("../common/misc/credentials/WebCredentialsFacade.js")
			return new CredentialsProvider(new WebCredentialsFacade(deviceConfig), null, null)
		}
	}

	readonly driveViewModel: lazyAsync<DriveViewModel> = lazyMemoized(async () => {
		const { DriveViewModel } = await import("../drive-app/drive/view/DriveViewModel.js")
		const router = new ScopedThrottledRouter("/drive")
		const { DriveTransferController } = await import("../drive-app/drive/view/DriveTransferController.js")
		const { WebFileResolver } = await import("../drive-app/drive/view/WebFileResolver.js")

		const redraw = await this.redraw()
		const driveUploadStackModel = new DriveTransferController(this.driveFacade, this.blobFacade, redraw, this.fileController)

		const model = new DriveViewModel(
			this.entityClient,
			this.driveFacade,
			router,
			this.transferProgressDispatcher,
			this.eventController,
			this.logins,
			this.userManagementFacade,
			driveUploadStackModel,
			isDesktop() ? new WebFileResolver(window.nativeApp, this.fileApp, this.desktopSystemFacade) : null,
			redraw,
		)
		await model.init()

		return model
	})

	async showMoveItemDialog(items: FolderItem[], moveItems: MoveItems) {
		const { showMoveDialog } = await import("../drive-app/drive/view/DriveMoveItemDialog.js")
		showMoveDialog(this.entityClient, this.driveFacade, items, moveItems)
	}

	async driveFilePicker(): Promise<DriveFilePicker> {
		if (isDesktop() || isApp()) {
			const { AppFilePicker } = await import("../drive-app/drive/view/DriveFilePicker.js")
			return new AppFilePicker(this.fileApp)
		} else {
			const { WebFilePicker } = await import("../drive-app/drive/view/DriveFilePicker.js")
			return new WebFilePicker()
		}
	}
}

export type IMailLocator = Readonly<MailLocator>

export const mailLocator: IMailLocator = new MailLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = mailLocator
}
