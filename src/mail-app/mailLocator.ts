import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp, isTest } from "../common/api/common/Env.js"
import { EventController } from "../common/api/main/EventController.js"
import { SearchModel } from "./search/model/SearchModel.js"
import { type MailboxDetail, MailboxModel } from "../common/mailFunctionality/MailboxModel.js"
import { MinimizedMailEditorViewModel } from "./mail/model/MinimizedMailEditorViewModel.js"
import { ContactModel } from "../common/contactsFunctionality/ContactModel.js"
import { EntityClient } from "../common/api/common/EntityClient.js"
import { ProgressTracker } from "../common/api/main/ProgressTracker.js"
import { CredentialsProvider } from "../common/misc/credentials/CredentialsProvider.js"
import { bootstrapWorker, WorkerClient } from "../common/api/main/WorkerClient.js"
import { CALENDAR_MIME_TYPE, FileController, guiDownload, VCARD_MIME_TYPES } from "../common/file/FileController.js"
import { SecondFactorHandler } from "../common/misc/2fa/SecondFactorHandler.js"
import { WebauthnClient } from "../common/misc/2fa/webauthn/WebauthnClient.js"
import { LoginFacade } from "../common/api/worker/facades/LoginFacade.js"
import { LoginController } from "../common/api/main/LoginController.js"
import { AppHeaderAttrs, Header } from "../common/gui/Header.js"
import { CustomerFacade } from "../common/api/worker/facades/lazy/CustomerFacade.js"
import { GiftCardFacade } from "../common/api/worker/facades/lazy/GiftCardFacade.js"
import { GroupManagementFacade } from "../common/api/worker/facades/lazy/GroupManagementFacade.js"
import { ConfigurationDatabase } from "../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "../common/api/worker/facades/lazy/CalendarFacade.js"
import { MailFacade } from "../common/api/worker/facades/lazy/MailFacade.js"
import { ShareFacade } from "../common/api/worker/facades/lazy/ShareFacade.js"
import { CounterFacade } from "../common/api/worker/facades/lazy/CounterFacade.js"
import { Indexer } from "./workerUtils/index/Indexer.js"
import { SearchFacade } from "./workerUtils/index/SearchFacade.js"
import { BookingFacade } from "../common/api/worker/facades/lazy/BookingFacade.js"
import { MailAddressFacade } from "../common/api/worker/facades/lazy/MailAddressFacade.js"
import { BlobFacade } from "../common/api/worker/facades/lazy/BlobFacade.js"
import { UserManagementFacade } from "../common/api/worker/facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "../common/api/worker/facades/lazy/RecoverCodeFacade.js"
import { ContactFacade } from "../common/api/worker/facades/lazy/ContactFacade.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestModel } from "../common/misc/UsageTestModel.js"
import { NewsModel } from "../common/misc/news/NewsModel.js"
import { IServiceExecutor } from "../common/api/common/ServiceRequest.js"
import { CryptoFacade } from "../common/api/worker/crypto/CryptoFacade.js"
import { SearchTextInAppFacade } from "../common/native/common/generatedipc/SearchTextInAppFacade.js"
import { SettingsFacade } from "../common/native/common/generatedipc/SettingsFacade.js"
import { DesktopSystemFacade } from "../common/native/common/generatedipc/DesktopSystemFacade.js"
import { WebMobileFacade } from "../common/native/main/WebMobileFacade.js"
import { SystemPermissionHandler } from "../common/native/main/SystemPermissionHandler.js"
import { InterWindowEventFacadeSendDispatcher } from "../common/native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { ExposedCacheStorage } from "../common/api/worker/rest/DefaultEntityRestCache.js"
import { WorkerFacade } from "../common/api/worker/facades/WorkerFacade.js"
import { PageContextLoginListener } from "../common/api/main/PageContextLoginListener.js"
import { WebsocketConnectivityModel } from "../common/misc/WebsocketConnectivityModel.js"
import { OperationProgressTracker } from "../common/api/main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../common/gui/InfoMessageHandler.js"
import { NativeInterfaces } from "../common/native/main/NativeInterfaceFactory.js"
import { EntropyFacade } from "../common/api/worker/facades/EntropyFacade.js"
import { SqlCipherFacade } from "../common/native/common/generatedipc/SqlCipherFacade.js"
import { assert, assertNotNull, defer, DeferredObject, lazy, lazyAsync, LazyLoaded, lazyMemoized, noOp, ofClass } from "@tutao/tutanota-utils"
import { RecipientsModel } from "../common/api/main/RecipientsModel.js"
import { NoZoneDateProvider } from "../common/api/common/utils/NoZoneDateProvider.js"
import { CalendarEvent, CalendarEventAttendee, Mail, MailboxProperties } from "../common/api/entities/tutanota/TypeRefs.js"
import { SendMailModel } from "../common/mailFunctionality/SendMailModel.js"
import { OfflineIndicatorViewModel } from "../common/gui/base/OfflineIndicatorViewModel.js"
import { Router, ScopedRouter, ThrottledRouter } from "../common/gui/ScopedRouter.js"
import { deviceConfig } from "../common/misc/DeviceConfig.js"
import { InboxRuleHandler } from "./mail/model/InboxRuleHandler.js"
import { SearchViewModel } from "./search/view/SearchViewModel.js"
import { SearchRouter } from "../common/search/view/SearchRouter.js"
import { MailOpenedListener } from "./mail/view/MailViewModel.js"
import { getEnabledMailAddressesWithUser } from "../common/mailFunctionality/SharedMailUtils.js"
import { Const, FeatureType, GroupType, KdfType, MailSetKind } from "../common/api/common/TutanotaConstants.js"
import { ShareableGroupType } from "../common/sharing/GroupUtils.js"
import { ReceivedGroupInvitationsModel } from "../common/sharing/model/ReceivedGroupInvitationsModel.js"
import { CalendarViewModel } from "../calendar-app/calendar/view/CalendarViewModel.js"
import { CalendarEventModel, CalendarOperation } from "../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarEventsRepository } from "../common/calendar/date/CalendarEventsRepository.js"
import { showProgressDialog } from "../common/gui/dialogs/ProgressDialog.js"
import { RecipientsSearchModel } from "../common/misc/RecipientsSearchModel.js"
import { PermissionError } from "../common/api/common/error/PermissionError.js"
import { ConversationViewModel, ConversationViewModelFactory } from "./mail/view/ConversationViewModel.js"
import { CreateMailViewerOptions } from "./mail/view/MailViewer.js"
import { MailViewerViewModel } from "./mail/view/MailViewerViewModel.js"
import { ExternalLoginViewModel } from "./mail/view/ExternalLoginView.js"
import { NativeInterfaceMain } from "../common/native/main/NativeInterfaceMain.js"
import { NativeFileApp } from "../common/native/common/FileApp.js"
import type { NativePushServiceApp } from "../common/native/main/NativePushServiceApp.js"
import { CommonSystemFacade } from "../common/native/common/generatedipc/CommonSystemFacade.js"
import { ThemeFacade } from "../common/native/common/generatedipc/ThemeFacade.js"
import { MobileSystemFacade } from "../common/native/common/generatedipc/MobileSystemFacade.js"
import { MobileContactsFacade } from "../common/native/common/generatedipc/MobileContactsFacade.js"
import { NativeCredentialsFacade } from "../common/native/common/generatedipc/NativeCredentialsFacade.js"
import { MailAddressNameChanger, MailAddressTableModel } from "../common/settings/mailaddress/MailAddressTableModel.js"
import { GroupInfo } from "../common/api/entities/sys/TypeRefs.js"
import { DrawerMenuAttrs } from "../common/gui/nav/DrawerMenu.js"
import { DomainConfigProvider } from "../common/api/common/DomainConfigProvider.js"
import { CredentialRemovalHandler } from "../common/login/CredentialRemovalHandler.js"
import { LoginViewModel } from "../common/login/LoginViewModel.js"
import { ProgrammingError } from "../common/api/common/error/ProgrammingError.js"
import { EntropyCollector } from "../common/api/main/EntropyCollector.js"
import { notifications } from "../common/gui/Notifications.js"
import { windowFacade } from "../common/misc/WindowFacade.js"
import { BrowserWebauthn } from "../common/misc/2fa/webauthn/BrowserWebauthn.js"
import { FileControllerBrowser } from "../common/file/FileControllerBrowser.js"
import { FileControllerNative } from "../common/file/FileControllerNative.js"
import { CalendarInfo, CalendarModel } from "../calendar-app/calendar/model/CalendarModel.js"
import { CalendarInviteHandler } from "../calendar-app/calendar/view/CalendarInvites.js"
import { AlarmScheduler } from "../common/calendar/date/AlarmScheduler.js"
import { SchedulerImpl } from "../common/api/common/utils/Scheduler.js"
import { CalendarEventPreviewViewModel } from "../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import { isCustomizationEnabledForCustomer } from "../common/api/common/utils/CustomerUtils.js"
import { NativeContactsSyncManager } from "./contacts/model/NativeContactsSyncManager.js"
import { PostLoginActions } from "../common/login/PostLoginActions.js"
import { CredentialFormatMigrator } from "../common/misc/credentials/CredentialFormatMigrator.js"
import { AddNotificationEmailDialog } from "./settings/AddNotificationEmailDialog.js"
import { NativeThemeFacade, ThemeController, WebThemeFacade } from "../common/gui/ThemeController.js"
import { HtmlSanitizer } from "../common/misc/HtmlSanitizer.js"
import { theme } from "../common/gui/theme.js"
import { SearchIndexStateInfo } from "../common/api/worker/search/SearchTypes.js"
import { MobilePaymentsFacade } from "../common/native/common/generatedipc/MobilePaymentsFacade.js"
import { AppStorePaymentPicker } from "../common/misc/AppStorePaymentPicker.js"
import { MAIL_PREFIX } from "../common/misc/RouteChange.js"
import { getDisplayedSender } from "../common/api/common/CommonMailUtils.js"
import { MailModel } from "./mail/model/MailModel.js"
import { locator } from "../common/api/main/CommonLocator.js"
import { showSnackBar } from "../common/gui/base/SnackBar.js"
import { assertSystemFolderOfType } from "./mail/model/MailUtils.js"
import { WorkerRandomizer } from "../common/api/worker/workerInterfaces.js"
import { SearchCategoryTypes } from "./search/model/SearchUtils.js"
import { WorkerInterface } from "./workerUtils/worker/WorkerImpl.js"
import { isMailInSpamOrTrash } from "./mail/model/MailChecks.js"
import type { ContactImporter } from "./contacts/ContactImporter.js"
import { ExternalCalendarFacade } from "../common/native/common/generatedipc/ExternalCalendarFacade.js"
import { AppType } from "../common/misc/ClientConstants.js"
import { ParsedEvent } from "../common/calendar/import/CalendarImporter.js"

assertMainOrNode()

class MailLocator {
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
	giftCardFacade!: GiftCardFacade
	groupManagementFacade!: GroupManagementFacade
	configFacade!: ConfigurationDatabase
	calendarFacade!: CalendarFacade
	mailFacade!: MailFacade
	shareFacade!: ShareFacade
	counterFacade!: CounterFacade
	indexerFacade!: Indexer
	searchFacade!: SearchFacade
	bookingFacade!: BookingFacade
	mailAddressFacade!: MailAddressFacade
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
	appStorePaymentPicker!: AppStorePaymentPicker

	private nativeInterfaces: NativeInterfaces | null = null
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
			newsModel: this.newsModel,
		}
	}

	readonly mailViewModel = lazyMemoized(async () => {
		const { MailViewModel } = await import("../mail-app/mail/view/MailViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const router = new ScopedRouter(this.throttledRouter(), "/mail")
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
			this.inboxRuleHanlder(),
			router,
			await this.redraw(),
		)
	})

	readonly affiliateViewModel = lazyMemoized(async () => {
		const { AffiliateViewModel } = await import("../common/settings/AffiliateViewModel.js")
		return new AffiliateViewModel()
	})

	inboxRuleHanlder(): InboxRuleHandler {
		return new InboxRuleHandler(this.mailFacade, this.logins)
	}

	async searchViewModelFactory(): Promise<() => SearchViewModel> {
		const { SearchViewModel } = await import("../mail-app/search/view/SearchViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const redraw = await this.redraw()
		const searchRouter = await this.scopedSearchRouter()
		return () => {
			return new SearchViewModel(
				searchRouter,
				this.search,
				this.searchFacade,
				this.mailboxModel,
				this.logins,
				this.indexerFacade,
				this.entityClient,
				this.eventController,
				this.mailOpenedListener,
				this.calendarFacade,
				this.progressTracker,
				conversationViewModelFactory,
				redraw,
				deviceConfig.getMailAutoSelectBehavior(),
			)
		}
	}

	readonly throttledRouter: lazy<Router> = lazyMemoized(() => new ThrottledRouter())

	readonly scopedSearchRouter: lazyAsync<SearchRouter> = lazyMemoized(async () => {
		const { SearchRouter } = await import("../common/search/view/SearchRouter.js")
		return new SearchRouter(new ScopedRouter(this.throttledRouter(), "/search"))
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

	readonly contactViewModel = lazyMemoized(async () => {
		const { ContactViewModel } = await import("../mail-app/contacts/view/ContactViewModel.js")
		const router = new ScopedRouter(this.throttledRouter(), "/contact")
		return new ContactViewModel(this.contactModel, this.entityClient, this.eventController, router, await this.redraw())
	})

	readonly contactListViewModel = lazyMemoized(async () => {
		const { ContactListViewModel } = await import("../mail-app/contacts/view/ContactListViewModel.js")
		const router = new ScopedRouter(this.throttledRouter(), "/contactlist")
		return new ContactListViewModel(
			this.entityClient,
			this.groupManagementFacade,
			this.logins,
			this.eventController,
			this.contactModel,
			await this.receivedGroupInvitationsModel(GroupType.ContactList),
			router,
			await this.redraw(),
		)
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
			await this.calendarModel(),
			await this.calendarEventsRepository(),
			this.entityClient,
			this.eventController,
			this.progressTracker,
			deviceConfig,
			await this.receivedGroupInvitationsModel(GroupType.Calendar),
			timeZone,
			this.mailboxModel,
		)
	})

	readonly calendarEventsRepository: lazyAsync<CalendarEventsRepository> = lazyMemoized(async () => {
		const { CalendarEventsRepository } = await import("../common/calendar/date/CalendarEventsRepository.js")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarEventsRepository(await this.calendarModel(), this.calendarFacade, timeZone, this.entityClient, this.eventController)
	})

	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	private async sendMailModelSyncFactory(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<() => SendMailModel> {
		const { SendMailModel } = await import("../common/mailFunctionality/SendMailModel.js")
		const recipientsModel = await this.recipientsModel()
		const dateProvider = await this.noZoneDateProvider()
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
				async (mail: Mail) => {
					return await isMailInSpamOrTrash(mail, mailLocator.mailModel)
				},
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
			getTimeZone(),
			showProgress,
		)
	}

	async recipientsSearchModel(): Promise<RecipientsSearchModel> {
		const { RecipientsSearchModel } = await import("../common/misc/RecipientsSearchModel.js")
		const suggestionsProvider = isApp()
			? (query: string) => this.mobileContactsFacade.findSuggestions(query).catch(ofClass(PermissionError, () => []))
			: null
		return new RecipientsSearchModel(await this.recipientsModel(), this.contactModel, suggestionsProvider, this.entityClient)
	}

	readonly conversationViewModelFactory: lazyAsync<ConversationViewModelFactory> = async () => {
		const { ConversationViewModel } = await import("../mail-app/mail/view/ConversationViewModel.js")
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
		const { ContactImporter } = await import("../mail-app/contacts/ContactImporter.js")
		return new ContactImporter(
			this.contactFacade,
			this.systemPermissionHandler,
			isApp() ? this.mobileContactsFacade : null,
			isApp() ? this.nativeContactsSyncManager() : null,
		)
	}

	async mailViewerViewModelFactory(): Promise<(options: CreateMailViewerOptions) => MailViewerViewModel> {
		const { MailViewerViewModel } = await import("../mail-app/mail/view/MailViewerViewModel.js")
		return ({ mail, showFolder }) =>
			new MailViewerViewModel(
				mail,
				showFolder,
				this.entityClient,
				this.mailboxModel,
				this.mailModel,
				this.contactModel,
				this.configFacade,
				this.fileController,
				this.logins,
				async (mailboxDetails) => {
					const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
					return this.sendMailModel(mailboxDetails, mailboxProperties)
				},
				this.eventController,
				this.workerFacade,
				this.search,
				this.mailFacade,
				this.cryptoFacade,
				() => this.contactImporter(),
			)
	}

	async externalLoginViewModelFactory(): Promise<() => ExternalLoginViewModel> {
		const { ExternalLoginViewModel } = await import("./mail/view/ExternalLoginView.js")
		return () => new ExternalLoginViewModel(this.credentialsProvider)
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
			this.logins.getUserController().userGroupInfo,
			nameChanger,
			await this.redraw(),
		)
	}

	async mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userGroupInfo: GroupInfo): Promise<MailAddressTableModel> {
		const { MailAddressTableModel } = await import("../common/settings/mailaddress/MailAddressTableModel.js")
		const nameChanger = await this.adminNameChanger(mailGroupId, userId)
		return new MailAddressTableModel(
			this.entityClient,
			this.serviceExecutor,
			this.mailAddressFacade,
			this.logins,
			this.eventController,
			userGroupInfo,
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
			  })
	}

	async loginViewModelFactory(): Promise<lazy<LoginViewModel>> {
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
	}

	private getNativeInterface<T extends keyof NativeInterfaces>(name: T): NativeInterfaces[T] {
		if (!this.nativeInterfaces) {
			throw new ProgrammingError(`Tried to use ${name} in web`)
		}

		return this.nativeInterfaces[name]
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

	async init(): Promise<void> {
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
			configFacade,
			calendarFacade,
			mailFacade,
			shareFacade,
			counterFacade,
			indexerFacade,
			searchFacade,
			bookingFacade,
			mailAddressFacade,
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
		} = this.worker.getWorkerInterface() as WorkerInterface
		this.loginFacade = loginFacade
		this.customerFacade = customerFacade
		this.giftCardFacade = giftCardFacade
		this.groupManagementFacade = groupManagementFacade
		this.configFacade = configFacade
		this.calendarFacade = calendarFacade
		this.mailFacade = mailFacade
		this.shareFacade = shareFacade
		this.counterFacade = counterFacade
		this.indexerFacade = indexerFacade
		this.searchFacade = searchFacade
		this.bookingFacade = bookingFacade
		this.mailAddressFacade = mailAddressFacade
		this.blobFacade = blobFacade
		this.userManagementFacade = userManagementFacade
		this.recoverCodeFacade = recoverCodeFacade
		this.contactFacade = contactFacade
		this.serviceExecutor = serviceExecutor
		this.sqlCipherFacade = sqlCipherFacade
		this.logins = new LoginController(this.loginFacade, async () => this.loginListener)
		// Should be called elsewhere later e.g. in CommonLocator
		this.logins.init()
		this.eventController = new EventController(mailLocator.logins)
		this.progressTracker = new ProgressTracker()
		this.search = new SearchModel(this.searchFacade, () => this.calendarEventsRepository())
		this.entityClient = new EntityClient(restInterface)
		this.cryptoFacade = cryptoFacade
		this.cacheStorage = cacheStorage
		this.entropyFacade = entropyFacade
		this.workerFacade = workerFacade
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
			this.inboxRuleHanlder(),
		)
		this.operationProgressTracker = new OperationProgressTracker()
		this.infoMessageHandler = new InfoMessageHandler((state: SearchIndexStateInfo) => {
			mailLocator.search.indexState(state)
		})

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
		)
		this.usageTestController = new UsageTestController(this.usageTestModel)

		this.Const = Const
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("../common/native/main/WebDesktopFacade")
			const { WebMobileFacade } = await import("../common/native/main/WebMobileFacade.js")
			const { WebCommonNativeFacade } = await import("../common/native/main/WebCommonNativeFacade.js")
			const { WebInterWindowEventFacade } = await import("../common/native/main/WebInterWindowEventFacade.js")
			const { WebAuthnFacadeSendDispatcher } = await import("../common/native/common/generatedipc/WebAuthnFacadeSendDispatcher.js")
			const { OpenMailboxHandler } = await import("./native/main/OpenMailboxHandler.js")
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../common/native/main/NativeInterfaceFactory.js")
			const openMailboxHandler = new OpenMailboxHandler(this.logins, this.mailModel, this.mailboxModel)
			const { OpenCalendarHandler } = await import("../common/native/main/OpenCalendarHandler.js")
			const openCalendarHandler = new OpenCalendarHandler(this.logins)

			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, this.mailboxModel, MAIL_PREFIX, async (currentRoute: string) => {
				// If the first background column is focused in mail view (showing a folder), move to inbox.
				// If in inbox already, quit
				const parts = currentRoute.split("/").filter((part) => part !== "")

				if (parts.length > 1) {
					const selectedMailListId = parts[1]
					const [mailboxDetail] = await this.mailboxModel.getMailboxDetails()
					const folders = this.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
					const inboxMailListId = assertSystemFolderOfType(folders, MailSetKind.INBOX).mails

					if (inboxMailListId !== selectedMailListId) {
						return MAIL_PREFIX + "/" + inboxMailListId
					}
				}

				return null
			})

			this.nativeInterfaces = createNativeInterfaces(
				this.webMobileFacade,
				new WebDesktopFacade(this.logins, async () => this.native),
				new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig),
				new WebCommonNativeFacade(
					this.logins,
					this.mailboxModel,
					this.usageTestController,
					async () => this.fileApp,
					async () => this.pushService,
					this.handleFileImport.bind(this),
					(userId, address, requestedPath) => openMailboxHandler.openMailbox(userId, address, requestedPath),
					(userId) => openCalendarHandler.openCalendar(userId),
					AppType.Integrated,
				),
				cryptoFacade,
				calendarFacade,
				this.entityClient,
				this.logins,
				AppType.Integrated,
			)

			if (isElectronClient()) {
				const desktopInterfaces = createDesktopInterfaces(this.native)
				this.searchTextFacade = desktopInterfaces.searchTextFacade
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade
				}
			} else if (isAndroidApp() || isIOSApp()) {
				const { SystemPermissionHandler } = await import("../common/native/main/SystemPermissionHandler.js")
				this.systemPermissionHandler = new SystemPermissionHandler(this.systemFacade)
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())
			}
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
		this.credentialsProvider = await this.createCredentialsProvider()
		this.loginListener = new PageContextLoginListener(this.secondFactorHandler, this.credentialsProvider)
		this.random = random

		this.newsModel = new NewsModel(this.serviceExecutor, deviceConfig, async (name: string) => {
			switch (name) {
				case "usageOptIn":
					const { UsageOptInNews } = await import("../common/misc/news/items/UsageOptInNews.js")
					return new UsageOptInNews(this.newsModel, this.usageTestModel)
				case "recoveryCode":
					const { RecoveryCodeNews } = await import("../common/misc/news/items/RecoveryCodeNews.js")
					return new RecoveryCodeNews(this.newsModel, this.logins.getUserController(), this.recoverCodeFacade)
				case "pinBiometrics":
					const { PinBiometricsNews } = await import("../common/misc/news/items/PinBiometricsNews.js")
					return new PinBiometricsNews(this.newsModel, this.credentialsProvider, this.logins.getUserController().userId)
				case "referralLink":
					const { ReferralLinkNews } = await import("../common/misc/news/items/ReferralLinkNews.js")
					const dateProvider = await this.noZoneDateProvider()
					return new ReferralLinkNews(this.newsModel, dateProvider, this.logins.getUserController())
				case "richNotifications":
					const { RichNotificationsNews } = await import("../common/misc/news/items/RichNotificationsNews.js")
					return new RichNotificationsNews(this.newsModel, isApp() || isDesktop() ? this.pushService : null)
				default:
					console.log(`No implementation for news named '${name}'`)
					return null
			}
		})

		this.fileController =
			this.nativeInterfaces == null
				? new FileControllerBrowser(blobFacade, guiDownload)
				: new FileControllerNative(blobFacade, guiDownload, this.nativeInterfaces.fileApp)

		const { ContactModel } = await import("../common/contactsFunctionality/ContactModel.js")
		this.contactModel = new ContactModel(
			this.entityClient,
			this.logins,
			this.eventController,
			async (query: string, field: string, minSuggestionCount: number, maxResults?: number) => {
				const { createRestriction } = await import("./search/model/SearchUtils.js")
				return mailLocator.searchFacade.search(
					query,
					createRestriction(SearchCategoryTypes.contact, null, null, field, [], null),
					minSuggestionCount,
					maxResults,
				)
			},
		)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()
		this.appStorePaymentPicker = new AppStorePaymentPicker()

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
			: () => import("../common/misc/HtmlSanitizer").then(({ htmlSanitizer }) => htmlSanitizer)

		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Mail)

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
			this.entityClient,
			this.mailboxModel,
			this.calendarFacade,
			this.fileController,
			timeZone,
			!isBrowser() ? this.externalCalendarFacade : null,
			deviceConfig,
			!isBrowser() ? this.pushService : null,
		)
	})

	readonly calendarInviteHandler: () => Promise<CalendarInviteHandler> = lazyMemoized(async () => {
		const { CalendarInviteHandler } = await import("../calendar-app/calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("../calendar-app/calendar/view/CalendarNotificationSender.js")
		return new CalendarInviteHandler(this.mailboxModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) =>
			this.sendMailModel(...arg),
		)
	})

	private async handleFileImport(filesUris: ReadonlyArray<string>) {
		const files = await this.fileApp.getFilesMetaData(filesUris)
		const areAllFilesVCard = files.every((file) => file.mimeType === VCARD_MIME_TYPES.X_VCARD || file.mimeType === VCARD_MIME_TYPES.VCARD)
		const areAllFilesICS = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE)

		if (areAllFilesVCard) {
			const importer = await this.contactImporter()
			const { parseContacts } = await import("../mail-app/contacts/ContactImporter.js")
			// For now, we just handle .vcf files, so we don't need to care about the file type
			const contacts = await parseContacts(files, this.fileApp)
			const vCardData = contacts.join("\n")
			const contactListId = assertNotNull(await this.contactModel.getContactListId())

			await importer.importContactsFromFile(vCardData, contactListId)
		} else if (areAllFilesICS) {
			const calendarModel = await this.calendarModel()
			const groupSettings = this.logins.getUserController().userSettingsGroupRoot.groupSettings
			const calendarInfos = await calendarModel.getCalendarInfos()
			const groupColors: Map<Id, string> = groupSettings.reduce((acc, gc) => {
				acc.set(gc.group, gc.color)
				return acc
			}, new Map())

			const { calendarSelectionDialog, parseCalendarFile } = await import("../common/calendar/import/CalendarImporter.js")
			const { handleCalendarImport } = await import("../common/calendar/import/CalendarImporterDialog.js")

			let parsedEvents: ParsedEvent[] = []

			for (const fileRef of files) {
				const dataFile = await this.fileApp.readDataFile(fileRef.location)
				if (dataFile == null) continue

				const data = parseCalendarFile(dataFile)
				parsedEvents.push(...data.contents)
			}

			calendarSelectionDialog(Array.from(calendarInfos.values()), this.logins.getUserController(), groupColors, (dialog, selectedCalendar) => {
				dialog.close()
				handleCalendarImport(selectedCalendar.groupRoot, parsedEvents)
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

	async calendarEventPreviewModel(selectedEvent: CalendarEvent, calendars: ReadonlyMap<string, CalendarInfo>): Promise<CalendarEventPreviewViewModel> {
		const { findAttendeeInAddresses } = await import("../common/api/common/utils/CommonCalendarUtils.js")
		const { getEventType } = await import("../calendar-app/calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")

		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()

		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)

		const userController = this.logins.getUserController()
		const customer = await userController.loadCustomer()
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo)
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses)
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController)
		const hasBusinessFeature = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await userController.isNewPaidPlan())
		const lazyIndexEntry = async () => (selectedEvent.uid != null ? this.calendarFacade.getEventsByUid(selectedEvent.uid) : null)
		const popupModel = new CalendarEventPreviewViewModel(
			selectedEvent,
			await this.calendarModel(),
			eventType,
			hasBusinessFeature,
			ownAttendee,
			lazyIndexEntry,
			async (mode: CalendarOperation) => this.calendarEventModel(mode, selectedEvent, mailboxDetails, mailboxProperties, null),
		)

		// If we have a preview model we want to display the description
		// so makes sense to already sanitize it after building the event
		await popupModel.sanitizeDescription()

		return popupModel
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
			() => this.showSetupWizard(),
			() => {
				mailLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
				mailLocator.nativeContactsSyncManager()?.syncContacts()
			},
			() => this.handleExternalSync(),
		)
	})

	showSetupWizard = async () => {
		if (isApp()) {
			const { showSetupWizard } = await import("../common/native/main/wizard/SetupWizard.js")
			return showSetupWizard(
				this.systemPermissionHandler,
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

	async handleExternalSync() {
		const calendarModel = await locator.calendarModel()

		if (isApp() || isDesktop()) {
			calendarModel.syncExternalCalendars().catch(async (e) => {
				showSnackBar({
					message: () => e.message,
					button: {
						label: "ok_action",
						click: noOp,
					},
					waitingTime: 1000,
				})
			})
			calendarModel.scheduleExternalCalendarSync()
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
		const { AddNotificationEmailDialog } = await import("../mail-app/settings/AddNotificationEmailDialog.js")
		return new AddNotificationEmailDialog(this.logins, this.entityClient)
	}

	// For testing argon2 migration after login. The production server will reject this request.
	// This can be removed when we enable the migration.
	async changeToBycrypt(passphrase: string): Promise<unknown> {
		const currentUser = this.logins.getUserController().user
		return this.loginFacade.migrateKdfType(KdfType.Bcrypt, passphrase, currentUser)
	}

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
}

export type IMailLocator = Readonly<MailLocator>

export const mailLocator: IMailLocator = new MailLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = mailLocator
}
