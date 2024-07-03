import type { WorkerClient } from "./WorkerClient"
import { bootstrapWorker } from "./WorkerClient"
import { EventController } from "./EventController"
import { EntropyCollector } from "./EntropyCollector"
import { SearchModel } from "../../../mail-app/search/model/SearchModel"
import { MailboxDetail, MailModel } from "../../../mail-app/mail/model/MailModel"
import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp } from "../common/Env"
import { notifications } from "../../gui/Notifications"
import { LoginController } from "./LoginController"
import type { ContactModel } from "../../../mail-app/contacts/model/ContactModel"
import { EntityClient } from "../common/EntityClient"
import type { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel"
import { assert, assertNotNull, defer, DeferredObject, lazy, lazyAsync, lazyMemoized, noOp, ofClass } from "@tutao/tutanota-utils"
import { ProgressTracker } from "./ProgressTracker"
import { MinimizedMailEditorViewModel } from "../../../mail-app/mail/model/MinimizedMailEditorViewModel"
import { SchedulerImpl } from "../common/utils/Scheduler.js"
import type { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import type { LoginFacade } from "../worker/facades/LoginFacade"
import type { CustomerFacade } from "../worker/facades/lazy/CustomerFacade.js"
import type { GiftCardFacade } from "../worker/facades/lazy/GiftCardFacade.js"
import type { ConfigurationDatabase } from "../worker/facades/lazy/ConfigurationDatabase.js"
import type { CalendarFacade } from "../worker/facades/lazy/CalendarFacade.js"
import type { MailFacade } from "../worker/facades/lazy/MailFacade.js"
import type { ShareFacade } from "../worker/facades/lazy/ShareFacade.js"
import type { CounterFacade } from "../worker/facades/lazy/CounterFacade.js"
import type { Indexer } from "../worker/search/Indexer"
import type { SearchFacade } from "../worker/search/SearchFacade"
import type { BookingFacade } from "../worker/facades/lazy/BookingFacade.js"
import type { MailAddressFacade } from "../worker/facades/lazy/MailAddressFacade.js"
import { FileController, guiDownload } from "../../file/FileController"
import type { NativeFileApp } from "../../native/common/FileApp"
import type { NativePushServiceApp } from "../../native/main/NativePushServiceApp"
import type { NativeInterfaceMain } from "../../native/main/NativeInterfaceMain"
import type { NativeInterfaces } from "../../native/main/NativeInterfaceFactory.js"
import { ProgrammingError } from "../common/error/ProgrammingError"
import { SecondFactorHandler } from "../../misc/2fa/SecondFactorHandler"
import { WebauthnClient } from "../../misc/2fa/webauthn/WebauthnClient"
import type { UserManagementFacade } from "../worker/facades/lazy/UserManagementFacade.js"
import type { GroupManagementFacade } from "../worker/facades/lazy/GroupManagementFacade.js"
import { WorkerRandomizer } from "../worker/WorkerImpl"
import { BrowserWebauthn } from "../../misc/2fa/webauthn/BrowserWebauthn.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestModel } from "../../misc/UsageTestModel"
import { deviceConfig } from "../../misc/DeviceConfig"
import { IServiceExecutor } from "../common/ServiceRequest.js"
import type { BlobFacade } from "../worker/facades/lazy/BlobFacade.js"
import { CryptoFacade } from "../worker/crypto/CryptoFacade"
import { RecipientsModel } from "./RecipientsModel"
import { ExposedCacheStorage } from "../worker/rest/DefaultEntityRestCache.js"
import { PageContextLoginListener } from "./PageContextLoginListener.js"
import { SearchTextInAppFacade } from "../../native/common/generatedipc/SearchTextInAppFacade.js"
import { SettingsFacade } from "../../native/common/generatedipc/SettingsFacade.js"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { CommonSystemFacade } from "../../native/common/generatedipc/CommonSystemFacade.js"
import { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { ThemeFacade } from "../../native/common/generatedipc/ThemeFacade.js"
import { FileControllerBrowser } from "../../file/FileControllerBrowser.js"
import { FileControllerNative } from "../../file/FileControllerNative.js"
import { windowFacade } from "../../misc/WindowFacade.js"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { NewsModel } from "../../misc/news/NewsModel.js"
import type { MailAddressNameChanger, MailAddressTableModel } from "../../../mail-app/settings/mailaddress/MailAddressTableModel.js"
import { GroupInfo } from "../entities/sys/TypeRefs.js"
import type { SendMailModel } from "../../../mail-app/mail/editor/SendMailModel.js"
import type { CalendarEvent, Mail, MailboxProperties } from "../entities/tutanota/TypeRefs.js"
import { CalendarEventAttendee } from "../entities/tutanota/TypeRefs.js"
import type { CreateMailViewerOptions } from "../../../mail-app/mail/view/MailViewer.js"
import type { RecipientsSearchModel } from "../../misc/RecipientsSearchModel.js"
import type { MailViewerViewModel } from "../../../mail-app/mail/view/MailViewerViewModel.js"
import { NoZoneDateProvider } from "../common/utils/NoZoneDateProvider.js"
import { WebsocketConnectivityModel } from "../../misc/WebsocketConnectivityModel.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { EntropyFacade } from "../worker/facades/EntropyFacade.js"
import { OperationProgressTracker } from "./OperationProgressTracker.js"
import { WorkerFacade } from "../worker/facades/WorkerFacade.js"
import { InfoMessageHandler } from "../../gui/InfoMessageHandler.js"
import { OfflineIndicatorViewModel } from "../../gui/base/OfflineIndicatorViewModel.js"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import { CalendarViewModel } from "../../../calendar-app/calendar/view/CalendarViewModel.js"
import { ReceivedGroupInvitationsModel } from "../../sharing/model/ReceivedGroupInvitationsModel.js"
import { Const, FeatureType, GroupType, KdfType } from "../common/TutanotaConstants.js"
import type { ExternalLoginViewModel } from "../../login/ExternalLoginView.js"
import type { ConversationViewModel, ConversationViewModelFactory } from "../../../mail-app/mail/view/ConversationViewModel.js"
import type { AlarmScheduler } from "../../calendar/date/AlarmScheduler.js"
import { CalendarEventModel, CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { SearchViewModel } from "../../../mail-app/search/view/SearchViewModel.js"
import { SearchRouter } from "../../../mail-app/search/view/SearchRouter.js"
import { MailOpenedListener } from "../../../mail-app/mail/view/MailViewModel.js"
import { InboxRuleHandler } from "../../../mail-app/mail/model/InboxRuleHandler.js"
import { Router, ScopedRouter, ThrottledRouter } from "../../gui/ScopedRouter.js"
import { ShareableGroupType } from "../../sharing/GroupUtils.js"
import { DomainConfigProvider } from "../common/DomainConfigProvider.js"
import type { AppsCredentialRemovalHandler, CredentialRemovalHandler, NoopCredentialRemovalHandler } from "../../login/CredentialRemovalHandler.js"
import { LoginViewModel } from "../../login/LoginViewModel.js"
import { getEnabledMailAddressesWithUser } from "../../../mail-app/mail/model/MailUtils.js"
import type { CalendarEventPreviewViewModel } from "../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"

import { getDisplayedSender } from "../common/mail/CommonMailUtils.js"
import { isCustomizationEnabledForCustomer } from "../common/utils/CustomerUtils.js"
import { CalendarEventsRepository } from "../../calendar/date/CalendarEventsRepository.js"
import { CalendarInviteHandler } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { NativeContactsSyncManager } from "../../../mail-app/contacts/model/NativeContactsSyncManager.js"
import { ContactFacade } from "../worker/facades/lazy/ContactFacade.js"
import { ContactImporter } from "../../../mail-app/contacts/ContactImporter.js"
import { MobileContactsFacade } from "../../native/common/generatedipc/MobileContactsFacade.js"
import { PermissionError } from "../common/error/PermissionError.js"
import { WebMobileFacade } from "../../native/main/WebMobileFacade.js"
import { CredentialFormatMigrator } from "../../misc/credentials/CredentialFormatMigrator.js"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { AddNotificationEmailDialog } from "../../../mail-app/settings/AddNotificationEmailDialog.js"
import { MobileAppLock, NoOpAppLock } from "../../login/AppLock.js"
import { PostLoginActions } from "../../login/PostLoginActions.js"
import { SystemPermissionHandler } from "../../native/main/SystemPermissionHandler.js"
import { RecoverCodeFacade } from "../worker/facades/lazy/RecoverCodeFacade.js"

assertMainOrNode()

class MainLocator {
	eventController!: EventController
	search!: SearchModel
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
	Const!: Record<string, any>

	private nativeInterfaces: NativeInterfaces | null = null
	private entropyFacade!: EntropyFacade
	private sqlCipherFacade!: SqlCipherFacade

	readonly recipientsModel: lazyAsync<RecipientsModel> = lazyMemoized(async () => {
		const { RecipientsModel } = await import("./RecipientsModel.js")
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
		const { MailViewModel } = await import("../../../mail-app/mail/view/MailViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const router = new ScopedRouter(this.throttledRouter(), "/mail")
		return new MailViewModel(
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

	inboxRuleHanlder(): InboxRuleHandler {
		return new InboxRuleHandler(this.mailFacade, this.entityClient, this.logins)
	}

	async searchViewModelFactory(): Promise<() => SearchViewModel> {
		const { SearchViewModel } = await import("../../../mail-app/search/view/SearchViewModel.js")
		const conversationViewModelFactory = await this.conversationViewModelFactory()
		const redraw = await this.redraw()
		const searchRouter = await this.scopedSearchRouter()
		return () => {
			return new SearchViewModel(
				searchRouter,
				this.search,
				this.searchFacade,
				this.mailModel,
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
		const { SearchRouter } = await import("../../../mail-app/search/view/SearchRouter.js")
		return new SearchRouter(new ScopedRouter(this.throttledRouter(), "/search"))
	})

	readonly unscopedSearchRouter: lazyAsync<SearchRouter> = lazyMemoized(async () => {
		const { SearchRouter } = await import("../../../mail-app/search/view/SearchRouter.js")
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
		const { ContactViewModel } = await import("../../../mail-app/contacts/view/ContactViewModel.js")
		const router = new ScopedRouter(this.throttledRouter(), "/contact")
		return new ContactViewModel(this.contactModel, this.entityClient, this.eventController, router, await this.redraw())
	})

	readonly contactListViewModel = lazyMemoized(async () => {
		const { ContactListViewModel } = await import("../../../mail-app/contacts/view/ContactListViewModel.js")
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
		const { ReceivedGroupInvitationsModel } = await import("../../sharing/model/ReceivedGroupInvitationsModel.js")
		return new ReceivedGroupInvitationsModel<TypeOfGroup>(groupType, this.eventController, this.entityClient, this.logins)
	}

	readonly calendarViewModel = lazyMemoized<Promise<CalendarViewModel>>(async () => {
		const { CalendarViewModel } = await import("../../../calendar-app/calendar/view/CalendarViewModel.js")
		const { DefaultDateProvider } = await import("../../calendar/date/CalendarUtils")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarViewModel(
			this.logins,
			async (mode: CalendarOperation, event: CalendarEvent) => {
				const mailboxDetail = await this.mailModel.getUserMailboxDetails()
				const mailboxProperties = await this.mailModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot)
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
			this.mailModel,
		)
	})

	readonly calendarEventsRepository: lazyAsync<CalendarEventsRepository> = lazyMemoized(async () => {
		const { CalendarEventsRepository } = await import("../../calendar/date/CalendarEventsRepository.js")
		const { DefaultDateProvider } = await import("../../calendar/date/CalendarUtils")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarEventsRepository(await this.calendarModel(), this.calendarFacade, timeZone, this.entityClient, this.eventController)
	})

	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	private async sendMailModelSyncFactory(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<() => SendMailModel> {
		const { SendMailModel } = await import("../../../mail-app/mail/editor/SendMailModel")
		const recipientsModel = await this.recipientsModel()
		const dateProvider = await this.noZoneDateProvider()
		return () =>
			new SendMailModel(
				this.mailFacade,
				this.entityClient,
				this.logins,
				this.mailModel,
				this.contactModel,
				this.eventController,
				mailboxDetails,
				recipientsModel,
				dateProvider,
				mailboxProperties,
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
			import("../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"),
			import("../../calendar/date/CalendarUtils.js"),
			import("../../../calendar-app/calendar/view/CalendarNotificationSender.js"),
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
		const { RecipientsSearchModel } = await import("../../misc/RecipientsSearchModel.js")
		const suggestionsProvider = isApp()
			? (query: string) => this.mobileContactsFacade.findSuggestions(query).catch(ofClass(PermissionError, () => []))
			: null
		return new RecipientsSearchModel(await this.recipientsModel(), this.contactModel, suggestionsProvider, this.entityClient)
	}

	readonly conversationViewModelFactory: lazyAsync<ConversationViewModelFactory> = async () => {
		const { ConversationViewModel } = await import("../../../mail-app/mail/view/ConversationViewModel.js")
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
		const { ContactImporter } = await import("../../../mail-app/contacts/ContactImporter.js")
		return new ContactImporter(this.contactFacade, this.systemPermissionHandler)
	}

	async mailViewerViewModelFactory(): Promise<(options: CreateMailViewerOptions) => MailViewerViewModel> {
		const { MailViewerViewModel } = await import("../../../mail-app/mail/view/MailViewerViewModel.js")
		return ({ mail, showFolder }) =>
			new MailViewerViewModel(
				mail,
				showFolder,
				this.entityClient,
				this.mailModel,
				this.contactModel,
				this.configFacade,
				this.fileController,
				this.logins,
				async (mailboxDetails) => {
					const mailboxProperties = await this.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
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
		const { ExternalLoginViewModel } = await import("../../login/ExternalLoginView.js")
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

	get systemFacade(): MobileSystemFacade {
		return this.getNativeInterface("mobileSystemFacade")
	}

	get mobileContactsFacade(): MobileContactsFacade {
		return this.getNativeInterface("mobileContactsFacade")
	}

	get nativeCredentialsFacade(): NativeCredentialsFacade {
		return this.getNativeInterface("nativeCredentialsFacade")
	}

	async mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel> {
		const { MailAddressTableModel } = await import("../../../mail-app/settings/mailaddress/MailAddressTableModel.js")
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
		const { MailAddressTableModel } = await import("../../../mail-app/settings/mailaddress/MailAddressTableModel.js")
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
		const { OwnMailAddressNameChanger } = await import("../../../mail-app/settings/mailaddress/OwnMailAddressNameChanger.js")
		return new OwnMailAddressNameChanger(this.mailModel, this.entityClient)
	}

	async adminNameChanger(mailGroupId: Id, userId: Id): Promise<MailAddressNameChanger> {
		const { AnotherUserMailAddressNameChanger } = await import("../../../mail-app/settings/mailaddress/AnotherUserMailAddressNameChanger.js")
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
		const { NoopCredentialRemovalHandler, AppsCredentialRemovalHandler } = await import("../../login/CredentialRemovalHandler.js")
		return isBrowser()
			? new NoopCredentialRemovalHandler()
			: new AppsCredentialRemovalHandler(this.indexerFacade, this.pushService, this.configFacade, isApp() ? this.nativeContactsSyncManager() : null)
	}

	async loginViewModelFactory(): Promise<lazy<LoginViewModel>> {
		const { LoginViewModel } = await import("../../login/LoginViewModel.js")
		const credentialsRemovalHandler = await locator.credentialsRemovalHandler()
		const { MobileAppLock, NoOpAppLock } = await import("../../login/AppLock.js")
		const appLock = isApp()
			? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade)
			: new NoOpAppLock()
		return () => {
			const domainConfig = isBrowser()
				? locator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port)
				: // in this case, we know that we have a staticUrl set that we need to use
				  locator.domainConfigProvider().getCurrentDomainConfig()

			return new LoginViewModel(
				locator.logins,
				locator.credentialsProvider,
				locator.secondFactorHandler,
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
		this.logins = new LoginController()
		// Should be called elsewhere later e.g. in mainLocator
		this.logins.init()
		this.eventController = new EventController(locator.logins)
		this.progressTracker = new ProgressTracker()
		this.search = new SearchModel(this.searchFacade, () => this.calendarEventsRepository())
		this.entityClient = new EntityClient(restInterface)
		this.cryptoFacade = cryptoFacade
		this.cacheStorage = cacheStorage
		this.entropyFacade = entropyFacade
		this.workerFacade = workerFacade
		this.connectivityModel = new WebsocketConnectivityModel(eventBus)
		this.mailModel = new MailModel(
			notifications,
			this.eventController,
			this.connectivityModel,
			this.mailFacade,
			this.entityClient,
			this.logins,
			this.inboxRuleHanlder(),
		)
		this.operationProgressTracker = new OperationProgressTracker()
		this.infoMessageHandler = new InfoMessageHandler(this.search)

		this.Const = Const
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("../../native/main/WebDesktopFacade")
			const { WebMobileFacade } = await import("../../native/main/WebMobileFacade.js")
			const { WebCommonNativeFacade } = await import("../../native/main/WebCommonNativeFacade.js")
			const { WebInterWindowEventFacade } = await import("../../native/main/WebInterWindowEventFacade.js")
			const { WebAuthnFacadeSendDispatcher } = await import("../../native/common/generatedipc/WebAuthnFacadeSendDispatcher.js")
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../../native/main/NativeInterfaceFactory.js")
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, this.mailModel)
			this.nativeInterfaces = createNativeInterfaces(
				this.webMobileFacade,
				new WebDesktopFacade(),
				new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig),
				new WebCommonNativeFacade(),
				cryptoFacade,
				calendarFacade,
				this.entityClient,
				this.logins,
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
				const { SystemPermissionHandler } = await import("../../native/main/SystemPermissionHandler.js")
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
		this.loginListener = new PageContextLoginListener(this.secondFactorHandler)
		this.credentialsProvider = await this.createCredentialsProvider()
		this.random = random

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

		this.newsModel = new NewsModel(this.serviceExecutor, deviceConfig, async (name: string) => {
			switch (name) {
				case "usageOptIn":
					const { UsageOptInNews } = await import("../../misc/news/items/UsageOptInNews.js")
					return new UsageOptInNews(this.newsModel, this.usageTestModel)
				case "recoveryCode":
					const { RecoveryCodeNews } = await import("../../misc/news/items/RecoveryCodeNews.js")
					return new RecoveryCodeNews(this.newsModel, this.logins.getUserController(), this.recoverCodeFacade)
				case "pinBiometrics":
					const { PinBiometricsNews } = await import("../../misc/news/items/PinBiometricsNews.js")
					return new PinBiometricsNews(this.newsModel, this.credentialsProvider, this.logins.getUserController().userId)
				case "referralLink":
					const { ReferralLinkNews } = await import("../../misc/news/items/ReferralLinkNews.js")
					const dateProvider = await this.noZoneDateProvider()
					return new ReferralLinkNews(this.newsModel, dateProvider, this.logins.getUserController())
				case "newPlans":
					const { NewPlansNews } = await import("../../misc/news/items/NewPlansNews.js")
					return new NewPlansNews(this.newsModel, this.logins.getUserController())
				case "newPlansOfferEnding":
					const { NewPlansOfferEndingNews } = await import("../../misc/news/items/NewPlansOfferEndingNews.js")
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

		const { ContactModel } = await import("../../../mail-app/contacts/model/ContactModel")
		this.contactModel = new ContactModel(this.searchFacade, this.entityClient, this.logins, this.eventController)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()
		this.usageTestController = new UsageTestController(this.usageTestModel)
	}

	readonly calendarModel: () => Promise<CalendarModel> = lazyMemoized(async () => {
		const { DefaultDateProvider } = await import("../../calendar/date/CalendarUtils")
		const { CalendarModel } = await import("../../../calendar-app/calendar/model/CalendarModel")
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarModel(
			notifications,
			this.alarmScheduler,
			this.eventController,
			this.serviceExecutor,
			this.logins,
			this.progressTracker,
			this.entityClient,
			this.mailModel,
			this.calendarFacade,
			this.fileController,
			timeZone,
		)
	})

	readonly calendarInviteHandler: () => Promise<CalendarInviteHandler> = lazyMemoized(async () => {
		const { CalendarInviteHandler } = await import("../../../calendar-app/calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("../../../calendar-app/calendar/view/CalendarNotificationSender.js")
		return new CalendarInviteHandler(this.mailModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) =>
			this.sendMailModel(...arg),
		)
	})

	private alarmScheduler: () => Promise<AlarmScheduler> = lazyMemoized(async () => {
		const { AlarmScheduler } = await import("../../calendar/date/AlarmScheduler")
		const { DefaultDateProvider } = await import("../../calendar/date/CalendarUtils")
		const dateProvider = new DefaultDateProvider()
		return new AlarmScheduler(dateProvider, await this.scheduler())
	})

	private async scheduler(): Promise<SchedulerImpl> {
		const dateProvider = await this.noZoneDateProvider()
		return new SchedulerImpl(dateProvider, window, window)
	}

	async calendarEventPreviewModel(selectedEvent: CalendarEvent, calendars: ReadonlyMap<string, CalendarInfo>): Promise<CalendarEventPreviewViewModel> {
		const { findAttendeeInAddresses } = await import("../common/utils/CommonCalendarUtils.js")
		const { getEventType } = await import("../../../calendar-app/calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")

		const mailboxDetails = await this.mailModel.getUserMailboxDetails()

		const mailboxProperties = await this.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)

		const userController = this.logins.getUserController()
		const customer = await userController.loadCustomer()
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo)
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses)
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController.user)
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

	readonly nativeContactsSyncManager = lazyMemoized(() => {
		assert(isApp(), "isApp")
		return new NativeContactsSyncManager(this.logins, this.mobileContactsFacade, this.entityClient, this.eventController, this.contactModel, deviceConfig)
	})

	postLoginActions: () => Promise<PostLoginActions> = lazyMemoized(async () => {
		const { PostLoginActions } = await import("../../login/PostLoginActions")
		return new PostLoginActions(
			this.credentialsProvider,
			this.secondFactorHandler,
			this.connectivityModel,
			this.logins,
			await this.noZoneDateProvider(),
			this.entityClient,
			this.userManagementFacade,
			this.customerFacade,
			() => this.showSetupWizard(),
		)
	})

	showSetupWizard = async () => {
		if (isApp()) {
			const { showSetupWizard } = await import("../../native/main/wizard/SetupWizard.js")
			return showSetupWizard(
				this.systemPermissionHandler,
				this.webMobileFacade,
				await this.contactImporter(),
				this.systemFacade,
				this.credentialsProvider,
				await this.nativeContactsSyncManager(),
				deviceConfig,
			)
		}
	}
	readonly credentialFormatMigrator: () => Promise<CredentialFormatMigrator> = lazyMemoized(async () => {
		const { CredentialFormatMigrator } = await import("../../misc/credentials/CredentialFormatMigrator.js")
		if (isDesktop()) {
			return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, null)
		} else if (isApp()) {
			return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, this.systemFacade)
		} else {
			return new CredentialFormatMigrator(deviceConfig, null, null)
		}
	})

	async addNotificationEmailDialog(): Promise<AddNotificationEmailDialog> {
		const { AddNotificationEmailDialog } = await import("../../../mail-app/settings/AddNotificationEmailDialog.js")
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
		const { CredentialsProvider } = await import("../../misc/credentials/CredentialsProvider.js")
		if (isDesktop() || isApp()) {
			return new CredentialsProvider(this.nativeCredentialsFacade, this.sqlCipherFacade, isDesktop() ? this.interWindowEventSender : null)
		} else {
			const { WebCredentialsFacade } = await import("../../misc/credentials/WebCredentialsFacade.js")
			return new CredentialsProvider(new WebCredentialsFacade(deviceConfig), null, null)
		}
	}
}

export type IMainLocator = Readonly<MainLocator>

export const locator: IMainLocator = new MainLocator()

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}
