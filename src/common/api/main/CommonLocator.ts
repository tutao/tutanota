import { WorkerClient } from "./WorkerClient.js"
import { FileController } from "../../file/FileController.js"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { SearchTextInAppFacade } from "../../native/common/generatedipc/SearchTextInAppFacade.js"
import { InterWindowEventFacadeSendDispatcher } from "../../native/common/generatedipc/InterWindowEventFacadeSendDispatcher.js"
import { WebauthnClient } from "../../misc/2fa/webauthn/WebauthnClient.js"
import { SystemPermissionHandler } from "../../native/main/SystemPermissionHandler.js"
import { SecondFactorHandler } from "../../misc/2fa/SecondFactorHandler.js"
import { PageContextLoginListener } from "./PageContextLoginListener.js"
import { NewsModel } from "../../misc/news/NewsModel.js"
import { InfoMessageHandler } from "../../gui/InfoMessageHandler.js"
import { SettingsFacade } from "../../native/common/generatedipc/SettingsFacade.js"
import { DesktopSystemFacade } from "../../native/common/generatedipc/DesktopSystemFacade.js"
import { EntityClient } from "../common/EntityClient.js"
import type { LoginFacade } from "../worker/facades/LoginFacade.js"
import type { CustomerFacade } from "../worker/facades/lazy/CustomerFacade.js"
import type { GiftCardFacade } from "../worker/facades/lazy/GiftCardFacade.js"
import type { GroupManagementFacade } from "../worker/facades/lazy/GroupManagementFacade.js"
import type { ConfigurationDatabase } from "../worker/facades/lazy/ConfigurationDatabase.js"
import type { CalendarFacade } from "../worker/facades/lazy/CalendarFacade.js"
import type { MailFacade } from "../worker/facades/lazy/MailFacade.js"
import type { ShareFacade } from "../worker/facades/lazy/ShareFacade.js"
import type { CounterFacade } from "../worker/facades/lazy/CounterFacade.js"
import type { BookingFacade } from "../worker/facades/lazy/BookingFacade.js"
import type { MailAddressFacade } from "../worker/facades/lazy/MailAddressFacade.js"
import type { BlobFacade } from "../worker/facades/lazy/BlobFacade.js"
import type { UserManagementFacade } from "../worker/facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "../worker/facades/lazy/RecoverCodeFacade.js"
import { ContactFacade } from "../worker/facades/lazy/ContactFacade.js"
import { IServiceExecutor } from "../common/ServiceRequest.js"
import { CryptoFacade } from "../worker/crypto/CryptoFacade.js"
import { ExposedCacheStorage } from "../worker/rest/DefaultEntityRestCache.js"
import { WorkerFacade } from "../worker/facades/WorkerFacade.js"
import { WebsocketConnectivityModel } from "../../misc/WebsocketConnectivityModel.js"
import type { MailboxDetail, MailboxModel } from "../../mailFunctionality/MailboxModel.js"
import { EventController } from "./EventController.js"
import type { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { ProgressTracker } from "./ProgressTracker.js"
import { LoginController } from "./LoginController.js"
import { Header } from "../../gui/Header.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { UsageTestModel } from "../../misc/UsageTestModel.js"
import { WebMobileFacade } from "../../native/main/WebMobileFacade.js"
import { OperationProgressTracker } from "./OperationProgressTracker.js"
import { DomainConfigProvider } from "../common/DomainConfigProvider.js"
import { MailAddressTableModel } from "../../settings/mailaddress/MailAddressTableModel.js"
import { GroupInfo } from "../entities/sys/TypeRefs.js"
import { lazy } from "@tutao/tutanota-utils"
import { Router } from "../../gui/ScopedRouter.js"
import { NativeInterfaceMain } from "../../native/main/NativeInterfaceMain.js"
import { CommonSystemFacade } from "../../native/common/generatedipc/CommonSystemFacade.js"
import { ThemeFacade } from "../../native/common/generatedipc/ThemeFacade.js"
import { NativePushServiceApp } from "../../native/main/NativePushServiceApp.js"
import { NativeFileApp } from "../../native/common/FileApp.js"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { MobileContactsFacade } from "../../native/common/generatedipc/MobileContactsFacade.js"
import { NativeCredentialsFacade } from "../../native/common/generatedipc/NativeCredentialsFacade.js"
import { CalendarEvent, Mail, MailboxProperties } from "../entities/tutanota/TypeRefs.js"
import { SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { RecipientsSearchModel } from "../../misc/RecipientsSearchModel.js"
import { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import { CalendarEventModel, CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import { CalendarEventPreviewViewModel } from "../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import { RecipientsModel } from "./RecipientsModel.js"
import { ThemeController } from "../../gui/ThemeController.js"
import { MobilePaymentsFacade } from "../../native/common/generatedipc/MobilePaymentsFacade.js"
import { AppStorePaymentPicker } from "../../misc/AppStorePaymentPicker.js"
import { WorkerRandomizer } from "../worker/workerInterfaces.js"
import { CommonSearchModel } from "../../search/CommonSearchModel.js"

export interface CommonLocator {
	worker: WorkerClient
	fileController: FileController
	credentialsProvider: CredentialsProvider
	searchTextFacade: SearchTextInAppFacade
	interWindowEventSender: InterWindowEventFacadeSendDispatcher
	webAuthn: WebauthnClient
	systemPermissionHandler: SystemPermissionHandler
	secondFactorHandler: SecondFactorHandler
	loginListener: PageContextLoginListener
	newsModel: NewsModel
	search: CommonSearchModel
	infoMessageHandler: InfoMessageHandler
	desktopSettingsFacade: SettingsFacade
	desktopSystemFacade: DesktopSystemFacade
	themeController: ThemeController

	entityClient: EntityClient
	loginFacade: LoginFacade
	customerFacade: CustomerFacade
	giftCardFacade: GiftCardFacade
	groupManagementFacade: GroupManagementFacade
	configFacade: ConfigurationDatabase
	calendarFacade: CalendarFacade
	mailFacade: MailFacade
	shareFacade: ShareFacade
	counterFacade: CounterFacade
	bookingFacade: BookingFacade
	mailAddressFacade: MailAddressFacade
	blobFacade: BlobFacade
	userManagementFacade: UserManagementFacade
	recoverCodeFacade: RecoverCodeFacade
	contactFacade: ContactFacade
	serviceExecutor: IServiceExecutor
	cryptoFacade: CryptoFacade
	cacheStorage: ExposedCacheStorage
	workerFacade: WorkerFacade
	random: WorkerRandomizer
	connectivityModel: WebsocketConnectivityModel

	mailboxModel: MailboxModel

	calendarModel(): Promise<CalendarModel>

	eventController: EventController
	contactModel: ContactModel
	progressTracker: ProgressTracker
	logins: LoginController
	header: Header
	usageTestController: UsageTestController
	usageTestModel: UsageTestModel
	webMobileFacade: WebMobileFacade
	operationProgressTracker: OperationProgressTracker
	Const: Record<string, any>

	domainConfigProvider(): DomainConfigProvider

	showSetupWizard(): void

	mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel>

	mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userGroupInfo: GroupInfo): Promise<MailAddressTableModel>

	sendMailModel(mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties): Promise<SendMailModel>

	recipientsModel(): Promise<RecipientsModel>

	recipientsSearchModel(): Promise<RecipientsSearchModel>

	initialized: Promise<void>
	throttledRouter: lazy<Router>

	// calendar-related
	calendarEventModel(
		editMode: CalendarOperation,
		event: Partial<CalendarEvent>,
		mailboxDetail: MailboxDetail,
		mailboxProperties: MailboxProperties,
		responseTo: Mail | null,
	): Promise<CalendarEventModel | null>

	calendarEventPreviewModel(selectedEvent: CalendarEvent, calendars: ReadonlyMap<string, CalendarInfo>): Promise<CalendarEventPreviewViewModel>

	// native
	native: NativeInterfaceMain
	commonSystemFacade: CommonSystemFacade
	themeFacade: ThemeFacade
	pushService: NativePushServiceApp
	fileApp: NativeFileApp
	systemFacade: MobileSystemFacade
	mobileContactsFacade: MobileContactsFacade
	nativeCredentialsFacade: NativeCredentialsFacade
	mobilePaymentsFacade: MobilePaymentsFacade
	appStorePaymentPicker: AppStorePaymentPicker
}

export let locator: CommonLocator = new Proxy<CommonLocator>({} as unknown as CommonLocator, {
	get: (target: {}, property: string) => {
		throw new Error("Common locator must be initialized first")
	},
})

export function initCommonLocator(loc: CommonLocator) {
	locator = loc
}
