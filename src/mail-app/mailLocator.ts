<<<<<<<< HEAD:src/mail-app/mailLocator.ts
import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp, isTest } from "../common/api/common/Env.js"
import { EventController } from "../common/api/main/EventController.js"
import { SearchModel } from "./search/model/SearchModel.js"
import { MailboxDetail, MailModel } from "../common/mailFunctionality/MailModel.js"
import { MinimizedMailEditorViewModel } from "./mail/model/MinimizedMailEditorViewModel.js"
import { ContactModel } from "../common/contactsFunctionality/ContactModel.js"
import { EntityClient } from "../common/api/common/EntityClient.js"
import { ProgressTracker } from "../common/api/main/ProgressTracker.js"
import { CredentialsProvider } from "../common/misc/credentials/CredentialsProvider.js"
import { bootstrapWorker, WorkerClient } from "../common/api/main/WorkerClient.js"
import { FileController, guiDownload } from "../common/file/FileController.js"
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
import { Indexer } from "../common/api/worker/search/Indexer.js"
import { SearchFacade } from "../common/api/worker/search/SearchFacade.js"
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
import { WorkerRandomizer } from "../common/api/worker/WorkerImpl.js"
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
import { getDisplayedSender, getEnabledMailAddressesWithUser } from "../common/mailFunctionality/CommonMailUtils.js"
import { Const, FeatureType, GroupType, KdfType } from "../common/api/common/TutanotaConstants.js"
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
import { ContactImporter, parseContacts } from "./contacts/ContactImporter.js"
import { MailViewerViewModel } from "./mail/view/MailViewerViewModel.js"
import { ExternalLoginViewModel } from "../common/login/ExternalLoginView.js"
import { NativeInterfaceMain } from "../common/native/main/NativeInterfaceMain.js"
import { NativeFileApp } from "../common/native/common/FileApp.js"
import { NativePushServiceApp } from "../common/native/main/NativePushServiceApp.js"
import { CommonSystemFacade } from "../common/native/common/generatedipc/CommonSystemFacade.js"
import { ThemeFacade } from "../common/native/common/generatedipc/ThemeFacade.js"
import { MobileSystemFacade } from "../common/native/common/generatedipc/MobileSystemFacade.js"
import { MobileContactsFacade } from "../common/native/common/generatedipc/MobileContactsFacade.js"
import { NativeCredentialsFacade } from "../common/native/common/generatedipc/NativeCredentialsFacade.js"
import { MailAddressNameChanger, MailAddressTableModel } from "./settings/mailaddress/MailAddressTableModel.js"
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
========
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
import type { AlarmScheduler } from "../../../calendar-app/calendar/date/AlarmScheduler.js"
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
import { CalendarEventsRepository } from "../../../calendar-app/calendar/date/CalendarEventsRepository.js"
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
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts

assertMainOrNode()

class MailLocator {
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
	themeController!: ThemeController
	Const!: Record<string, any>

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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { MailViewModel } = await import("../mail-app/mail/view/MailViewModel.js")
========
		const { MailViewModel } = await import("../../../mail-app/mail/view/MailViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { SearchViewModel } = await import("../mail-app/search/view/SearchViewModel.js")
========
		const { SearchViewModel } = await import("../../../mail-app/search/view/SearchViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { SearchRouter } = await import("../common/search/view/SearchRouter.js")
========
		const { SearchRouter } = await import("../../../mail-app/search/view/SearchRouter.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		return new SearchRouter(new ScopedRouter(this.throttledRouter(), "/search"))
	})

	readonly unscopedSearchRouter: lazyAsync<SearchRouter> = lazyMemoized(async () => {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { SearchRouter } = await import("../common/search/view/SearchRouter.js")
========
		const { SearchRouter } = await import("../../../mail-app/search/view/SearchRouter.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { ContactViewModel } = await import("../mail-app/contacts/view/ContactViewModel.js")
========
		const { ContactViewModel } = await import("../../../mail-app/contacts/view/ContactViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		const router = new ScopedRouter(this.throttledRouter(), "/contact")
		return new ContactViewModel(this.contactModel, this.entityClient, this.eventController, router, await this.redraw())
	})

	readonly contactListViewModel = lazyMemoized(async () => {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { ContactListViewModel } = await import("../mail-app/contacts/view/ContactListViewModel.js")
========
		const { ContactListViewModel } = await import("../../../mail-app/contacts/view/ContactListViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { CalendarViewModel } = await import("../calendar-app/calendar/view/CalendarViewModel.js")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
========
		const { CalendarViewModel } = await import("../../../calendar-app/calendar/view/CalendarViewModel.js")
		const { DefaultDateProvider } = await import("../../../calendar-app/calendar/date/CalendarUtils")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { CalendarEventsRepository } = await import("../common/calendar/date/CalendarEventsRepository.js")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
========
		const { CalendarEventsRepository } = await import("../../../calendar-app/calendar/date/CalendarEventsRepository.js")
		const { DefaultDateProvider } = await import("../../../calendar-app/calendar/date/CalendarUtils")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		const timeZone = new DefaultDateProvider().timeZone()
		return new CalendarEventsRepository(await this.calendarModel(), this.calendarFacade, timeZone, this.entityClient, this.eventController)
	})

	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	private async sendMailModelSyncFactory(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<() => SendMailModel> {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { SendMailModel } = await import("../common/mailFunctionality/SendMailModel.js")
========
		const { SendMailModel } = await import("../../../mail-app/mail/editor/SendMailModel")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
			import("../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"),
			import("../common/calendar/date/CalendarUtils.js"),
			import("../calendar-app/calendar/view/CalendarNotificationSender.js"),
========
			import("../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"),
			import("../../../calendar-app/calendar/date/CalendarUtils.js"),
			import("../../../calendar-app/calendar/view/CalendarNotificationSender.js"),
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { ConversationViewModel } = await import("../mail-app/mail/view/ConversationViewModel.js")
========
		const { ConversationViewModel } = await import("../../../mail-app/mail/view/ConversationViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { ContactImporter } = await import("../mail-app/contacts/ContactImporter.js")
========
		const { ContactImporter } = await import("../../../mail-app/contacts/ContactImporter.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		return new ContactImporter(this.contactFacade, this.systemPermissionHandler)
	}

	async mailViewerViewModelFactory(): Promise<(options: CreateMailViewerOptions) => MailViewerViewModel> {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { MailViewerViewModel } = await import("../mail-app/mail/view/MailViewerViewModel.js")
========
		const { MailViewerViewModel } = await import("../../../mail-app/mail/view/MailViewerViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
		const { ExternalLoginViewModel } = await import("../common/login/ExternalLoginView.js")
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { MailAddressTableModel } = await import("../mail-app/settings/mailaddress/MailAddressTableModel.js")
========
		const { MailAddressTableModel } = await import("../../../mail-app/settings/mailaddress/MailAddressTableModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { MailAddressTableModel } = await import("../mail-app/settings/mailaddress/MailAddressTableModel.js")
========
		const { MailAddressTableModel } = await import("../../../mail-app/settings/mailaddress/MailAddressTableModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { OwnMailAddressNameChanger } = await import("../mail-app/settings/mailaddress/OwnMailAddressNameChanger.js")
========
		const { OwnMailAddressNameChanger } = await import("../../../mail-app/settings/mailaddress/OwnMailAddressNameChanger.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		return new OwnMailAddressNameChanger(this.mailModel, this.entityClient)
	}

	async adminNameChanger(mailGroupId: Id, userId: Id): Promise<MailAddressNameChanger> {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { AnotherUserMailAddressNameChanger } = await import("../mail-app/settings/mailaddress/AnotherUserMailAddressNameChanger.js")
========
		const { AnotherUserMailAddressNameChanger } = await import("../../../mail-app/settings/mailaddress/AnotherUserMailAddressNameChanger.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
			: new AppsCredentialRemovalHandler(this.indexerFacade, this.pushService, this.configFacade, isApp() ? this.nativeContactsSyncManager() : null)
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
		this.mailModel = new MailModel(
			notifications,
			this.eventController,
			this.mailFacade,
			this.entityClient,
			this.logins,
			this.connectivityModel,
			this.inboxRuleHanlder(),
		)
		this.operationProgressTracker = new OperationProgressTracker()
		this.infoMessageHandler = new InfoMessageHandler((state: SearchIndexStateInfo) => {
			mailLocator.search.indexState(state)
		})

		this.Const = Const
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("../common/native/main/WebDesktopFacade")
			const { WebMobileFacade } = await import("../common/native/main/WebMobileFacade.js")
			const { WebCommonNativeFacade } = await import("../common/native/main/WebCommonNativeFacade.js")
			const { WebInterWindowEventFacade } = await import("../common/native/main/WebInterWindowEventFacade.js")
			const { WebAuthnFacadeSendDispatcher } = await import("../common/native/common/generatedipc/WebAuthnFacadeSendDispatcher.js")
			const { createNativeInterfaces, createDesktopInterfaces } = await import("../common/native/main/NativeInterfaceFactory.js")
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, this.mailModel)
			this.nativeInterfaces = createNativeInterfaces(
				this.webMobileFacade,
				new WebDesktopFacade(this.logins, async () => this.native),
				new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig),
				new WebCommonNativeFacade(
					this.logins,
					this.mailModel,
					this.usageTestController,
					async () => this.fileApp,
					async () => this.pushService,
					async (filesUris: ReadonlyArray<string>) => {
						const importer = await mailLocator.contactImporter()

						// For now, we just handle .vcf files, so we don't need to care about the file type
						const files = await mailLocator.fileApp.getFilesMetaData(filesUris)
						const contacts = await parseContacts(files, mailLocator.fileApp)
						const vCardData = contacts.join("\n")
						const contactListId = assertNotNull(await mailLocator.contactModel.getContactListId())

						await importer.importContactsFromFile(vCardData, contactListId)
					},
				),
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

<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { ContactModel } = await import("../common/contactsFunctionality/ContactModel.js")
========
		const { ContactModel } = await import("../../../mail-app/contacts/model/ContactModel")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		this.contactModel = new ContactModel(this.searchFacade, this.entityClient, this.logins, this.eventController)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()
		this.usageTestController = new UsageTestController(this.usageTestModel)

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

		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer)

		// For native targets WebCommonNativeFacade notifies themeController because Android and Desktop do not seem to work reliably via media queries
		if (selectedThemeFacade instanceof WebThemeFacade) {
			selectedThemeFacade.addDarkListener(() => mailLocator.themeController.reloadTheme())
		}
	}

	readonly calendarModel: () => Promise<CalendarModel> = lazyMemoized(async () => {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
		const { CalendarModel } = await import("../calendar-app/calendar/model/CalendarModel")
========
		const { DefaultDateProvider } = await import("../../../calendar-app/calendar/date/CalendarUtils")
		const { CalendarModel } = await import("../../../calendar-app/calendar/model/CalendarModel")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { CalendarInviteHandler } = await import("../calendar-app/calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("../calendar-app/calendar/view/CalendarNotificationSender.js")
========
		const { CalendarInviteHandler } = await import("../../../calendar-app/calendar/view/CalendarInvites.js")
		const { calendarNotificationSender } = await import("../../../calendar-app/calendar/view/CalendarNotificationSender.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		return new CalendarInviteHandler(this.mailModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) =>
			this.sendMailModel(...arg),
		)
	})

	private alarmScheduler: () => Promise<AlarmScheduler> = lazyMemoized(async () => {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { AlarmScheduler } = await import("../common/calendar/date/AlarmScheduler")
		const { DefaultDateProvider } = await import("../common/calendar/date/CalendarUtils")
========
		const { AlarmScheduler } = await import("../../../calendar-app/calendar/date/AlarmScheduler")
		const { DefaultDateProvider } = await import("../../../calendar-app/calendar/date/CalendarUtils")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
		const dateProvider = new DefaultDateProvider()
		return new AlarmScheduler(dateProvider, await this.scheduler())
	})

	private async scheduler(): Promise<SchedulerImpl> {
		const dateProvider = await this.noZoneDateProvider()
		return new SchedulerImpl(dateProvider, window, window)
	}

	async calendarEventPreviewModel(selectedEvent: CalendarEvent, calendars: ReadonlyMap<string, CalendarInfo>): Promise<CalendarEventPreviewViewModel> {
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { findAttendeeInAddresses } = await import("../common/api/common/utils/CommonCalendarUtils.js")
		const { getEventType } = await import("../calendar-app/calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")
========
		const { findAttendeeInAddresses } = await import("../common/utils/CommonCalendarUtils.js")
		const { getEventType } = await import("../../../calendar-app/calendar/gui/CalendarGuiUtils.js")
		const { CalendarEventPreviewViewModel } = await import("../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts

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
			() => this.showSetupWizard(),
			() => {
				mailLocator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
				mailLocator.nativeContactsSyncManager()?.syncContacts()
			},
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
<<<<<<<< HEAD:src/mail-app/mailLocator.ts
		const { AddNotificationEmailDialog } = await import("../mail-app/settings/AddNotificationEmailDialog.js")
========
		const { AddNotificationEmailDialog } = await import("../../../mail-app/settings/AddNotificationEmailDialog.js")
>>>>>>>> 3349a964d (Move files to new folder structure):src/common/api/main/MainLocator.ts
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
