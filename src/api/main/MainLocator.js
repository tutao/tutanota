//@flow
import type {WorkerClient} from "./WorkerClient"
import {EventController} from "./EventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/SearchModel"
import {MailModel} from "../../mail/MailModel"
import {assertMainOrNode} from "../Env"
import {notifications} from "../../gui/Notifications"
import {logins} from "./LoginController"
import type {ContactModel} from "../../contacts/ContactModel"
import {ContactModelImpl} from "../../contacts/ContactModel"
import {EntityClient} from "../common/EntityClient"
import type {CalendarModel} from "../../calendar/CalendarModel"
import {CalendarModelImpl} from "../../calendar/CalendarModel"
import {ProgressTracker} from "./ProgressTracker"

assertMainOrNode()

export type MainLocatorType = {|
	eventController: EventController,
	entropyCollector: EntropyCollector,
	search: SearchModel,
	mailModel: MailModel;
	calendarModel: CalendarModel;
	init: (WorkerClient) => void;
	contactModel: ContactModel;
	entityClient: EntityClient;
	progressTracker: ProgressTracker;
|}

export const locator: MainLocatorType = ({
	init(worker: WorkerClient) {
		this.eventController = new EventController(logins)
		this.entropyCollector = new EntropyCollector(worker)
		this.search = new SearchModel(worker)
		this.mailModel = new MailModel(notifications, this.eventController, worker)
		this.calendarModel = new CalendarModelImpl(notifications, this.eventController, worker, logins)
		this.contactModel = new ContactModelImpl(worker)
		this.entityClient = new EntityClient(worker)
		this.progressTracker = new ProgressTracker()
	}
}: any)

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}