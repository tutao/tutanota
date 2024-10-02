import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp, isTest } from "../common/api/common/Env.js"
import { EventController } from "../common/api/main/EventController.js"
import { type MailboxDetail, MailboxModel } from "../common/mailFunctionality/MailboxModel.js"
import { ContactModel } from "../common/contactsFunctionality/ContactModel.js"
import { EntityClient } from "../common/api/common/EntityClient.js"
import { ProgressTracker } from "../common/api/main/ProgressTracker.js"
import { CredentialsProvider } from "../common/misc/credentials/CredentialsProvider.js"
import { bootstrapWorker, WorkerClient } from "../common/api/main/WorkerClient.js"
import { CALENDAR_MIME_TYPE, FileController, guiDownload } from "../common/file/FileController.js"
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
import { assertNotNull, defer, DeferredObject, lazy, lazyAsync, LazyLoaded, lazyMemoized, noOp, ofClass } from "@tutao/tutanota-utils"
import { RecipientsModel } from "../common/api/main/RecipientsModel.js"
import { NoZoneDateProvider } from "../common/api/common/utils/NoZoneDateProvider.js"
import { CalendarEvent, CalendarEventAttendee, Mail, MailboxProperties } from "../common/api/entities/tutanota/TypeRefs.js"
import { SendMailModel } from "../common/mailFunctionality/SendMailModel.js"
import { OfflineIndicatorViewModel } from "../common/gui/base/OfflineIndicatorViewModel.js"
import { Router, ScopedRouter, ThrottledRouter } from "../common/gui/ScopedRouter.js"
import { deviceConfig } from "../common/misc/DeviceConfig.js"
import { CalendarSearchViewModel } from "./calendar/search/view/CalendarSearchViewModel.js"
import { SearchRouter } from "../common/search/view/SearchRouter.js"
import { getEnabledMailAddressesWithUser } from "../common/mailFunctionality/SharedMailUtils.js"
import { Const, FeatureType, GroupType, KdfType } from "../common/api/common/TutanotaConstants.js"
import { ShareableGroupType } from "../common/sharing/GroupUtils.js"
import { ReceivedGroupInvitationsModel } from "../common/sharing/model/ReceivedGroupInvitationsModel.js"
import { CalendarViewModel } from "./calendar/view/CalendarViewModel.js"
import { CalendarEventModel, CalendarOperation } from "./calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarEventsRepository } from "../common/calendar/date/CalendarEventsRepository.js"
import { showProgressDialog } from "../common/gui/dialogs/ProgressDialog.js"
import { RecipientsSearchModel } from "../common/misc/RecipientsSearchModel.js"
import { PermissionError } from "../common/api/common/error/PermissionError.js"
import { NativeInterfaceMain } from "../common/native/main/NativeInterfaceMain.js"
import { NativeFileApp } from "../common/native/common/FileApp.js"
import { NativePushServiceApp } from "../common/native/main/NativePushServiceApp.js"
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
import { CalendarInfo, CalendarModel } from "./calendar/model/CalendarModel.js"
import { CalendarInviteHandler } from "./calendar/view/CalendarInvites.js"
import { AlarmScheduler } from "../common/calendar/date/AlarmScheduler.js"
import { SchedulerImpl } from "../common/api/common/utils/Scheduler.js"
import { CalendarEventPreviewViewModel } from "./calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import { isCustomizationEnabledForCustomer } from "../common/api/common/utils/CustomerUtils.js"
import { PostLoginActions } from "../common/login/PostLoginActions.js"
import { CredentialFormatMigrator } from "../common/misc/credentials/CredentialFormatMigrator.js"
import { MobilePaymentsFacade } from "../common/native/common/generatedipc/MobilePaymentsFacade.js"
import { AppStorePaymentPicker } from "../common/misc/AppStorePaymentPicker.js"
import { NativeThemeFacade, ThemeController, WebThemeFacade } from "../common/gui/ThemeController.js"
import type { HtmlSanitizer } from "../common/misc/HtmlSanitizer.js"
import { theme } from "../common/gui/theme.js"
import { CalendarSearchModel } from "./calendar/search/model/CalendarSearchModel.js"
import { SearchIndexStateInfo } from "../common/api/worker/search/SearchTypes.js"
import { CALENDAR_PREFIX } from "../common/misc/RouteChange.js"
import { AppType } from "../common/misc/ClientConstants.js"
import type { ParsedEvent } from "../common/calendar/import/CalendarImporter.js"
import { ExternalCalendarFacade } from "../common/native/common/generatedipc/ExternalCalendarFacade.js"
import { locator } from "../common/api/main/CommonLocator.js"
import { showSnackBar } from "../common/gui/base/SnackBar.js"
import { DbError } from "../common/api/common/error/DbError.js"
import { WorkerRandomizer } from "../common/api/worker/workerInterfaces.js"

assertMainOrNode()

class CalendarLocator {
	eventController!: EventController
	search!: CalendarSearchModel
	mailboxModel!: MailboxModel
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

	async searchViewModelFactory(): Promise<() => CalendarSearchViewModel> {
		const { CalendarSearchViewModel } = await import("./calendar/search/view/CalendarSearchViewModel.js")
		const redraw = await this.redraw()
		const searchRouter = await this.scopedSearchRouter()
		return () => {
			return new CalendarSearchViewModel(
				searchRouter,
				this.search,
				this.logins,
				this.entityClient,
				this.eventController,
				this.calendarFacade,
				this.progressTracker,
				redraw,
			)
		}
	}

	async calendarSearchViewModelFactory(): Promise<() => CalendarSearchViewModel> {
		const { CalendarSearchViewModel } = await import("./calendar/search/view/CalendarSearchViewModel.js")
		const redraw = await this.redraw()
		const searchRouter = await this.scopedSearchRouter()
		return () => {
			return new CalendarSearchViewModel(
				searchRouter,
				this.search,
				this.logins,
				this.entityClient,
				this.eventController,
				this.calendarFacade,
				this.progressTracker,
				redraw,
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

	async receivedGroupInvitationsModel<TypeOfGroup extends ShareableGroupType>(groupType: TypeOfGroup): Promise<ReceivedGroupInvitationsModel<TypeOfGroup>> {
		const { ReceivedGroupInvitationsModel } = await import("../common/sharing/model/ReceivedGroupInvitationsModel.js")
		return new ReceivedGroupInvitationsModel<TypeOfGroup>(groupType, this.eventController, this.entityClient, this.logins)
	}

	readonly calendarViewModel = lazyMemoized<Promise<CalendarViewModel>>(async () => {
		const { CalendarViewModel } = await import("./calendar/view/CalendarViewModel.js")
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
					return false
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
			import("./calendar/gui/eventeditor-model/CalendarEventModel.js"),
			import("../common/calendar/date/CalendarUtils.js"),
			import("./calendar/view/CalendarNotificationSender.js"),
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
			: new AppsCredentialRemovalHandler(this.pushService, this.configFacade, async () => {
					// nothing needs to be specifically done for the calendar app right now.
					noOp()
			  })
	}

	async loginViewModelFactory(): Promise<lazy<LoginViewModel>> {
		const { LoginViewModel } = await import("../common/login/LoginViewModel.js")
		const credentialsRemovalHandler = await calendarLocator.credentialsRemovalHandler()
		const { MobileAppLock, NoOpAppLock } = await import("../common/login/AppLock.js")
		const appLock = isApp()
			? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade)
			: new NoOpAppLock()
		return () => {
			const domainConfig = isBrowser()
				? calendarLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port)
				: // in this case, we know that we have a staticUrl set that we need to use
				  calendarLocator.domainConfigProvider().getCurrentDomainConfig()

			return new LoginViewModel(
				calendarLocator.logins,
				calendarLocator.credentialsProvider,
				calendarLocator.secondFactorHandler,
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
		} = this.worker.getWorkerInterface()
		this.loginFacade = loginFacade
		this.customerFacade = customerFacade
		this.giftCardFacade = giftCardFacade
		this.groupManagementFacade = groupManagementFacade
		this.configFacade = configFacade
		this.calendarFacade = calendarFacade
		this.mailFacade = mailFacade
		this.shareFacade = shareFacade
		this.counterFacade = counterFacade
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
		this.eventController = new EventController(calendarLocator.logins)
		this.progressTracker = new ProgressTracker()
		this.search = new CalendarSearchModel(() => this.calendarEventsRepository())
		this.entityClient = new EntityClient(restInterface)
		this.cryptoFacade = cryptoFacade
		this.cacheStorage = cacheStorage
		this.entropyFacade = entropyFacade
		this.workerFacade = workerFacade
		this.connectivityModel = new WebsocketConnectivityModel(eventBus)
		this.mailboxModel = new MailboxModel(this.eventController, this.entityClient, this.logins)
		this.operationProgressTracker = new OperationProgressTracker()
		this.infoMessageHandler = new InfoMessageHandler((state: SearchIndexStateInfo) => {
			// calendar does not have index, so nothing needs to be handled here
			noOp()
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
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../common/native/main/NativeInterfaceFactory.js")
			const { OpenCalendarHandler } = await import("../common/native/main/OpenCalendarHandler.js")
			const openCalendarHandler = new OpenCalendarHandler(this.logins)
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, this.mailboxModel, CALENDAR_PREFIX)
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
					async (_userId: string, _address: string, _requestedPath: string | null) => {},
					(userId) => openCalendarHandler.openCalendar(userId),
					AppType.Calendar,
				),
				cryptoFacade,
				calendarFacade,
				this.entityClient,
				this.logins,
				AppType.Calendar,
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
				case "newPlans":
					const { NewPlansNews } = await import("../common/misc/news/items/NewPlansNews.js")
					return new NewPlansNews(this.newsModel, this.logins.getUserController())
				case "newPlansOfferEnding":
					const { NewPlansOfferEndingNews } = await import("../common/misc/news/items/NewPlansOfferEndingNews.js")
					return new NewPlansOfferEndingNews(this.newsModel, this.logins.getUserController())
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
		this.contactModel = new ContactModel(this.entityClient, this.logins, this.eventController, () => {
			throw new DbError("Calendar cannot search for contacts through db")
		})
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
			isApp() || isDesktop()
				? new NativeThemeFacade(new LazyLoaded<ThemeFacade>(async () => calendarLocator.themeFacade))
				: new WebThemeFacade(deviceConfig)
		const lazySanitizer = isTest()
			? () => Promise.resolve(sanitizerStub as HtmlSanitizer)
			: () => import("../common/misc/HtmlSanitizer").then(({ htmlSanitizer }) => htmlSanitizer)

		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Calendar)

		// For native targets WebCommonNativeFacade notifies themeController because Android and Desktop do not seem to work reliably via media queries
		if (selectedThemeFacade instanceof WebThemeFacade) {
			selectedThemeFacade.addDarkListener(() => calendarLocator.themeController.reloadTheme())
		}
	}

	private async handleFileImport(filesUris: ReadonlyArray<string>) {
		const files = await this.fileApp.getFilesMetaData(filesUris)
		const areAllICSFiles = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE)
		if (areAllICSFiles) {
			const { importCalendarFile, parseCalendarFile } = await import("../common/calendar/import/CalendarImporter.js")

			let parsedEvents: ParsedEvent[] = []
			for (const fileRef of files) {
				const dataFile = await this.fileApp.readDataFile(fileRef.location)
				if (dataFile == null) continue

				const data = parseCalendarFile(dataFile)
				parsedEvents.push(...data.contents)
			}

			await importCalendarFile(await this.calendarModel(), this.logins.getUserController(), parsedEvents)
		}
	}

	readonly calendarModel: () => Promise<CalendarModel> = lazyMemoized(async () => {
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const { CalendarModel } = await import("./calendar/model/CalendarModel")
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
		const { CalendarInviteHandler } = await import("./calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("./calendar/view/CalendarNotificationSender.js")
		return new CalendarInviteHandler(this.mailboxModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) =>
			this.sendMailModel(...arg),
		)
	})

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
		const { getEventType } = await import("./calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("./calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")

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
				calendarLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
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
				null,
				this.systemFacade,
				this.credentialsProvider,
				null,
				deviceConfig,
				false,
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

export type ICalendarLocator = Readonly<CalendarLocator>

export const calendarLocator: ICalendarLocator = new CalendarLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = calendarLocator
}
