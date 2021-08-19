// @flow
import {CryptoError} from "../common/error/CryptoError"
import {Queue, Request} from "../common/WorkerProtocol"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {assertMainOrNode, isMain} from "../common/Env"
import type {
	AccountTypeEnum,
	BookingItemFeatureTypeEnum,
	CloseEventBusOptionEnum,
	ConversationTypeEnum,
	EntropySrcEnum,
	InvoiceData,
	ExternalImageRuleEnum,
	MailMethodEnum,
	PaymentData,
	ShareCapabilityEnum,
	SpamRuleFieldTypeEnum,
	SpamRuleTypeEnum
} from "../common/TutanotaConstants"
import {ExternalImageRule} from "../common/TutanotaConstants"
import {locator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import {downcast, identity, objToError} from "../common/utils/Utils"
import stream from "mithril/stream/stream.js"
import type {InfoMessage} from "../common/CommonTypes"
import type {EventWithAlarmInfos} from "../worker/facades/CalendarFacade"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import type {ContactFormAccountReturn} from "../entities/tutanota/ContactFormAccountReturn"
import type {User} from "../entities/sys/User"
import type {GroupInfo} from "../entities/sys/GroupInfo"
import type {PasswordChannelReturn} from "../entities/tutanota/PasswordChannelReturn"
import type {File as TutanotaFile} from "../entities/tutanota/File"
import type {PaymentDataServicePutReturn} from "../entities/sys/PaymentDataServicePutReturn"
import type {PriceServiceReturn} from "../entities/sys/PriceServiceReturn"
import type {MailAddressAliasServiceReturn} from "../entities/sys/MailAddressAliasServiceReturn"
import type {CustomerServerProperties} from "../entities/sys/CustomerServerProperties"
import type {EmailSenderListElement} from "../entities/sys/EmailSenderListElement"
import type {Group} from "../entities/sys/Group"
import type {ContactForm} from "../entities/tutanota/ContactForm"
import type {CustomDomainReturn} from "../entities/sys/CustomDomainReturn"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {CalendarEvent} from "../entities/tutanota/CalendarEvent"
import type {AlarmInfo} from "../entities/sys/AlarmInfo"
import type {PushIdentifier} from "../entities/sys/PushIdentifier"
import type {GroupInvitationPostReturn} from "../entities/tutanota/GroupInvitationPostReturn"
import type {ReceivedGroupInvitation} from "../entities/sys/ReceivedGroupInvitation"
import type {Mail} from "../entities/tutanota/Mail"
import type {EntityRestInterface} from "../worker/rest/EntityRestClient"
import type {NewSessionData} from "../worker/facades/LoginFacade"
import {logins} from "./LoginController"
import type {WebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import {createWebsocketLeaderStatus} from "../entities/sys/WebsocketLeaderStatus"
import type {Country} from "../common/CountryList"
import type {SearchRestriction, SearchResult} from "../worker/search/SearchTypes"
import type {GiftCardRedeemGetReturn} from "../entities/sys/GiftCardRedeemGetReturn"
import {TypeRef} from "../common/utils/TypeRef"
import {addSearchIndexDebugEntry} from "../../misc/IndexerDebugLogger"
import type {TypeModel} from "../common/EntityTypes"
import type {DraftRecipient} from "../entities/tutanota/DraftRecipient"
import type {EncryptedMailAddress} from "../entities/tutanota/EncryptedMailAddress"
import type {RecipientDetails} from "../common/RecipientInfo"

assertMainOrNode()

interface Message {
	id: string,
	type: WorkerRequestType | MainRequestType | NativeRequestType | JsRequestType,
	args: mixed[]
}

export class WorkerClient implements EntityRestInterface {
	initialized: Promise<void>;
	_isInitialized: boolean = false

	_queue: Queue;
	_progressUpdater: ?progressUpdater;
	_wsConnection: Stream<WsConnectionState> = stream("terminated");
	+infoMessages: Stream<InfoMessage>;
	_leaderStatus: WebsocketLeaderStatus


	constructor() {
		this._leaderStatus = createWebsocketLeaderStatus({leaderStatus: false}) //init as non-leader
		this.infoMessages = stream()
		locator.init(this)
		this._initWorker()

		this.initialized.then(() => {
			this._isInitialized = true
			this._initServices()
		})
		this._queue.setCommands({
			execNative: (message: Message) =>
				import("../../native/common/NativeWrapper").then(({nativeApp}) =>
					nativeApp.invokeNative(new Request(downcast(message.args[0]), downcast(message.args[1])))),
			entityEvent: (message: Message) => {
				return locator.eventController.notificationReceived(downcast(message.args[0]), downcast(message.args[1]))
			},
			error: (message: Message) => {
				handleUncaughtError(objToError((message).args[0]))
				return Promise.resolve()
			},
			progress: (message: Message) => {
				const progressUpdater = this._progressUpdater
				if (progressUpdater) {
					progressUpdater(downcast(message.args[0]))
				}
				return Promise.resolve()
			},
			updateIndexState: (message: Message) => {
				locator.search.indexState(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateWebSocketState: (message: Message) => {
				this._wsConnection(downcast(message.args[0]));
				return Promise.resolve()
			},
			counterUpdate: (message: Message) => {
				locator.eventController.counterUpdateReceived(downcast(message.args[0]))
				return Promise.resolve()
			},
			updateLeaderStatus: (message: Message) => {
				this._leaderStatus = downcast(message.args[0])
				return Promise.resolve()
			},
			infoMessage: (message: Message) => {
				this.infoMessages(downcast(message.args[0]))
				return Promise.resolve()
			},
			createProgressMonitor: (message: Message) => {
				const work = downcast(message.args[0])
				const reference = locator.progressTracker.registerMonitor(work)
				return Promise.resolve(reference)
			},
			progressWorkDone: (message: Message) => {
				const reference = downcast(message.args[0])
				const workDone = downcast(message.args[1])
				const monitor = locator.progressTracker.getMonitor(reference)
				monitor && monitor.workDone(workDone)
				return Promise.resolve()
			},
			writeIndexerDebugLog: (message: Message) => {
				const reason = downcast(message.args[0])
				const user = downcast(message.args[1])
				addSearchIndexDebugEntry(reason, user)
				return Promise.resolve()
			}
		})
	}

	_initWorker() {
		if (env.mode !== "Test") {
			const {prefixWithoutFile} = window.tutao.appState
			// In apps/desktop we load HTML file and url ends on path/index.html so we want to load path/WorkerBootstrap.js.
			// In browser we load at domain.com or localhost/path (locally) and we want to load domain.com/WorkerBootstrap.js or
			// localhost/path/WorkerBootstrap.js respectively.
			// Service worker has similar logic but it has luxury of knowing that it's served as sw.js.
			const workerUrl = prefixWithoutFile + '/worker-bootstrap.js'
			const worker = new Worker(workerUrl)
			this._queue = new Queue(worker)

			let start = new Date().getTime()
			this.initialized = this._queue
			                       .postMessage(new Request('setup', [
				                       window.env, locator.entropyCollector.getInitialEntropy(), client.browserData()
			                       ]))
			                       .then(() => console.log("worker init time (ms):", new Date().getTime() - start))

			worker.onerror = (e: any) => {
				throw new CryptoError("could not setup worker", e)
			}
		} else {
			// node: we do not use workers but connect the client and the worker queues directly with each other
			// attention: do not load directly with require() here because in the browser SystemJS would load the WorkerImpl in the client although this code is not executed
			// $FlowIssue[cannot-resolve-name] flow doesn't know globalThis
			const WorkerImpl = globalThis.testWorker
			const workerImpl = new WorkerImpl(this, true, client.browserData())
			workerImpl._queue._transport = {postMessage: msg => this._queue._handleMessage(msg)}
			this._queue = new Queue(({
				postMessage: function (msg) {
					workerImpl._queue._handleMessage(msg)

				}
			}: any))
			this.initialized = Promise.resolve()
		}
	}

	_initServices() {
		if (isMain()) {
			locator.entropyCollector.start()
		}
		import("../../native/common/NativeWrapper").then(({nativeApp}) => nativeApp.init())
	}

	generateSignupKeys(): Promise<[RsaKeyPair, RsaKeyPair, RsaKeyPair]> {
		return this.initialized.then(() => this._postRequest(new Request('generateSignupKeys', arguments)))
	}

	signup(keyPairs: [RsaKeyPair, RsaKeyPair, RsaKeyPair], accountType: AccountTypeEnum, authToken: string, mailAddress: string, password: string, registrationCode: string, currentLanguage: string): Promise<Hex> {
		return this.initialized.then(() => this._postRequest(new Request('signup', arguments)))
	}

	createContactFormUserGroupData(): Promise<void> {
		return this.initialized.then(() => this._postRequest(new Request('createContactFormUserGroupData', arguments)))
	}

	createContactFormUser(password: string, contactFormId: IdTuple, statisticFields: {name: string, value: string}[]): Promise<ContactFormAccountReturn> {
		return this.initialized.then(() => this._postRequest(new Request('createContactFormUser', arguments)))
	}

	createWorkerSession(username: string, password: string, clientIdentifier: string, persistentSession: boolean, permanentLogin: boolean): Promise<{user: User, userGroupInfo: GroupInfo, sessionId: IdTuple, credentials: Credentials}> {
		return this.initialized.then(() => this._postRequest(new Request('createSession', arguments)))
	}

	createExternalSession(userId: Id, password: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean
	): Promise<NewSessionData> {
		return this.initialized.then(() => this._postRequest(new Request('createExternalSession', arguments)))
	}

	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array
	): Promise<{user: User, userGroupInfo: GroupInfo, sessionId: IdTuple}> {
		return this._postRequest(new Request('resumeSession', arguments))
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

	createMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: $ReadOnlyArray<DraftRecipient>,
	                ccRecipients: $ReadOnlyArray<DraftRecipient>, bccRecipients: $ReadOnlyArray<DraftRecipient>,
	                conversationType: ConversationTypeEnum, previousMessageId: ?Id,
	                attachments: ?$ReadOnlyArray<TutanotaFile | DataFile | FileReference>,
	                confidential: boolean, replyTos: $ReadOnlyArray<EncryptedMailAddress>, method: MailMethodEnum
	): Promise<Mail> {
		return this._postRequest(new Request('createMailDraft', arguments))
	}

	updateMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: $ReadOnlyArray<DraftRecipient>,
	                ccRecipients: $ReadOnlyArray<DraftRecipient>, bccRecipients: $ReadOnlyArray<DraftRecipient>,
	                attachments: ?$ReadOnlyArray<TutanotaFile | DataFile | FileReference>, confidential: boolean, draft: Mail): Promise<Mail> {
		return this._postRequest(new Request('updateMailDraft', arguments))
	}

	sendMailDraft(draft: Mail, recipients: $ReadOnlyArray<RecipientDetails>, language: string): Promise<void> {
		return this._postRequest(new Request('sendMailDraft', [draft, recipients, language]))
	}

	downloadFileContent(file: TutanotaFile): Promise<DataFile> {
		return this._postRequest(new Request('downloadFileContent', arguments))
	}

	downloadFileContentNative(file: TutanotaFile): Promise<FileReference> {
		return this._postRequest(new Request('downloadFileContentNative', arguments))
	}

	uploadBlob(instance: Object, blobData: Uint8Array, ownerGroupId: Id): Promise<Uint8Array> {
		return this._postRequest(new Request('uploadBlob', arguments))
	}

	downloadBlob(archiveId: Id, blobId: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
		return this._postRequest(new Request("downloadBlob", arguments))
	}

	changeUserPassword(user: User, newPassword: string): Promise<void> {
		return this._postRequest(new Request('changeUserPassword', arguments))
	}

	changeAdminFlag(user: User, admin: boolean): Promise<void> {
		return this._postRequest(new Request('changeAdminFlag', arguments))
	}

	updateAdminship(groupId: Id, newAdminGroupId: Id): Promise<void> {
		return this._postRequest(new Request('updateAdminship', arguments))
	}

	switchFreeToPremiumGroup(): Promise<void> {
		return this._postRequest(new Request('switchFreeToPremiumGroup', arguments))
	}

	switchPremiumToFreeGroup(): Promise<void> {
		return this._postRequest(new Request('switchPremiumToFreeGroup', arguments))
	}

	updatePaymentData(paymentInterval: number, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedInvoiceCountry: ?Country): Promise<PaymentDataServicePutReturn> {
		return this._postRequest(new Request('updatePaymentData', arguments))
	}

	downloadInvoice(invoiceNumber: string): Promise<DataFile> {
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

	getPrice(type: BookingItemFeatureTypeEnum, count: number, reactivate: boolean): Promise<PriceServiceReturn> {
		return this._postRequest(new Request('getPrice', arguments))
	}

	getCurrentPrice(): Promise<PriceServiceReturn> {
		return this._postRequest(new Request('getCurrentPrice', arguments))
	}

	tryReconnectEventBus(closeIfOpen: boolean, enableAutomaticState: boolean, delay: ?number = null): Promise<void> {
		return this._postRequest(new Request('tryReconnectEventBus', [closeIfOpen, enableAutomaticState, delay]))
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

	addSpamRule(field: SpamRuleFieldTypeEnum, type: SpamRuleTypeEnum, value: string): Promise<void> {
		return this._postRequest(new Request('addSpamRule', [field, type, value]))
	}

	editSpamRule(spamRule: EmailSenderListElement): Promise<void> {
		return this._postRequest(new Request('editSpamRule', [spamRule]))
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

	restRequest<T>(path: string, method: HttpMethodEnum, queryParams: Params, headers: Params, body: ?string | ?Uint8Array, responseType: ?MediaTypeEnum, progressListener: ?ProgressListener): Promise<any> {
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

	orderWhitelabelCertificate(domainName: string): Promise<void> {
		return this._postRequest(new Request('orderWhitelabelCertificate', arguments))
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

	search(searchString: string, restriction: SearchRestriction, minSuggestionCount: number,
	       maxResults: ?number): Promise<SearchResult> {
		return this._postRequest(new Request('search', arguments))
	}

	enableMailIndexing(): Promise<void> {
		return this._postRequest(new Request('enableMailIndexing', arguments))
	}

	disableMailIndexing(): Promise<void> {
		return this._postRequest(new Request('disableMailIndexing', arguments))
	}

	extendMailIndex(newEndTimestamp: number): Promise<void> {
		return this._postRequest(new Request('extendMailIndex', arguments))
	}

	cancelMailIndexing(): Promise<void> {
		return this._postRequest(new Request('cancelMailIndexing', arguments))
	}

	readCounterValue(monitorValue: string, ownerId: Id): Promise<string> {
		return this._postRequest(new Request('readCounterValue', arguments))
	}

	cancelCreateSession(): Promise<void> {
		return this._postRequest(new Request('cancelCreateSession', []))
	}

	resolveSessionKey(typeModel: TypeModel, instance: Object): Promise<?string> {
		return this._postRequest(new Request('resolveSessionKey', arguments))
	}

	entityRequest<T>(typeRef: TypeRef<T>, method: HttpMethodEnum, listId: ?Id, id: ?Id, entity: ?T, queryParameter: ?Params): Promise<any> {
		return this._postRequest(new Request('entityRequest', Array.from(arguments)))
	}

	entityEventsReceived(data: Array<EntityUpdate>): Promise<Array<EntityUpdate>> {
		throw new Error("must not be used")
	}

	serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum | StorageServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<any> {
		return this._postRequest(new Request('serviceRequest', Array.from(arguments)))
	}

	entropy(entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		return this._postRequest(new Request('entropy', Array.from(arguments)))
	}

	_postRequest(msg: Request): Promise<any> {
		if (!this._isInitialized) {
			throw new Error("worker has not been initialized, request: " + msg.type)
		}
		return this._queue.postMessage(msg)
	}

	registerProgressUpdater(updater: ?progressUpdater) {
		this._progressUpdater = updater
	}

	unregisterProgressUpdater(updater: ?progressUpdater) {
		// another one might have been registered in the mean time
		if (this._progressUpdater === updater) {
			this._progressUpdater = null
		}
	}

	generateSsePushIdentifer(): Promise<string> {
		return this._postRequest(new Request('generateSsePushIdentifer', arguments))
	}

	decryptUserPassword(userId: string, deviceToken: string, encryptedPassword: string): Promise<string> {
		return this._postRequest(new Request('decryptUserPassword', arguments))
	}

	wsConnection(): Stream<WsConnectionState> {
		return this._wsConnection.map(identity)
	}

	closeEventBus(closeOption: CloseEventBusOptionEnum): Promise<void> {
		return this._queue.postMessage(new Request("closeEventBus", [closeOption]))
	}

	getMoreSearchResults(existingResult: SearchResult, moreResultCount: number): Promise<SearchResult> {
		return this._queue.postMessage(new Request("getMoreSearchResults", [existingResult, moreResultCount]))
	}

	getRecoveryCode(password: string): Promise<string> {
		return this._queue.postMessage(new Request("getRecoveryCode", [password]))
	}

	createRecoveryCode(password: string): Promise<string> {
		return this._queue.postMessage(new Request("createRecoveryCode", [password]))
	}

	recoverLogin(emailAddress: string, recoverCode: string, newPassword: string, clientIdentifier: string): Promise<void> {
		return this._queue.postMessage(new Request("recoverLogin", [emailAddress, recoverCode, newPassword, clientIdentifier]))
	}

	resetSecondFactors(mailAddress: string, password: string, recoverCode: Hex): Promise<void> {
		return this._queue.postMessage(new Request("resetSecondFactors", [mailAddress, password, recoverCode]))
	}

	takeOverDeletedAddress(mailAddress: string, password: string, recoverCode: Hex, targetAccountMailAddress: ?string): Promise<void> {
		return this._queue.postMessage(new Request("takeOverDeletedAddress", arguments))
	}

	resetSession(): Promise<void> {
		return this._queue.postMessage(new Request("resetSession", []))
	}

	reset(): Promise<void> {
		return this._postRequest(new Request('reset', []))
	}

	createCalendarEvent(event: CalendarEvent, alarmInfo: Array<AlarmInfo>, oldEvent: ?CalendarEvent): Promise<void> {
		return this._queue.postMessage(new Request("createCalendarEvent", [event, alarmInfo, oldEvent]))
	}

	updateCalendarEvent(event: CalendarEvent, alarmInfo: Array<AlarmInfo>, oldEvent: CalendarEvent): Promise<void> {
		return this._queue.postMessage(new Request("updateCalendarEvent", [event, alarmInfo, oldEvent]))
	}

	addCalendar(name: string): Promise<Group> {
		// when a calendar group is added, a group membership is added to the user. we might miss this websocket event
		// during startup if the websocket is not connected fast enough. Therefore, we explicitly update the user
		// this should be removed once we handle missed events during startup
		return this._queue.postMessage(new Request("addCalendar", [name]))
		           .then(({user, group}) => {
			           logins.getUserController().user = user
			           return group
		           })
	}

	scheduleAlarmsForNewDevice(pushIdentifier: PushIdentifier): Promise<void> {
		return this._queue.postMessage(new Request("scheduleAlarmsForNewDevice", [pushIdentifier]))
	}

	loadAlarmEvents(): Promise<Array<EventWithAlarmInfos>> {
		return this._queue.postMessage(new Request("loadAlarmEvents", []))
	}

	getDomainValidationRecord(domainName: string): Promise<string> {
		return this._queue.postMessage(new Request("getDomainValidationRecord", [domainName]))
	}

	notifyVisiblityChange(visible: boolean): Promise<void> {
		return this._queue.postMessage(new Request("visibilityChange", [visible]))
	}

	getLog(): Promise<Array<string>> {
		return this._queue.postMessage(new Request("getLog", []))
	}

	sendGroupInvitation(sharedGroupInfo: GroupInfo, sharedGroupName: string, recipientMailAddresses: Array<string>, shareCapability: ShareCapabilityEnum): Promise<GroupInvitationPostReturn> {
		return this._queue.postMessage(new Request("sendGroupInvitation", [sharedGroupInfo, sharedGroupName, recipientMailAddresses, shareCapability]))
	}

	acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		return this._queue.postMessage(new Request("acceptGroupInvitation", [invitation]))
	}

	rejectGroupInvitation(receivedGroupInvitationId: IdTuple): Promise<void> {
		return this._queue.postMessage(new Request("rejectGroupInvitation", [receivedGroupInvitationId]))
	}

	checkMailForPhishing(mail: Mail, links: Array<{href: string, innerHTML: string}>): Promise<boolean> {
		return this._queue.postMessage(new Request("checkMailForPhishing", [mail, links]))
	}

	addExternalImageRule(address: string, rule: ExternalImageRuleEnum): Promise<void> {
		return locator.search.indexingSupported
			? this._queue.postMessage(new Request("addExternalImageRule", [address, rule]))
			: Promise.resolve()
	}

	getExternalImageRule(address: string): Promise<ExternalImageRuleEnum> {
		return locator.search.indexingSupported
			? this._queue.postMessage(new Request("getExternalImageRule", [address]))
			: Promise.resolve(ExternalImageRule.None)
	}

	getEventByUid(uid: string): Promise<?CalendarEvent> {
		return this._queue.postMessage(new Request("getEventByUid", [uid]))
	}

	generateGiftCard(message: string, value: NumberString, countryCode: string): Promise<IdTuple> {
		return this._queue.postMessage(new Request("generateGiftCard", arguments))
	}

	getGiftCardInfo(id: Id, key: string): Promise<GiftCardRedeemGetReturn> {
		return this._queue.postMessage(new Request("getGiftCardInfo", arguments))
	}

	redeemGiftCard(id: Id, key: string): Promise<void> {
		return this._queue.postMessage(new Request("redeemGiftCard", arguments))
	}

	isLeader(): boolean {
		return this._leaderStatus.leaderStatus
	}

	createTemplateGroup(name: string): Promise<Id> {
		return this._postRequest(new Request('createTemplateGroup', arguments))
	}

	urlify(html: string): Promise<string> {
		return this._postRequest(new Request('urlify', arguments))
	}
}

export const worker: WorkerClient = new WorkerClient()
