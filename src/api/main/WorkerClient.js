// @flow
import {CryptoError} from "../common/error/CryptoError"
import {objToError, Queue, Request} from "../common/WorkerProtocol"
import type {HttpMethodEnum, MediaTypeEnum} from "../common/EntityFunctions"
import {TypeRef} from "../common/EntityFunctions"
import {assertMainOrNode, isMain} from "../Env"
import {setup} from "./Entity"
import {nativeApp} from "../../native/NativeWrapper"
import type {
	AccountTypeEnum,
	BookingItemFeatureTypeEnum,
	CloseEventBusOptionEnum,
	ConversationTypeEnum,
	EntropySrcEnum,
	MailMethodEnum,
	ShareCapabilityEnum,
	SpamRuleFieldTypeEnum,
	SpamRuleTypeEnum
} from "../common/TutanotaConstants"
import {locator} from "./MainLocator"
import {client} from "../../misc/ClientDetector"
import {downcast, identity} from "../common/utils/Utils"
import stream from "mithril/stream/stream.js"
import type {InfoMessage} from "../common/CommonTypes"
import type {EventWithAlarmInfo} from "../worker/facades/CalendarFacade"
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
import type {RecipientInfo} from "../common/RecipientInfo"
import type {Country} from "../common/CountryList"
import type {SearchRestriction} from "../worker/search/SearchTypes"

assertMainOrNode()


function requireNodeOnly(path: string) {
	return require(path)
}

type Message = {
	id: string,
	type: string,
	args: mixed[]
}

export class WorkerClient implements EntityRestInterface {
	initialized: Promise<void>;

	_queue: Queue;
	_progressUpdater: ?progressUpdater;
	_wsConnection: Stream<WsConnectionState> = stream("terminated");
	_updateEntityEventProgress: Stream<number> = stream(0);
	+infoMessages: Stream<InfoMessage>;

	constructor() {
		this.infoMessages = stream()
		locator.init(this)
		this._initWorker()

		this.initialized.then(() => {
			this._initServices()
		})
		this._queue.setCommands({
			execNative: (message: Message) =>
				nativeApp.invokeNative(new Request(downcast(message.args[0]), downcast(message.args[1]))),
			entityEvent: (message: Message) => {
				return locator.eventController.notificationReceived(downcast(message.args[0]), downcast(message.args[1]))
			},
			error: (message: Message) => {
				handleUncaughtError(objToError((message: any).args[0]))
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
			updateEntityEventProgress: (message: Message) => {
				this._updateEntityEventProgress(downcast(message.args[0]));
				return Promise.resolve()
			},
			counterUpdate: (message: Message) => {
				locator.eventController.counterUpdateReceived(downcast(message.args[0]))
				return Promise.resolve()
			},
			infoMessage: (message: Message) => {
				this.infoMessages(downcast(message.args[0]))
				return Promise.resolve()
			},
		})
	}

	_initWorker() {
		if (typeof Worker !== 'undefined') {
			let worker = null
			if (env.dist) {
				worker = new Worker(System.getConfig().baseURL + "WorkerBootstrap.js")
			} else {
				let url = System.normalizeSync(typeof module !== "undefined" ? module.id : __moduleName)
				let workerUrl = url.substring(0, url.lastIndexOf('/')) + '/../worker/WorkerBootstrap.js'
				worker = new Worker(workerUrl)
			}
			this._queue = new Queue(worker)

			window.env.systemConfig.baseURL = System.getConfig().baseURL
			window.env.systemConfig.map = System.getConfig().map // update the system config (the current config includes resolved paths; relative paths currently do not work in a worker scope)
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
			const workerModule = requireNodeOnly('./../worker/WorkerImpl.js')
			const workerImpl = new workerModule.WorkerImpl(this, true, client.browserData())
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
		nativeApp.init()
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

	loadExternalPasswordChannels(userId: Id, salt: Uint8Array): Promise<PasswordChannelReturn> {
		return this.initialized.then(() => this._postRequest(new Request('loadExternalPasswordChannels', arguments)))
	}

	sendExternalPasswordSms(userId: Id, salt: Uint8Array, phoneNumberId: Id, languageCode: string, symKeyForPasswordTransmission: ?Aes128Key): Promise<{symKeyForPasswordTransmission: Aes128Key, autoAuthenticationId: Id}> {
		return this._postRequest(new Request('sendExternalPasswordSms', arguments))
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

	createMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: $ReadOnlyArray<RecipientInfo>,
	                ccRecipients: $ReadOnlyArray<RecipientInfo>, bccRecipients: $ReadOnlyArray<RecipientInfo>,
	                conversationType: ConversationTypeEnum, previousMessageId: ?Id,
	                attachments: ?$ReadOnlyArray<TutanotaFile | DataFile | FileReference>,
	                confidential: boolean, replyTos: $ReadOnlyArray<RecipientInfo>, method: MailMethodEnum
	): Promise<Mail> {
		return this._postRequest(new Request('createMailDraft', arguments))
	}

	updateMailDraft(subject: string, body: string, senderAddress: string, senderName: string, toRecipients: $ReadOnlyArray<RecipientInfo>,
	                ccRecipients: $ReadOnlyArray<RecipientInfo>, bccRecipients: $ReadOnlyArray<RecipientInfo>,
	                attachments: ?$ReadOnlyArray<TutanotaFile | DataFile | FileReference>, confidential: boolean, draft: Mail): Promise<Mail> {
		return this._postRequest(new Request('updateMailDraft', arguments))
	}

	sendMailDraft(draft: Mail, recipientInfos: $ReadOnlyArray<RecipientInfo>, language: string): Promise<void> {
		return this._postRequest(new Request('sendMailDraft', [draft, recipientInfos, language]))
	}

	downloadFileContent(file: TutanotaFile): Promise<DataFile> {
		return this._postRequest(new Request('downloadFileContent', arguments))
	}

	downloadFileContentNative(file: TutanotaFile): Promise<FileReference> {
		return this._postRequest(new Request('downloadFileContentNative', arguments))
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

	updatePaymentData(businessUse: boolean, paymentInterval: number, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedInvoiceCountry: ?Country): Promise<PaymentDataServicePutReturn> {
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

	uploadCertificate(domainName: string, pemCertificateChain: ?string, pemPrivateKey: ?string): Promise<void> {
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

	serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<any> {
		return this._postRequest(new Request('serviceRequest', Array.from(arguments)))
	}

	entropy(entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		return this._postRequest(new Request('entropy', Array.from(arguments)))
	}

	_postRequest(msg: Request): Promise<any> {
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

	updateEntityEventProgress(): Stream<number> {
		return this._updateEntityEventProgress.map(identity)
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

	loadAlarmEvents(): Promise<Array<EventWithAlarmInfo>> {
		return this._queue.postMessage(new Request("loadAlarmEvents", []))
	}

	getDomainValidationRecord(): Promise<string> {
		return this._queue.postMessage(new Request("getDomainValidationRecord", []))
	}

	notifyVisiblityChange(visible: boolean): Promise<void> {
		return this._queue.postMessage(new Request("visibilityChange", [visible]))
	}

	getLog(): Promise<Array<string>> {
		return this._queue.postMessage(new Request("getLog", []))
	}

	sendGroupInvitation(sharedGroupInfo: GroupInfo, sharedGroupName: string, recipients: Array<RecipientInfo>, shareCapability: ShareCapabilityEnum): Promise<GroupInvitationPostReturn> {
		return this._queue.postMessage(new Request("sendGroupInvitation", [sharedGroupInfo, sharedGroupName, recipients, shareCapability]))
	}

	acceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<void> {
		return this._queue.postMessage(new Request("acceptGroupInvitation", [invitation]))
	}

	rejectGroupInvitation(receivedGroupInvitaitonId: IdTuple): Promise<void> {
		return this._queue.postMessage(new Request("rejectGroupInvitation", [receivedGroupInvitaitonId]))
	}

	checkMailForPhishing(mail: Mail, links: Array<string>): Promise<boolean> {
		return this._queue.postMessage(new Request("checkMailForPhishing", [mail, links]))
	}

	getEventByUid(uid: string): Promise<?CalendarEvent> {
		return this._queue.postMessage(new Request("getEventByUid", [uid]))
	}
}

export const worker: WorkerClient = new WorkerClient()
