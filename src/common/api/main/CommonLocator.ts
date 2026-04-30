import { WorkerClient } from "./WorkerClient.js"
import { FileController } from "../../file/FileController.js"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import {
	CommonSystemFacade,
	DesktopSystemFacade,
	InterWindowEventFacadeSendDispatcher,
	MobileContactsFacade,
	MobilePaymentsFacade,
	MobileSystemFacade,
	NativeCredentialsFacade,
	NativeFileApp,
	SearchTextInAppFacade,
	SettingsFacade,
	ThemeFacade,
} from "@tutao/native-bridge/common"
import { WebauthnClient } from "../../misc/2fa/webauthn/WebauthnClient.js"
import { SystemPermissionHandler } from "../../native/SystemPermissionHandler.js"
import { SecondFactorHandler } from "../../misc/2fa/SecondFactorHandler.js"
import { PageContextLoginListener } from "./PageContextLoginListener.js"
import { NewsModel } from "../../misc/news/NewsModel.js"
import { InfoMessageHandler } from "../../gui/InfoMessageHandler.js"
import { EntityClient } from "../../../network/EntityClient.js"
import type { LoginFacade } from "../../../network/LoginFacade.js"
import type { CustomerFacade } from "../worker/facades/lazy/CustomerFacade.js"
import type { GiftCardFacade } from "../worker/facades/lazy/GiftCardFacade.js"
import type { GroupManagementFacade } from "../../../network/facades/lazy/GroupManagementFacade.js"
import type { ConfigurationDatabase } from "../worker/facades/lazy/ConfigurationDatabase.js"
import type { CalendarFacade } from "../worker/facades/lazy/CalendarFacade.js"
import type { MailFacade } from "../worker/facades/lazy/MailFacade.js"
import type { ShareFacade } from "../../../network/facades/lazy/ShareFacade.js"
import type { CounterFacade } from "../../../network/facades/CounterFacade.js"
import type { BookingFacade } from "../worker/facades/lazy/BookingFacade.js"
import type { MailAddressFacade } from "../worker/facades/lazy/MailAddressFacade.js"
import type { BlobFacade } from "../worker/facades/lazy/BlobFacade.js"
import type { UserManagementFacade } from "../worker/facades/lazy/UserManagementFacade.js"
import { RecoverCodeFacade } from "../../../network/facades/lazy/RecoverCodeFacade.js"
import { ContactFacade } from "../worker/facades/lazy/ContactFacade.js"
import { IServiceExecutor } from "../../../network/ServiceRequest.js"
import { CryptoFacade } from "../../../network/crypto/facades/CryptoFacade.js"
import { WorkerFacade } from "../worker/facades/WorkerFacade.js"
import { WebsocketConnectivityModel } from "../../misc/WebsocketConnectivityModel.js"
import type { MailboxDetail, MailboxModel } from "../../mailFunctionality/MailboxModel.js"
import { EventController } from "./EventController.js"
import type { ContactModel } from "../../contactsFunctionality/ContactModel.js"
import { ProgressTracker } from "./ProgressTracker.js"
import { LoginController } from "./LoginController.js"
import { Header } from "../../gui/Header.js"
import { UsageTestController } from "@tutao/usagetests"
import { UsageTestModel } from "../../misc/UsageTestModel.js"
import { WebMobileFacade } from "../../native/WebMobileFacade.js"
import { OperationProgressTracker } from "./OperationProgressTracker.js"
import { DomainConfigProvider } from "../common/DomainConfigProvider.js"
import { MailAddressTableModel, UserInfo } from "../../settings/mailaddress/MailAddressTableModel.js"
import { lazy } from "@tutao/utils"
import { Router } from "../../gui/ScopedRouter.js"
import { NativeInterfaceMain } from "../../native/NativeInterfaceMain.js"
import { NativePushServiceApp } from "../../native/NativePushServiceApp.js"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { SendMailModel } from "../../mailFunctionality/SendMailModel.js"
import { RecipientsSearchModel } from "../../misc/RecipientsSearchModel.js"
import type { CalendarInfo, CalendarModel } from "../../../calendar-app/calendar/model/CalendarModel.js"
import type { CalendarEventModel, CalendarOperation } from "../../../calendar-app/calendar/gui/eventeditor-model/CalendarEventModel.js"
import type { CalendarEventPreviewViewModel } from "../../../calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.js"
import { RecipientsModel } from "./RecipientsModel.js"
import { ThemeController } from "../../gui/ThemeController.js"
import { WorkerRandomizer } from "../worker/workerInterfaces.js"
import { CommonSearchModel } from "../../search/CommonSearchModel.js"
import { DeviceConfig } from "../../misc/DeviceConfig.js"
import type { CalendarContactPreviewViewModel } from "../../../calendar-app/calendar/gui/eventpopup/CalendarContactPreviewViewModel.js"
import { SyncTracker } from "./SyncTracker.js"
import { KeyVerificationFacade } from "../../../network/crypto/facades/lazy/KeyVerificationFacade"
import { SearchToken } from "../common/utils/QueryTokenUtils"
import type { CalendarInviteHandler } from "../../../calendar-app/calendar/view/CalendarInvites"
import { GroupSettingsModel } from "../../sharing/model/GroupSettingsModel"
import { PublicEncryptionKeyProvider } from "../../../network/crypto/facades/PublicEncryptionKeyProvider"
import { IdentityKeyCreator } from "../../../network/facades/lazy/IdentityKeyCreator"
import { PublicIdentityKeyProvider } from "../../../network/crypto/facades/PublicIdentityKeyProvider"
import type { WhitelabelThemeGenerator } from "../../gui/WhitelabelThemeGenerator"
import { LoginViewModel } from "../../login/LoginViewModel"
import { DriveFacade } from "../worker/facades/lazy/DriveFacade.js"
import { TransferProgressDispatcher } from "./TransferProgressDispatcher"
import { CalendarEventUpdateCoordinator } from "../../../calendar-app/calendar/model/CalendarEventUpdateCoordinator"
import { ExposedCacheStorage } from "../../../local-store/CacheStorage"

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
	whitelabelThemeGenerator: WhitelabelThemeGenerator

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
	keyVerificationFacade: KeyVerificationFacade
	publicEncryptionKeyProvider: PublicEncryptionKeyProvider
	publicIdentityKeyProvider: PublicIdentityKeyProvider
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
	identityKeyCreator: IdentityKeyCreator
	driveFacade: DriveFacade

	mailboxModel: MailboxModel

	calendarModel(): Promise<CalendarModel>

	calendarEventUpdateCoordinator(): Promise<CalendarEventUpdateCoordinator>

	readonly calendarInviteHandler: () => Promise<CalendarInviteHandler>

	eventController: EventController
	contactModel: ContactModel
	progressTracker: ProgressTracker
	syncTracker: SyncTracker
	logins: LoginController
	header: Header
	usageTestController: UsageTestController
	usageTestModel: UsageTestModel
	webMobileFacade: WebMobileFacade
	operationProgressTracker: OperationProgressTracker
	transferProgressDispatcher: TransferProgressDispatcher
	Const: Record<string, any>

	domainConfigProvider(): DomainConfigProvider

	loginViewModelFactory(): Promise<lazy<LoginViewModel>>

	showSetupWizard(): void

	mailAddressTableModelForOwnMailbox(): Promise<MailAddressTableModel>

	mailAddressTableModelForAdmin(mailGroupId: Id, userId: Id, userInfo: UserInfo): Promise<MailAddressTableModel>

	sendMailModel(mailboxDetails: MailboxDetail, mailboxProperties: tutanotaTypeRefs.MailboxProperties): Promise<SendMailModel>

	recipientsModel(): Promise<RecipientsModel>

	recipientsSearchModel(): Promise<RecipientsSearchModel>

	readonly groupSettingsModel: lazy<Promise<GroupSettingsModel>>

	initialized: Promise<void>
	throttledRouter: lazy<Router>

	// calendar-related
	calendarEventModel(
		editMode: CalendarOperation,
		event: Partial<tutanotaTypeRefs.CalendarEvent>,
		mailboxDetail: MailboxDetail,
		mailboxProperties: tutanotaTypeRefs.MailboxProperties,
		responseTo: tutanotaTypeRefs.Mail | null,
	): Promise<CalendarEventModel | null>

	calendarEventPreviewModel(
		selectedEvent: tutanotaTypeRefs.CalendarEvent,
		calendars: ReadonlyMap<string, CalendarInfo>,
		highlightedTokens: readonly SearchToken[],
	): Promise<CalendarEventPreviewViewModel>

	calendarContactPreviewModel(
		event: tutanotaTypeRefs.CalendarEvent,
		contact: tutanotaTypeRefs.Contact,
		canEdit: boolean,
	): Promise<CalendarContactPreviewViewModel>

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
	deviceConfig: DeviceConfig

	updateClients(): Promise<void>
}

export let locator: CommonLocator = new Proxy<CommonLocator>({} as unknown as CommonLocator, {
	get: (_: object, property: string) => {
		throw new Error("Common locator must be initialized first")
	},
})

export function initCommonLocator(loc: CommonLocator) {
	locator = loc
}
