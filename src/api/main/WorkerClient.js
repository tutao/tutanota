// @flow
import {CryptoError} from "../common/error/CryptoError"
import {Request, Queue, objToError} from "../common/WorkerProtocol"
import {UserController} from "../main/UserController"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {TypeRef} from "../common/EntityFunctions"
import {assertMainOrNode, isMain} from "../Env"
import {TutanotaPropertiesTypeRef} from "../entities/tutanota/TutanotaProperties"
import {loadRoot} from "./Entity"
import {nativeApp} from "../../native/NativeWrapper"
import {logins} from "./LoginController"
import type {
	EntropySrcEnum,
	ConversationTypeEnum,
	AccountTypeEnum,
	BookingItemFeatureTypeEnum
} from "../common/TutanotaConstants"
import {initLocator, locator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"

assertMainOrNode()


function requireNodeOnly(path: string) {
	return require(path)
}

export class WorkerClient {
	initialized: Promise<void>;

	_queue: Queue;
	_progressUpdater: ?progressUpdater;

	constructor() {
		initLocator(this)
		this._initWorker()
		this.initialized.then(() => {
			this._initServices()
		})
		this._queue.setCommands({
			execNative: (message: any) => nativeApp.invokeNative(new Request(message.args[0], message.args[1])),
			entityEvent: (message: any) => {
				locator.entityEvent.notificationReceived(message.args[0])
				return Promise.resolve()
			},
			error: (message: any) => {
				throw objToError((message:any).args[0])
			},
			progress: (message: any) => {
				if (this._progressUpdater) {
					this._progressUpdater(message.args[0])
				}
				return Promise.resolve()
			},
			updateIndexState: (message: any) => {
				locator.search.indexState(message.args[0])
				return Promise.resolve()
			}
		})
	}

	_initWorker() {
		if (typeof Worker !== 'undefined') {
			let worker = null
			if (env.dist) {
				worker = new Worker(System.getConfig().baseURL + "WorkerBootstrap.js")
			} else {
				let url = System.normalizeSync(typeof module != "undefined" ? module.id : __moduleName)
				let workerUrl = url.substring(0, url.lastIndexOf('/')) + '/../worker/WorkerBootstrap.js'
				worker = new Worker(workerUrl)
			}
			this._queue = new Queue(worker)

			window.env.systemConfig.baseURL = System.getConfig().baseURL
			window.env.systemConfig.map = System.getConfig().map // update the system config (the current config includes resolved paths; relative paths currently do not work in a worker scope)
			let start = new Date().getTime()
			this.initialized = this._queue.postMessage(new Request('setup', [window.env, locator.entropyCollector.getInitialEntropy(), client.indexedDb()]))
				.then(() => console.log("worker init time (ms):", new Date().getTime() - start))

			worker.onerror = (e: any) => {
				throw new CryptoError("could not setup worker", e)
			}

		} else {
			// node: we do not use workers but connect the client and the worker queues directly with each other
			// attention: do not load directly with require() here because in the browser SystemJS would load the WorkerImpl in the client although this code is not executed
			const workerModule = requireNodeOnly('./../worker/WorkerImpl.js')
			const workerImpl = new workerModule.WorkerImpl(this)
			workerImpl._queue._transport = {postMessage: msg => this._queue._handleMessage(msg)}
			this._queue = new Queue(({
				postMessage: function (msg) {
					workerImpl._queue._handleMessage(msg)

				}
			}:any))
			this.initialized = Promise.resolve()
		}
	}

	_initServices() {
		if (isMain()) {
			locator.entropyCollector.start()
		}
		nativeApp.init()
	}

	signup(accountType: AccountTypeEnum, authToken: string, mailAddress: string, password: string, registrationCode: string, currentLanguage: string): Promise<void> {
		return this.initialized.then(() => this._postRequest(new Request('signup', arguments)))
	}

	createContactFormUserGroupData(): Promise<void> {
		return this.initialized.then(() => this._postRequest(new Request('createContactFormUserGroupData', arguments)))
	}

	createContactFormUser(password: string, contactFormId: IdTuple, statisticFields: {name: string, value: string}[]): Promise<ContactFormAccountReturn> {
		return this.initialized.then(() => this._postRequest(new Request('createContactFormUser', arguments)))
	}

	createWorkerSession(username: string, password: string, clientIdentifier: string, persistentSession: boolean, permanentLogin: boolean): Promise<{user:User, userGroupInfo: GroupInfo, sessionId: IdTuple, credentials: Credentials}> {
		return this.initialized.then(() => this._postRequest(new Request('createSession', arguments)))
	}

	createSession(username: string, password: string, clientIdentifier: string, persistentSession: boolean, permanentLogin: boolean): Promise<Credentials> {
		return this.createWorkerSession(username, password, clientIdentifier, persistentSession, permanentLogin).then(loginData => {
			return this._initUserController(loginData.user, loginData.userGroupInfo, loginData.sessionId, loginData.credentials.accessToken, persistentSession).then(() => loginData.credentials)
		})
	}

	_initUserController(user: User, userGroupInfo: GroupInfo, sessionId: IdTuple, accessToken: Base64Url, persistentSession: boolean): Promise<void> {
		return loadRoot(TutanotaPropertiesTypeRef, user.userGroup.group).then(props => {
			logins.setUserController(new UserController(user, userGroupInfo, sessionId, props, accessToken, persistentSession))
		})
	}

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean): Promise<Credentials> {
		return this.initialized.then(() => this._postRequest(new Request('createExternalSession', arguments)).then(loginData => {
			return this._initUserController(loginData.user, loginData.userGroupInfo, loginData.sessionId, loginData.credentials.accessToken, persistentSession).then(() => loginData.credentials)
		}))
	}

	logout(sync: boolean): Promise<void> {
		return Promise.all([
			logins.deleteSession(sync),
			this._postRequest(new Request('reset', arguments))
		]).return()
	}

	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<void> {
		return this._postRequest(new Request('resumeSession', arguments)).then(loginData => {
			return this._initUserController(loginData.user, loginData.userGroupInfo, loginData.sessionId, credentials.accessToken, true)
		})
	}

	deleteSession(accessToken: Base64Url): Promise<void> {
		return this._postRequest(new Request('deleteSession', arguments))
	}

	changePassword(oldPassword: string, newPassword: string): Promise<void> {
		return this._postRequest(new Request('changePassword', arguments))
	}

	deleteAccount(password: string, reason: string, takeover: string): Promise<void> {
		return this._postRequest(new Request('deleteAccount', arguments))
	}

	createMailFolder(name: string, parent: IdTuple, ownerGroupId: Id): Promise<void> {
		return this._postRequest(new Request('createMailFolder', arguments))
	}

	createMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: RecipientInfo[], ccRecipients: RecipientInfo[], bccRecipients: RecipientInfo[], conversationType: ConversationTypeEnum, previousMessageId: ?Id, attachments: ?Array<TutanotaFile|DataFile|FileReference>, confidential: boolean, replyTos: RecipientInfo[]): Promise<Mail> {
		return this._postRequest(new Request('createMailDraft', arguments))
	}

	updateMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: RecipientInfo[], ccRecipients: RecipientInfo[], bccRecipients: RecipientInfo[], attachments: ?Array<TutanotaFile|DataFile|FileReference>, confidential: boolean, draft: Mail): Promise<Mail> {
		return this._postRequest(new Request('updateMailDraft', arguments))
	}

	sendMailDraft(draft: Mail, recipientInfos: RecipientInfo[], language: string): Promise<void> {
		return this._postRequest(new Request('sendMailDraft', arguments))
	}

	downloadFileContent(file: TutanotaFile): Promise<DataFile|FileReference> {
		return this._postRequest(new Request('downloadFileContent', arguments))
	}

	changeUserPassword(user: User, newPassword: string): Promise<void> {
		return this._postRequest(new Request('changeUserPassword', arguments))
	}

	changeAdminFlag(user: User, admin: boolean): Promise<void> {
		return this._postRequest(new Request('changeAdminFlag', arguments))
	}

	updateAdminship(groupId: Id, newAdminGroupId: Id) {
		return this._postRequest(new Request('updateAdminship', arguments))
	}

	switchFreeToPremiumGroup(): Promise<void> {
		return this._postRequest(new Request('switchFreeToPremiumGroup', arguments))
	}

	switchPremiumToFreeGroup(): Promise<void> {
		return this._postRequest(new Request('switchPremiumToFreeGroup', arguments))
	}

	updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedInvoiceCountry: ?Country): Promise<PaymentDataServicePutReturn> {
		return this._postRequest(new Request('updatePaymentData', arguments))
	}

	downloadInvoice(invoice: Invoice): Promise<DataFile> {
		return this._postRequest(new Request('downloadInvoice', arguments))
	}

	readUsedUserStorage(user: User): Promise<number> {
		return this._postRequest(new Request('readUsedUserStorage', arguments))
	}

	readUsedGroupStorage(groupId: Id): Promise<number> {
		return this._postRequest(new Request('readUsedGroupStorage', arguments))
	}

	deleteUser(user: User, restore: boolean): Promise<void> {
		return this._postRequest(new Request('deleteUser', arguments))
	}

	createMailGroup(name: string, mailAddress: string): Promise<void> {
		return this._postRequest(new Request('createMailGroup', arguments))
	}

	createLocalAdminGroup(name: string): Promise<void> {
		return this._postRequest(new Request('createLocalAdminGroup', arguments))
	}

	getPrice(type: BookingItemFeatureTypeEnum, count: number, reactivate: boolean, paymentInterval: ?number, accountType: ?NumberString, business: ?boolean): Promise<PriceServiceReturn> {
		return this._postRequest(new Request('getPrice', arguments))
	}

	getCurrentPrice(): Promise<PriceServiceReturn> {
		return this._postRequest(new Request('getCurrentPrice', arguments))
	}

	tryReconnectEventBus() {
		return this._postRequest(new Request('tryReconnectEventBus', arguments))
	}

	/**
	 * Reads the used storage of a customer in bytes.
	 * @return The amount of used storage in byte.
	 */
	readUsedCustomerStorage(): Promise<NumberString> {
		return this._postRequest(new Request('readUsedCustomerStorage', [logins.getUserController().user.customer]))
	}

	/**
	 * Reads the available storage capacity of a customer in bytes.
	 * @return The amount of available storage capacity in byte.
	 */
	readAvailableCustomerStorage(): Promise<NumberString> {
		return this._postRequest(new Request('readAvailableCustomerStorage', [logins.getUserController().user.customer]))
	}

	addMailAlias(groupId: Id, alias: string): Promise<void> {
		return this._postRequest(new Request('addMailAlias', arguments))
	}

	setMailAliasStatus(groupId: Id, alias: string, restore: boolean): Promise<void> {
		return this._postRequest(new Request('setMailAliasStatus', arguments))
	}

	isMailAddressAvailable(mailAddress: string): Promise<boolean> {
		return this._postRequest(new Request('isMailAddressAvailable', arguments))
	}

	getAliasCounters(): Promise<MailAddressAliasServiceReturn> {
		return this._postRequest(new Request('getAliasCounters', arguments))
	}

	loadCustomerServerProperties(): Promise<CustomerServerProperties> {
		return this._postRequest(new Request('loadCustomerServerProperties', arguments))
	}

	addSpamRule(type: NumberString, value: string): Promise<void> {
		return this._postRequest(new Request('addSpamRule', arguments))
	}

	createUser(name: string, mailAddress: string, password: string, userIndex: number, overallNbrOfUsersToCreate: number): Promise<void> {
		return this._postRequest(new Request('createUser', arguments))
	}

	addUserToGroup(user: User, groupId: Id): Promise<void> {
		return this._postRequest(new Request('addUserToGroup', arguments))
	}

	removeUserFromGroup(userId: Id, groupId: Id): Promise<void> {
		return this._postRequest(new Request('removeUserFromGroup', arguments))
	}

	deactivateGroup(group: Group, restore: boolean): Promise<void> {
		return this._postRequest(new Request('deactivateGroup', arguments))
	}

	loadContactFormByPath(formId: string): Promise<ContactForm> {
		return this._postRequest(new Request('loadContactFormByPath', arguments))
	}

	restRequest<T>(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string|?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener): Promise<any> {
		return this._postRequest(new Request('restRequest', Array.from(arguments)))
	}

	addDomain(domainName: string): Promise<CustomDomainReturn> {
		return this._postRequest(new Request('addDomain', arguments))
	}

	removeDomain(domainName: string): Promise<void> {
		return this._postRequest(new Request('removeDomain', arguments))
	}

	setCatchAllGroup(domainName: string, mailGroupId: ?Id): Promise<void> {
		return this._postRequest(new Request('setCatchAllGroup', arguments))
	}

	uploadCertificate(domainName: string, pemCertificateChain: string, pemPrivateKey: string): Promise<void> {
		return this._postRequest(new Request('uploadCertificate', arguments))
	}

	deleteCertificate(domainName: string): Promise<void> {
		return this._postRequest(new Request('deleteCertificate', arguments))
	}

	generateTotpSecret(): Promise<{key: Uint8Array, readableKey: Base32}> {
		return this._postRequest(new Request('generateTotpSecret', arguments))
	}

	generateTotpCode(time: number, key: Uint8Array): Promise<number> {
		return this._postRequest(new Request('generateTotpCode', arguments))
	}

	search(searchString: string, restriction: SearchRestriction, minSuggestionCount: number): Promise<SearchResult> {
		return this._postRequest(new Request('search', arguments))
	}

	enableMailIndexing(): Promise<void> {
		return this._postRequest(new Request('enableMailIndexing', arguments))
	}

	disableMailIndexing(): Promise<void> {
		return this._postRequest(new Request('disableMailIndexing', arguments))
	}

	cancelMailIndexing(): Promise<void> {
		return this._postRequest(new Request('cancelMailIndexing', arguments))
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params): Promise<any> {
		return this._postRequest(new Request('entityRequest', Array.from(arguments)))
	}

	serviceRequest<T>(service: SysServiceEnum|TutanotaServiceEnum|MonitorServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key): Promise<any> {
		return this._postRequest(new Request('serviceRequest', Array.from(arguments)))
	}

	entropy(entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]) {
		return this._postRequest(new Request('entropy', Array.from(arguments)))
	}

	_postRequest(msg: Request) {
		if (!this.initialized.isFulfilled()) {
			throw new Error("worker has not been initialized, request: " + JSON.stringify(msg))
		}
		return this._queue.postMessage(msg)
	}

	registerProgressUpdater(updater: ?progressUpdater) {
		this._progressUpdater = updater
	}

	unregisterProgressUpdater(updater: ?progressUpdater) {
		// another one might have been registered in the mean time
		if (this._progressUpdater == updater) {
			this._progressUpdater = null
		}
	}

	generateSsePushIdentifer(): Promise<string> {
		return this._postRequest(new Request('generateSsePushIdentifer', arguments))
	}
}

export const worker = new WorkerClient()
