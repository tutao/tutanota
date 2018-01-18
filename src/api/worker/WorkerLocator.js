//@flow
import {LoginFacade} from "./facades/LoginFacade"
import {WorkerImpl} from "./WorkerImpl"
import {module as replaced} from "@hot"
import {Indexer} from "./search/Indexer"
import {EntityRestClient} from "./rest/EntityRestClient"
import {UserManagementFacade} from "./facades/UserManagementFacade"
import {EntityRestCache} from "./rest/EntityRestCache"
import {GroupManagementFacade} from "./facades/GroupManagementFacade"
import {MailFacade} from "./facades/MailFacade"
import {MailAddressFacade} from "./facades/MailAddressFacade"
import {FileFacade} from "./facades/FileFacade"
import {SearchFacade} from "./search/SearchFacade"
import {CustomerFacade} from "./facades/CustomerFacade"
import {EventBusClient} from "./EventBusClient"
import {assertWorkerOrNode} from "../Env"
assertWorkerOrNode()
type WorkerLocatorType = {
	login: LoginFacade;
	indexer :Indexer;
	cache :EntityRestCache;
	search :SearchFacade;
	groupManagement :GroupManagementFacade;
	userManagement :UserManagementFacade;
	customer :CustomerFacade;
	file :FileFacade;
	mail :MailFacade;
	mailAddress :MailAddressFacade;
}

export const locator: WorkerLocatorType = ({}:any)

export function initLocator(worker: WorkerImpl) {
	locator.login = new LoginFacade(worker)
	locator.indexer = new Indexer(new EntityRestClient(locator.login), worker)
	locator.cache = new EntityRestCache(new EntityRestClient(locator.login))
	locator.search = new SearchFacade(locator.login, locator.indexer.db, locator.indexer._mail, [locator.indexer._contact.suggestionFacade, locator.indexer._groupInfo.suggestionFacade, locator.indexer._whitelabelChildIndexer.suggestionFacade])
	locator.groupManagement = new GroupManagementFacade(locator.login)
	locator.userManagement = new UserManagementFacade(worker, locator.login, locator.groupManagement)
	locator.customer = new CustomerFacade(worker, locator.login, locator.groupManagement, locator.userManagement)
	locator.file = new FileFacade(locator.login)
	locator.mail = new MailFacade(locator.login, locator.file)
	locator.mailAddress = new MailAddressFacade(locator.login)

	locator.login.init(locator.indexer, new EventBusClient(worker, locator.indexer, locator.cache, locator.mail, locator.login))
}

export function resetEntityRestCache(): void {
	// create a new instance instead of resetting the db because old server requests might be running when resetting and the result would be put into the new cache
	locator.cache = new EntityRestCache(new EntityRestClient(locator.login))
}


if (typeof self != "undefined") {
	self.locator = locator // export in worker scope
}
// hot reloading
if (replaced) {
	if (replaced.locator.login) {
		Object.assign(locator.login, replaced.locator.login)
		// close the websocket, but do not reset the state
		if (locator.login._eventBusClient._socket && locator.login._eventBusClient._socket.close) { // close is undefined in node tests
			locator.login._eventBusClient._socket.close();
		}
		if (locator.login.isLoggedIn()) {
			locator.login._eventBusClient.connect(false)
		}
	}


	if (replaced.locator.indexer) {
		Object.assign(locator.indexer, replaced.locator.indexer)
	}

	if (replaced.locator.search) {
		Object.assign(locator.search, replaced.locator.search)
	}
}
