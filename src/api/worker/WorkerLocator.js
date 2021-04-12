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
import {assertWorkerOrNode, isAdminClient, isTest} from "../common/Env"
import {CloseEventBusOption, Const} from "../common/TutanotaConstants"
import type {BrowserData} from "../../misc/ClientConstants"
import {CalendarFacade} from "./facades/CalendarFacade"
import {ShareFacade} from "./facades/ShareFacade"
import {RestClient} from "./rest/RestClient"
import {SuspensionHandler} from "./SuspensionHandler"
import {EntityClient} from "../common/EntityClient"
import {GiftCardFacade} from "./facades/GiftCardFacade"
import {EntityCacheIdb} from "./rest/EntityCachePersister"
import type {User} from "../entities/sys/User"
import {ConnectionError, ServiceUnavailableError} from "../common/error/RestError"

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
}

export const locator: WorkerLocatorType = ({}: any)

export function initLocator(worker: WorkerImpl, browserData: BrowserData) {
	const getAuthHeaders = () => locator.login.createAuthHeaders()

	const suspensionHandler = new SuspensionHandler(worker)

	locator.restClient = new RestClient(suspensionHandler)

	const entityRestClient = new EntityRestClient(getAuthHeaders, locator.restClient)

	locator._browserData = browserData
	let cache = new EntityRestCache(entityRestClient, new EntityCacheIdb())
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
	locator.groupManagement = new GroupManagementFacade(locator.login, locator.counters)
	locator.userManagement = new UserManagementFacade(worker, locator.login, locator.groupManagement, locator.counters)
	locator.customer = new CustomerFacade(worker, locator.login, locator.groupManagement, locator.userManagement, locator.counters)
	locator.file = new FileFacade(locator.login, locator.restClient, suspensionHandler)
	locator.mail = new MailFacade(locator.login, locator.file, locator.cachingEntityClient)
	locator.calendar = new CalendarFacade(locator.login, locator.userManagement, cache)
	locator.mailAddress = new MailAddressFacade(locator.login)
	locator.eventBusClient = new EventBusClient(worker, locator.indexer, locator.cache, locator.mail, locator.login,
		locator.cachingEntityClient)
	locator.login.init({
		async postLogin(user, userIdFromFormerLogin) {
			if (locator.cache instanceof EntityRestCache) {
				await locator.cache.init(user)
			}
			if (userIdFromFormerLogin) {
				locator.eventBusClient.tryReconnect(true, true)
			} else {
				locator.eventBusClient.connect(false)
			}

			if (!isTest() && !isAdminClient()) {
				// index new items in background
				console.log("_initIndexer after log in")
				initIndexer(worker, user)
			}
		},
		async reset() {
			locator.eventBusClient.close(CloseEventBusOption.Terminate)
		},
	})
	locator.Const = Const
	locator.share = new ShareFacade(locator.login)
	locator.giftCards = new GiftCardFacade(locator.login)
}

export function resetLocator(): Promise<void> {
	return locator.login.reset().then(() => initLocator(locator.login._worker, locator._browserData))
}

if (typeof self !== "undefined") {
	self.locator = locator // export in worker scope
}

function initIndexer(worker: WorkerImpl, user: User): Promise<void> {
	return locator.indexer.init(user, locator.login.getUserGroupKey())
	              .catch(ServiceUnavailableError, e => {
		              console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
		              return Promise.delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
			              console.log("_initIndexer after ServiceUnavailableError")
			              return initIndexer(worker, user)
		              })
	              })
	              .catch(ConnectionError, e => {
		              console.log("Retry init indexer in 30 seconds after ConnectionError")
		              return Promise.delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
			              console.log("_initIndexer after ConnectionError")
			              return initIndexer(worker, user)
		              })
	              })
	              .catch(e => {
		              worker.sendError(e)
	              })
}

const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000