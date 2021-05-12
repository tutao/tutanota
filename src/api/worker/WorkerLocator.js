//@flow
import {LoginFacade} from "./facades/LoginFacade"
import type {WorkerImpl} from "./WorkerImpl"
import {Indexer} from "./search/Indexer"
import type {EntityRestInterface} from "./rest/EntityRestClient"
import {EntityRestClient} from "./rest/EntityRestClient"
import {UserManagementFacade} from "./facades/UserManagementFacade"
import {EntityRestCache} from "./rest/EntityRestCache"
import {GroupManagementFacade} from "./facades/GroupManagementFacade"
import {MailFacade} from "./facades/MailFacade"
import {MailAddressFacade} from "./facades/MailAddressFacade"
import {FileFacade} from "./facades/FileFacade"
import {SearchFacade} from "./search/SearchFacade"
import {CustomerFacade} from "./facades/CustomerFacade"
import {CounterFacade} from "./facades/CounterFacade"
import {EventBusClient} from "./EventBusClient"
import {assertWorkerOrNode, isAdminClient} from "../common/Env"
import {Const} from "../common/TutanotaConstants"
import type {BrowserData} from "../../misc/ClientConstants"
import {CalendarFacade} from "./facades/CalendarFacade"
import {ShareFacade} from "./facades/ShareFacade"
import {RestClient} from "./rest/RestClient"
import {SuspensionHandler} from "./SuspensionHandler"
import {EntityClient} from "../common/EntityClient"
import {GiftCardFacade} from "./facades/GiftCardFacade"
import {ConfigurationDatabase} from "./facades/ConfigurationDatabase"

assertWorkerOrNode()
type WorkerLocatorType = {
	login: LoginFacade;
	indexer: Indexer;
	cache: EntityRestInterface;
	cachingEntityClient: EntityClient;
	search: SearchFacade;
	groupManagement: GroupManagementFacade;
	userManagement: UserManagementFacade;
	customer: CustomerFacade;
	file: FileFacade;
	mail: MailFacade;
	calendar: CalendarFacade;
	mailAddress: MailAddressFacade;
	counters: CounterFacade;
	eventBusClient: EventBusClient;
	_indexedDbSupported: boolean;
	_browserData: BrowserData;
	Const: Object;
	share: ShareFacade;
	restClient: RestClient;
	giftCards: GiftCardFacade;
	configFacade: ConfigurationDatabase
}

export const locator: WorkerLocatorType = ({}: any)

export function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	const getAuthHeaders = () => locator.login.createAuthHeaders()

	const suspensionHandler = new SuspensionHandler(worker)

	locator.restClient = new RestClient(suspensionHandler)

	const entityRestClient = new EntityRestClient(getAuthHeaders, locator.restClient)

	locator._browserData = browserData
	let cache = new EntityRestCache(entityRestClient)
	locator.cache = isAdminClient() ? entityRestClient : cache // we don't wont to cache within the admin area
	locator.cachingEntityClient = new EntityClient(locator.cache)
	locator.indexer = new Indexer(entityRestClient, worker, browserData, locator.cache)
	locator.login = new LoginFacade(worker, locator.restClient, locator.cachingEntityClient)
	const suggestionFacades = [
		locator.indexer._contact.suggestionFacade,
		locator.indexer._groupInfo.suggestionFacade,
		locator.indexer._whitelabelChildIndexer.suggestionFacade
	]
	locator.search = new SearchFacade(locator.login, locator.indexer.db, locator.indexer._mail, suggestionFacades, browserData)
	locator.counters = new CounterFacade()
	locator.groupManagement = new GroupManagementFacade(locator.login, locator.counters, locator.cachingEntityClient)
	locator.userManagement = new UserManagementFacade(worker, locator.login, locator.groupManagement, locator.counters)
	locator.customer = new CustomerFacade(worker, locator.login, locator.groupManagement, locator.userManagement, locator.counters)
	locator.file = new FileFacade(locator.login, locator.restClient, suspensionHandler)
	locator.mail = new MailFacade(locator.login, locator.file, locator.cachingEntityClient)
	locator.calendar = new CalendarFacade(locator.login, locator.groupManagement, cache)
	locator.mailAddress = new MailAddressFacade(locator.login)
	locator.eventBusClient = new EventBusClient(worker, locator.indexer, locator.cache, locator.mail, locator.login,
		locator.cachingEntityClient)
	locator.login.init(locator.indexer, locator.eventBusClient)
	locator.Const = Const
	locator.share = new ShareFacade(locator.login)
	locator.giftCards = new GiftCardFacade(locator.login)
	locator.configFacade = new ConfigurationDatabase(locator.login)
}

export function resetLocator(): Promise<void> {
	return locator.login.reset().then(() => initLocator(locator.login._worker, locator._browserData))
}

if (typeof self !== "undefined") {
	self.locator = locator // export in worker scope
}
// // hot reloading
// if (replaced) {
// 	if (replaced.locator.login) {
// 		Object.assign(locator.login, replaced.locator.login)
// 		// close the websocket, but do not reset the state
// 		if (locator.login._eventBusClient._socket && locator.login._eventBusClient._socket.close) { // close is undefined in node tests
// 			locator.login._eventBusClient.close(CloseEventBusOption.Reconnect);
// 		}
// 		if (locator.login.isLoggedIn()) {
// 			locator.login._eventBusClient.connect(false)
// 		}
// 	}
//
//
// 	if (replaced.locator.indexer) {
// 		Object.assign(locator.indexer, replaced.locator.indexer)
// 	}
//
// 	if (replaced.locator.search) {
// 		Object.assign(locator.search, replaced.locator.search)
// 	}
// }
