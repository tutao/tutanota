//@flow
import type {WorkerClient} from "./WorkerClient"
import {bootstrapWorker} from "./WorkerClient"
import {EventController} from "./EventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/model/SearchModel"
import {MailModel} from "../../mail/model/MailModel"
import {assertMainOrNode} from "../common/Env"
import {notifications} from "../../gui/Notifications"
import {logins} from "./LoginController"
import type {ContactModel} from "../../contacts/model/ContactModel"
import {ContactModelImpl} from "../../contacts/model/ContactModel"
import {EntityClient} from "../common/EntityClient"
import type {CalendarModel} from "../../calendar/model/CalendarModel"
import {CalendarModelImpl} from "../../calendar/model/CalendarModel"
import {defer} from "../common/utils/Utils"
import {ProgressTracker} from "./ProgressTracker"
import {MinimizedMailEditorViewModel} from "../../mail/model/MinimizedMailEditorViewModel"
import {SchedulerImpl} from "../../misc/Scheduler"
import type {ICredentialsProvider} from "../../misc/credentials/CredentialsProvider"
import {createCredentialsProvider} from "../../misc/credentials/CredentialsProviderFactory"
import type {LoginFacade} from "../worker/facades/LoginFacade"
import type {CustomerFacade} from "../worker/facades/CustomerFacade"
import type {GiftCardFacade} from "../worker/facades/GiftCardFacade"
import type {GroupManagementFacade} from "../worker/facades/GroupManagementFacade"
import type {ConfigurationDatabase} from "../worker/facades/ConfigurationDatabase"
import type {CalendarFacade} from "../worker/facades/CalendarFacade"
import type {MailFacade} from "../worker/facades/MailFacade"
import type {ShareFacade} from "../worker/facades/ShareFacade"
import type {CounterFacade} from "../worker/facades/CounterFacade"
import type {Indexer} from "../worker/search/Indexer"
import type {SearchFacade} from "../worker/search/SearchFacade"
import type {BookingFacade} from "../worker/facades/BookingFacade"
import type {MailAddressFacade} from "../worker/facades/MailAddressFacade"
import type {FileFacade} from "../worker/facades/FileFacade"
import type {UserManagementFacade} from "../worker/facades/UserManagementFacade"
import type {ContactFormFacade} from "../worker/facades/ContactFormFacade"
import type {DeviceEncryptionFacade} from "../worker/facades/DeviceEncryptionFacade"

assertMainOrNode()

export type MainLocatorType = {|
	init: () => void;
	eventController: EventController,
	search: SearchModel,
	mailModel: MailModel;
	calendarModel: CalendarModel;
	minimizedMailModel: MinimizedMailEditorViewModel;
	contactModel: ContactModel;
	entityClient: EntityClient;
	progressTracker: ProgressTracker;
	initializedWorker: Promise<WorkerClient>;
	credentialsProvider: ICredentialsProvider;
	worker: WorkerClient;
	+loginFacade: LoginFacade;
	+customerFacade: CustomerFacade;
	+giftCardFacade: GiftCardFacade;
	+groupManagementFacade: GroupManagementFacade;
	+configFacade: ConfigurationDatabase;
	+calendarFacade: CalendarFacade;
	+mailFacade: MailFacade;
	+shareFacade: ShareFacade;
	+counterFacade: CounterFacade;
	+indexerFacade: Indexer;
	+searchFacade: SearchFacade;
	+bookingFacade: BookingFacade;
	+mailAddressFacade: MailAddressFacade;
	+fileFacade: FileFacade;
	+userManagementFacade: UserManagementFacade;
	+contactFormFacade: ContactFormFacade;
	+deviceEncryptionFacade: DeviceEncryptionFacade;
|}

const workerDeferred = defer<WorkerClient>()
export const locator: MainLocatorType = ({
	initializedWorker: workerDeferred.promise,
	async init() {
		this.worker = bootstrapWorker(this)
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
			fileFacade,
			userManagementFacade,
			contactFormFacade,
			deviceEncryptionFacade,
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
		this.fileFacade = fileFacade
		this.userManagementFacade = userManagementFacade
		this.contactFormFacade = contactFormFacade
		this.deviceEncryptionFacade = deviceEncryptionFacade

		this.eventController = new EventController(logins)
		this.progressTracker = new ProgressTracker()
		this.search = new SearchModel(this.worker)
		this.entityClient = new EntityClient(this.worker)
		this.credentialsProvider = await createCredentialsProvider(deviceEncryptionFacade)

		this.mailModel = new MailModel(notifications, this.eventController, this.worker, this.mailFacade, this.entityClient)
		const lazyScheduler = async () => {
			const {AlarmSchedulerImpl} = await import("../../calendar/date/AlarmScheduler")
			const {DateProviderImpl} = await import("../../calendar/date/CalendarUtils")
			const dateProvider = new DateProviderImpl()
			return new AlarmSchedulerImpl(dateProvider, new SchedulerImpl(dateProvider, window))
		}
		this.calendarModel = new CalendarModelImpl(
			notifications,
			lazyScheduler,
			this.eventController,
			this.worker,
			logins,
			this.progressTracker,
			this.entityClient,
			this.mailModel,
			this.calendarFacade,
			this.fileFacade,
		)
		this.contactModel = new ContactModelImpl(this.worker, this.entityClient, logins)
		this.minimizedMailModel = new MinimizedMailEditorViewModel()

		const entropyCollector = new EntropyCollector(this.worker)
		entropyCollector.start()

		workerDeferred.resolve(this.worker)
	}
}: any)

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}

// It is critical to accept new locator here because locator is used in a lot of places and calculating all the dependencies is very
// slow during HMR.
// HMR is not meant for changing models so if there is a big change then you are better off reloading but this will work with simple
// method implementation swapping.
const hot = typeof module !== "undefined" && module.hot
if (hot) {
	hot.accept(() => {
		// This should be there already
		const worker = workerDeferred.promise.then((worker) => {
			// Import this module again and init the locator. If someone just imports it they will get a new one
			const newLocator = require(module.id).locator
			newLocator.init(worker)

			// This will patch old instances to use new classes, this is when instances are already injected
			for (const key of Object.getOwnPropertyNames(newLocator)) {
				Object.setPrototypeOf(locator[key], Object.getPrototypeOf(newLocator[key]))
			}
		})

	})
}