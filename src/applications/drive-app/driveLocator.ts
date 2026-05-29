import {
	AppType,
	assertMainOrNode,
	Const,
	FeatureType,
	isAndroidApp,
	isApp,
	isBrowser,
	isDesktop,
	isIOSApp,
	Mode,
	ProgrammingError,
} from "../../platform-kit/app-env"
import { EventController } from "../common/api/main/EventController.js"
import { type MailboxDetail, MailboxModel } from "../common/mailFunctionality/MailboxModel.js"
import { ContactModel } from "../common/contactsFunctionality/ContactModel.js"
import { ProgressTracker } from "../common/api/main/ProgressTracker.js"
import { CredentialsProvider } from "../common/misc/credentials/CredentialsProvider.js"
import { bootstrapWorker, WorkerClient } from "../common/api/main/WorkerClient.js"
import { FileController } from "../common/file/FileController.js"
import { SecondFactorHandler } from "../common/misc/2fa/SecondFactorHandler.js"
import { WebauthnClient } from "../common/misc/2fa/webauthn/WebauthnClient.js"
import { LoginController } from "../common/api/main/LoginController.js"
import { CustomerFacade } from "../common/api/worker/facades/lazy/CustomerFacade.js"
import { GiftCardFacade } from "../common/api/worker/facades/lazy/GiftCardFacade.js"
import { ConfigurationDatabase } from "../common/api/worker/facades/lazy/ConfigurationDatabase.js"
import { CalendarFacade } from "../common/api/worker/facades/lazy/CalendarFacade.js"
import { MailFacade } from "../common/api/worker/facades/lazy/MailFacade.js"
import { BookingFacade } from "../common/api/worker/facades/lazy/BookingFacade.js"
import { MailAddressFacade } from "../common/api/worker/facades/lazy/MailAddressFacade.js"
import { BlobFacade } from "../common/api/worker/facades/lazy/BlobFacade.js"
import { UserManagementFacade } from "../common/api/worker/facades/lazy/UserManagementFacade.js"
import { ContactFacade } from "../common/api/worker/facades/lazy/ContactFacade.js"
import { UsageTestController } from "@tutao/usagetests"
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestModel } from "../common/misc/UsageTestModel.js"
import { NewsModel } from "../common/misc/news/NewsModel.js"
import { WorkerFacade } from "../common/api/worker/facades/WorkerFacade.js"
import { PageContextLoginListener } from "../common/api/main/PageContextLoginListener.js"
import { WebsocketConnectivityModel } from "../common/misc/WebsocketConnectivityModel.js"
import { OperationProgressTracker } from "../common/api/main/OperationProgressTracker.js"
import { InfoMessageHandler } from "../common/gui/InfoMessageHandler.js"
import { assertNotNull, defer, DeferredObject, lazy, lazyAsync, LazyLoaded, lazyMemoized, noOp } from "../../platform-kit/utils"
import { RecipientsModel } from "../common/api/main/RecipientsModel.js"
import { NoZoneDateProvider } from "../common/api/common/utils/NoZoneDateProvider.js"
import { SendMailModel } from "../common/mailFunctionality/SendMailModel.js"
import { OfflineIndicatorViewModel } from "../common/gui/base/OfflineIndicatorViewModel.js"
import { DeviceConfig, deviceConfig } from "../common/misc/DeviceConfig.js"
import { getEnabledMailAddressesWithUser } from "../common/mailFunctionality/SharedMailUtils.js"
import { ContactSuggestionProvider, RecipientsSearchModel } from "../common/misc/RecipientsSearchModel.js"
import { MailAddressNameChanger, MailAddressTableModel, UserInfo } from "../common/settings/mailaddress/MailAddressTableModel.js"
import { DrawerMenuAttrs, isPartnerEnabled } from "../common/gui/nav/DrawerMenu.js"
import { DomainConfigProvider } from "../common/api/common/DomainConfigProvider.js"
import { CredentialRemovalHandler } from "../common/login/CredentialRemovalHandler.js"
import { LoginViewModel } from "../common/login/LoginViewModel.js"
import { EntropyCollector } from "../common/api/main/EntropyCollector.js"
import { windowFacade } from "../common/misc/WindowFacade.js"
import { BrowserWebauthn } from "../common/misc/2fa/webauthn/BrowserWebauthn.js"
import { FileControllerBrowser } from "../common/file/FileControllerBrowser.js"
import { FileControllerNative } from "../common/file/FileControllerNative.js"
import { AlarmScheduler } from "../common/calendar/date/AlarmScheduler.js"
import { SchedulerImpl } from "../common/api/common/utils/Scheduler.js"
import { isCustomizationEnabledForCustomer } from "../common/api/common/utils/CustomerUtils.js"
import { PostLoginActions } from "../common/login/PostLoginActions.js"
import { CredentialFormatMigrator } from "../common/misc/credentials/CredentialFormatMigrator.js"
import { SearchIndexStateInfo } from "../common/api/worker/search/SearchTypes.js"
import { WorkerRandomizer } from "../common/api/worker/workerInterfaces.js"
import type { CalendarContactPreviewViewModel } from "../calendar-app/calendar/gui/eventpopup/CalendarContactPreviewViewModel.js"
import { SyncTracker } from "../common/api/main/SyncTracker.js"
import type { AutosaveFacade, LocalAutosavedDraftData } from "../common/api/worker/facades/lazy/AutosaveFacade"
import { DriveFacade } from "../common/api/worker/facades/lazy/DriveFacade"
import { TransferProgressDispatcher } from "../common/api/main/TransferProgressDispatcher"
import { CalendarEventUpdateCoordinator } from "../calendar-app/calendar/model/CalendarEventUpdateCoordinator"
import { ParsedEvent } from "../common/calendar/gui/ImportExportUtils"
import { DriveSearchModelStub } from "./search/model/DriveSearchModelStub"
import type { DriveViewModel } from "./drive/view/DriveViewModel"
import type { CalendarEventModel, CalendarOperation } from "../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel"
import type { CalendarInfo, CalendarModel } from "../calendar-app/calendar/model/CalendarModel"
import type { CalendarInviteHandler } from "../calendar-app/calendar/view/CalendarInvites"
import type { CalendarEventPreviewViewModel } from "../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel"
import { FolderItem } from "./drive/view/DriveUtils"
import { MoveItems } from "./drive/view/DriveMoveItemDialog"
import { DriveFilePicker } from "./drive/view/DriveFilePicker"
import { NativeInterfaceMain } from "../common/native/NativeInterfaceMain"
import { NativeFileApp } from "../../app-kit/native-bridge/common/FileApp"
import { NativePushServiceApp } from "../common/native/NativePushServiceApp"
import {
	CommonSystemFacade,
	ContactSuggestion,
	DesktopSystemFacade,
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
import { notifications } from "../../ui/Notifications"
import { EntityClient } from "../../platform-kit/network/EntityClient"
import { CommonLocator } from "../common/api/main/CommonLocator"
import { LoginFacade } from "../../platform-kit/base/facades/LoginFacade"
import { AppHeaderAttrs, Header } from "../../ui/Header"
import { GroupManagementFacade } from "../../platform-kit/base/facades/lazy/GroupManagementFacade"
import { ShareFacade } from "../../platform-kit/base/facades/lazy/ShareFacade"
import { CounterFacade } from "../../platform-kit/network/CounterFacade"
import { KeyVerificationFacade } from "../../platform-kit/base/facades/lazy/KeyVerificationFacade"
import PublicEncryptionKeyProvider from "../../platform-kit/base/crypto/PublicEncryptionKeyProvider"
import { PublicIdentityKeyProvider } from "../../platform-kit/base/crypto/PublicIdentityKeyProvider"
import { RecoverCodeFacade } from "../../platform-kit/base/facades/lazy/RecoverCodeFacade"
import { IServiceExecutor } from "../../platform-kit/network/ServiceRequest"
import { CryptoFacade } from "../../platform-kit/base/crypto/CryptoFacade"
import { WebMobileFacade } from "../common/native/WebMobileFacade"
import { SystemPermissionHandler } from "../common/native/SystemPermissionHandler"
import { InterWindowEventFacadeSendDispatcher } from "@tutao/native-bridge/generatedIpc/dispatchers"
import { ExposedCacheStorage } from "../../app-kit/local-store/CacheStorage"
import { NativeThemeFacade, ThemeController, WebThemeFacade } from "../../ui/ThemeController"
import { IdentityKeyCreator } from "../../platform-kit/base/crypto/IdentityKeyCreator"
import { WhitelabelThemeGenerator } from "../../ui/WhitelabelThemeGenerator"
import { NativeInterfaces } from "../common/native/NativeInterfaceFactory"
import { EntropyFacade } from "../../platform-kit/base/facades/EntropyFacade"
import { ClientModelInfo } from "../../platform-kit/instance-pipeline"
import { Router, ScopedRouter, ThrottledRouter } from "../../ui/ScopedRouter"
import { CalendarEvent, CalendarEventAttendee, Contact, Mail, MailboxProperties } from "@tutao/entities/tutanota"
import { getEventWithDefaultTimes, setNextHalfHour } from "../common/api/common/utils/CommonCalendarUtils"
import { CALENDAR_PREFIX } from "../../ui/utils/RouteChange"
import { HtmlSanitizer } from "../common/misc/HtmlSanitizer"
import { theme } from "../../ui/theme"
import { CALENDAR_MIME_TYPE } from "../../platform-kit/utils/FileConstants"
import { lang } from "../../ui/utils/LanguageViewModel"
import { SearchToken } from "../../ui/utils/QueryTokenUtils"
import { KdfType } from "../../platform-kit/base/crypto/Constants"
import { GroupSettingsModel } from "../common/sharing/model/GroupSettingsModel"

assertMainOrNode()

class DriveLocator implements CommonLocator {
	clientModelInfo!: ClientModelInfo
	eventController!: EventController
	search!: DriveSearchModelStub
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
	syncTracker!: SyncTracker
	identityKeyCreator!: IdentityKeyCreator
	whitelabelThemeGenerator!: WhitelabelThemeGenerator
	driveFacade!: DriveFacade
	transferProgressDispatcher!: TransferProgressDispatcher

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
			newsItemsCount: () => this.newsModel.liveNewsIds.length,
		}
	}

	readonly throttledRouter: lazy<Router> = lazyMemoized(() => new ThrottledRouter())

	readonly driveViewModel: lazyAsync<DriveViewModel> = lazyMemoized(async () => {
		const { DriveViewModel } = await import("./drive/view/DriveViewModel.js")
		const router = new ScopedRouter(this.throttledRouter(), "/drive")
		const { DriveTransferController } = await import("./drive/view/DriveTransferController.js")

		const redraw = await this.redraw()
		const driveUploadStackModel = new DriveTransferController(this.driveFacade, this.blobFacade, redraw, this.fileController, await this.scheduler())

		return new DriveViewModel(
			this.entityClient,
			this.driveFacade,
			router,
			this.transferProgressDispatcher,
			this.eventController,
			this.logins,
			this.userManagementFacade,
			driveUploadStackModel,
			redraw,
		)
	})

	async showMoveItemDialog(items: FolderItem[], moveItems: MoveItems) {
		const { showMoveDialog } = await import("./drive/view/DriveMoveItemDialog.js")
		showMoveDialog(this.entityClient, this.driveFacade, items, moveItems)
	}

	async driveFilePicker(): Promise<DriveFilePicker> {
		if (isDesktop() || isApp()) {
			const { AppFilePicker } = await import("./drive/view/DriveFilePicker.js")
			return new AppFilePicker(this.fileApp)
		} else {
			const { WebFilePicker } = await import("./drive/view/DriveFilePicker.js")
			return new WebFilePicker()
		}
	}

	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	private async sendMailModelSyncFactory(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<() => SendMailModel> {
		const { SendMailModel } = await import("../common/mailFunctionality/SendMailModel.js")
		const recipientsModel = await this.recipientsModel()
		const dateProvider = await this.noZoneDateProvider()

		const noOpAutosave: AutosaveFacade = {
			async clearAutosavedDraftData(): Promise<void> {},
			async getAutosavedDraftData(): Promise<LocalAutosavedDraftData | null> {
				return null
			},
			async setAutosavedDraftData(_draftData: LocalAutosavedDraftData): Promise<void> {},
		}

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
				noOpAutosave,
				async (mail: Mail) => {
					return false
				},
				this.syncTracker,
				null,
			)
	}

	async calendarEventModel(
		editMode: CalendarOperation,
		event: Partial<CalendarEvent>,
		mailboxDetail: MailboxDetail,
		mailboxProperties: MailboxProperties,
		responseTo: Mail | null,
	): Promise<CalendarEventModel | null> {
		return null
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
			: new AppsCredentialRemovalHandler(this.pushService, this.configFacade, async () => {
					// nothing needs to be specifically done for the calendar app right now.
					noOp()
				})
	}

	async loginViewModelFactory(): Promise<lazy<LoginViewModel>> {
		const { LoginViewModel } = await import("../common/login/LoginViewModel.js")
		const credentialsRemovalHandler = await driveLocator.credentialsRemovalHandler()
		const { MobileAppLock, NoOpAppLock } = await import("../common/login/AppLock.js")
		const appLock = isApp()
			? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade)
			: new NoOpAppLock()
		return () => {
			const domainConfig = isBrowser()
				? driveLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port)
				: // in this case, we know that we have a staticUrl set that we need to use
					driveLocator.domainConfigProvider().getCurrentDomainConfig()

			return new LoginViewModel(
				driveLocator.logins,
				driveLocator.credentialsProvider,
				driveLocator.secondFactorHandler,
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
			configFacade,
			calendarFacade,
			alarmFacade,
			mailFacade,
			shareFacade,
			counterFacade,
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
			identityKeyCreator,
			driveFacade,
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
		this.identityKeyCreator = identityKeyCreator
		this.logins = new LoginController(
			this.loginFacade,
			this.customerFacade,
			async () => this.loginListener,
			() => this.worker.reset(),
		)
		// Should be called elsewhere later e.g. in CommonLocator
		this.logins.init()
		this.progressTracker = new ProgressTracker()
		this.eventController = new EventController(driveLocator.logins)
		this.syncTracker = new SyncTracker()
		this.search = new DriveSearchModelStub()
		this.entityClient = new EntityClient(restInterface, this.clientModelInfo)
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
		this.whitelabelThemeGenerator = new WhitelabelThemeGenerator()

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
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("../common/native/WebDesktopFacade")
			const { WebMobileFacade } = await import("../common/native/WebMobileFacade.js")
			const { WebCommonNativeFacade } = await import("../common/native/WebCommonNativeFacade.js")
			const { WebInterWindowEventFacade } = await import("../common/native/WebInterWindowEventFacade.js")
			const { WebAuthnFacadeSendDispatcher } = await import("@tutao/native-bridge/generatedIpc/dispatchers")
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../common/native/NativeInterfaceFactory.js")
			const { OpenCalendarHandler } = await import("../common/native/OpenCalendarHandler.js")
			const openCalendarHandler = new OpenCalendarHandler(this.logins, async (mode: CalendarOperation, date: Date) => {
				const mailboxDetail = await this.mailboxModel.getUserMailboxDetails()
				const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot)
				return await this.calendarEventModel(mode, getEventWithDefaultTimes(setNextHalfHour(new Date(date))), mailboxDetail, mailboxProperties, null)
			})
			const { OpenSettingsHandler } = await import("../common/native/OpenSettingsHandler.js")
			const openSettingsHandler = new OpenSettingsHandler(this.logins)

			this.transferProgressDispatcher = new TransferProgressDispatcher()

			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, CALENDAR_PREFIX)
			this.nativeInterfaces = createNativeInterfaces(
				this.webMobileFacade,
				new WebDesktopFacade(this.logins, async () => this.native, this.desktopSettingsFacade),
				new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig),
				new WebCommonNativeFacade(
					this.logins,
					this.mailboxModel,
					this.usageTestController,
					async () => this.fileApp,
					async () => this.pushService,
					this.handleFileImport.bind(this),
					async (_userId: string, _address: string, _requestedPath: string | null) => {},
					(userId, action, date, eventId) => openCalendarHandler.openCalendar(userId, action, date, eventId),
					AppType.Calendar,
					(path) => openSettingsHandler.openSettings(path),
					this.blobFacade,
				),
				cryptoFacade,
				calendarFacade,
				alarmFacade,
				this.entityClient,
				this.logins,
				AppType.Calendar,
			)

			if (isDesktop() || env.mode === Mode.Admin) {
				const desktopInterfaces = createDesktopInterfaces(this.native)
				this.searchTextFacade = desktopInterfaces.searchTextFacade
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade
				}
			} else if (isAndroidApp() || isIOSApp()) {
				const { SystemPermissionHandler } = await import("../common/native/SystemPermissionHandler.js")
				this.systemPermissionHandler = new SystemPermissionHandler(this.systemFacade)
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp())

				this.systemFacade.storeServerRemoteOrigin(assertNotNull(env.staticUrl)).catch((e) => console.log("Failed to store remote URL: ", e))
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
				case "newPlans": {
					const { NewPlansNews } = await import("../common/misc/news/items/NewPlansNews.js")
					return new NewPlansNews(this.newsModel, this.logins.getUserController())
				}
				case "newPlansOfferEnding": {
					const { NewPlansOfferEndingNews } = await import("../common/misc/news/items/NewPlansOfferEndingNews.js")
					return new NewPlansOfferEndingNews(this.newsModel, this.logins.getUserController())
				}
				default:
					console.log(`No implementation for news named '${name}'`)
					return null
			}
		})

		this.fileController =
			this.nativeInterfaces == null ? new FileControllerBrowser(blobFacade) : new FileControllerNative(blobFacade, this.nativeInterfaces.fileApp)

		const { ContactModel } = await import("../common/contactsFunctionality/ContactModel.js")
		this.contactModel = new ContactModel(this.entityClient, this.logins, this.eventController, null)

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
			isApp() || isDesktop() ? new NativeThemeFacade(new LazyLoaded<ThemeFacade>(async () => driveLocator.themeFacade)) : new WebThemeFacade(deviceConfig)
		const lazySanitizer =
			env.mode === Mode.Test
				? () => Promise.resolve(sanitizerStub as HtmlSanitizer)
				: () => import("../common/misc/HtmlSanitizer.js").then(({ getHtmlSanitizer }) => getHtmlSanitizer())

		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Calendar, this.whitelabelThemeGenerator)

		// For native targets WebCommonNativeFacade notifies themeController because Android and Desktop do not seem to work reliably via media queries
		if (selectedThemeFacade instanceof WebThemeFacade) {
			selectedThemeFacade.addDarkListener(() => driveLocator.themeController.reloadTheme())
		}
	}

	private async handleFileImport(filesUris: ReadonlyArray<string>) {
		const files = await this.fileApp.getFilesMetaData(filesUris)
		const areAllICSFiles = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE)
		if (areAllICSFiles) {
			const { importCalendarFile, parseCalendarFile } = await import("../common/calendar/gui/CalendarImporter.js")

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
			() => {
				this.systemFacade.requestWidgetRefresh()
			},
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
		const lazyIndexEntry = async () => (selectedEvent.uid != null ? this.calendarFacade.getEventsByUid(selectedEvent.uid) : null)
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
				null,
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

	async updateClients(): Promise<void> {
		if (isApp()) {
			if (isAndroidApp()) {
				this.nativeInterfaces?.mobileSystemFacade.openLink("market://details?id=de.tutao.calendar")
			} else if (isIOSApp()) {
				this.nativeInterfaces?.mobileSystemFacade.openLink("itms-apps://itunes.apple.com/app/id6657977811")
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

	readonly groupSettingsModel: lazy<Promise<GroupSettingsModel>> = lazyMemoized(async () => {
		const { GroupSettingsModel } = await import("../common/sharing/model/GroupSettingsModel.js")
		return new GroupSettingsModel(this.entityClient, this.logins)
	})
}

export type IDriveLocator = Readonly<DriveLocator>

export const driveLocator: IDriveLocator = new DriveLocator()

if (typeof window !== "undefined") {
	// window.tutao.locator = calendarLocator
}
