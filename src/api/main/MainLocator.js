//@flow
import type {WorkerClient} from "./WorkerClient"
import {EventController} from "./EventController"
import {EntropyCollector} from "./EntropyCollector"
import {SearchModel} from "../../search/SearchModel"
import {MailModel} from "../../mail/MailModel"
import {assertMainOrNode} from "../Env"
import {Notifications} from "../../gui/Notifications"
import {logins} from "./LoginController"
import type {ContactModel} from "../../contacts/ContactModel"
import {ContactModelImpl} from "../../contacts/ContactModel"
import {EntityClient} from "../common/EntityClient"

assertMainOrNode()

export type MainLocatorType = {|
	eventController: EventController,
	entropyCollector: EntropyCollector,
	search: SearchModel,
	mailModel: MailModel;
	init: (WorkerClient) => void;
	contactModel: ContactModel;
	entityClient: EntityClient;
|}

export const locator: MainLocatorType = ({
	init(worker: WorkerClient) {
		this.eventController = new EventController(logins)
		this.entropyCollector = new EntropyCollector(worker)
		this.search = new SearchModel(worker)
		this.mailModel = new MailModel(new Notifications(), this.eventController, worker)
		this.contactModel = new ContactModelImpl(worker)
		this.entityClient = new EntityClient(worker)
	},
}: any)

if (typeof window !== "undefined") {
	window.tutao.locator = locator
}