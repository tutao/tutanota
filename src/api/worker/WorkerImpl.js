// @flow
import {errorToObj, Queue, Request} from "../common/WorkerProtocol"
import {CryptoError} from "../common/error/CryptoError"
import {bookingFacade} from "./facades/BookingFacade"
import {NotAuthenticatedError} from "../common/error/RestError"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {initLocator, locator, resetLocator} from "./WorkerLocator"
import {_service} from "./rest/ServiceRestClient"
import {random} from "./crypto/Randomizer"
import {assertWorkerOrNode, isMainOrNode} from "../Env"
import {nativeApp} from "../../native/NativeWrapper"
import {TotpVerifier} from "./crypto/TotpVerifier"
import type {EntropySrcEnum} from "../common/TutanotaConstants"
import {loadContactForm} from "./facades/ContactFormFacade"
import {keyToBase64} from "./crypto/CryptoUtils"
import {aes256RandomKey} from "./crypto/Aes"
import type {BrowserData} from "../../misc/ClientConstants"
import type {InfoMessage} from "../common/CommonTypes"
import {resolveSessionKey} from "./crypto/CryptoFacade"
import {Logger, replaceNativeLogger} from "../common/Logger"
import {downcast} from "../common/utils/Utils"
import type {ContactFormAccountReturn} from "../entities/tutanota/ContactFormAccountReturn"
import type {PaymentDataServicePutReturn} from "../entities/sys/PaymentDataServicePutReturn"
import type {EntityUpdate} from "../entities/sys/EntityUpdate"
import type {WebsocketCounterData} from "../entities/sys/WebsocketCounterData"

assertWorkerOrNode()

if (typeof self !== "undefined") {
	replaceNativeLogger(self, new Logger())
}

export class WorkerImpl {

	_queue: Queue;
	_newEntropy: number;
	_lastEntropyUpdate: number;

	constructor(self: ?DedicatedWorkerGlobalScope, browserData: BrowserData) {
		if (browserData == null) {
			throw new ProgrammingError("Browserdata is not passed")
		}
		const workerScope = self
		this._queue = new Queue(workerScope)
		nativeApp.setWorkerQueue(this._queue)
		this._newEntropy = -1
		this._lastEntropyUpdate = new Date().getTime()

		initLocator(this, browserData);

		this._queue.setCommands({
			testEcho: (message: any) => Promise.resolve({msg: ">>> " + message.args[0].msg}),
			testError: (message: any) => {
				const errorTypes = {
					ProgrammingError,
					CryptoError,
					NotAuthenticatedError
				}
				let ErrorType = errorTypes[message.args[0].errorType]
				return Promise.reject(new ErrorType(`wtf: ${message.args[0].errorType}`))
			},
			generateSignupKeys: (message: Request) => {
				return locator.customer.generateSignupKeys.apply(locator.customer, message.args)
			},
			signup: (message: Request) => {
				return locator.customer.signup.apply(locator.customer, message.args)
			},
			createContactFormUserGroupData: (message: Request) => {
				return locator.customer.createContactFormUserGroupData.apply(locator.customer, message.args)
			},
			createContactFormUser: (message: Request): Promise<ContactFormAccountReturn> => {
				return locator.customer.createContactFormUser.apply(locator.customer, message.args)
			},
			createSession: (message: Request) => {
				return locator.login.createSession.apply(locator.login, message.args)
			},
			createExternalSession: (message: Request) => {
				return locator.login.createExternalSession.apply(locator.login, message.args)
			},
			loadExternalPasswordChannels: (message: Request) => {
				return locator.login.loadExternalPasswordChannels.apply(locator.login, message.args)
			},
			sendExternalPasswordSms: (message: Request) => {
				return locator.login.sendExternalPasswordSms.apply(locator.login, message.args)
			},
			reset: (message: Request) => {
				return resetLocator()
			},
			resumeSession: (message: Request) => {
				return locator.login.resumeSession.apply(locator.login, message.args)
			},
			deleteSession: (message: Request) => {
				return locator.login.deleteSession.apply(locator.login, message.args)
			},
			changePassword: (message: Request) => {
				return locator.login.changePassword.apply(locator.login, message.args)
			},
			deleteAccount: (message: Request) => {
				return locator.login.deleteAccount.apply(locator.login, message.args)
			},
			createMailFolder: (message: Request) => {
				return locator.mail.createMailFolder.apply(locator.mail, message.args)
			},
			createMailDraft: (message: Request) => {
				return locator.mail.createDraft.apply(locator.mail, message.args)
			},
			updateMailDraft: (message: Request) => {
				return locator.mail.updateDraft.apply(locator.mail, message.args)
			},
			sendMailDraft: (message: Request) => {
				return locator.mail.sendDraft.apply(locator.mail, message.args)
			},
			readAvailableCustomerStorage: (message: Request) => {
				return locator.customer.readAvailableCustomerStorage.apply(locator.customer, message.args)
			},
			readUsedCustomerStorage: (message: Request) => {
				return locator.customer.readUsedCustomerStorage.apply(locator.customer, message.args)
			},
			restRequest: (message: Request) => {
				message.args[3] = Object.assign(locator.login.createAuthHeaders(), message.args[3])
				return locator.restClient.request.apply(locator.restClient, message.args)
			},
			entityRequest: (message: Request) => {
				return locator.cache.entityRequest.apply(locator.cache, message.args)
			},
			serviceRequest: (message: Request) => {
				return _service.apply(null, message.args)
			},
			downloadFileContent: (message: Request) => {
				return locator.file.downloadFileContent.apply(locator.file, message.args)
			},
			downloadFileContentNative: (message: Request) => {
				return locator.file.downloadFileContentNative.apply(locator.file, message.args)
			},
			addMailAlias: (message: Request) => {
				return locator.mailAddress.addMailAlias.apply(locator.mailAddress, message.args)
			},
			setMailAliasStatus: (message: Request) => {
				return locator.mailAddress.setMailAliasStatus.apply(locator.mailAddress, message.args)
			},
			isMailAddressAvailable: (message: Request) => {
				return locator.mailAddress.isMailAddressAvailable.apply(locator.mailAddress, message.args)
			},
			getAliasCounters: (message: Request) => {
				return locator.mailAddress.getAliasCounters.apply(locator.mailAddress, message.args)
			},
			changeUserPassword: (message: Request) => {
				return locator.userManagement.changeUserPassword.apply(locator.userManagement, message.args)
			},
			changeAdminFlag: (message: Request) => {
				return locator.userManagement.changeAdminFlag.apply(locator.userManagement, message.args)
			},
			updateAdminship: (message: Request) => {
				return locator.userManagement.updateAdminship.apply(locator.userManagement, message.args)
			},
			switchFreeToPremiumGroup(message: Request): Promise<void> {
				return locator.customer.switchFreeToPremiumGroup.apply(locator.customer, message.args)
			},
			switchPremiumToFreeGroup(message: Request): Promise<void> {
				return locator.customer.switchPremiumToFreeGroup.apply(locator.customer, message.args)
			},
			updatePaymentData(message: Request): Promise<PaymentDataServicePutReturn> {
				return locator.customer.updatePaymentData.apply(locator.customer, message.args)
			},
			downloadInvoice(message: Request): Promise<DataFile> {
				return locator.customer.downloadInvoice.apply(locator.customer, message.args)
			},
			readUsedUserStorage: (message: Request) => {
				return locator.userManagement.readUsedUserStorage.apply(locator.userManagement, message.args)
			},
			deleteUser: (message: Request) => {
				return locator.userManagement.deleteUser.apply(locator.userManagement, message.args)
			},
			getPrice: (message: Request) => {
				return bookingFacade.getPrice.apply(bookingFacade, message.args)
			},
			getCurrentPrice: (message: Request) => {
				return bookingFacade.getCurrentPrice()
			},

			loadCustomerServerProperties: (message: Request) => {
				return locator.customer.loadCustomerServerProperties.apply(locator.customer, message.args)
			},
			addSpamRule: (message: Request) => {
				return locator.customer.addSpamRule(...message.args)
			},
			editSpamRule: (message: Request) => {
				return locator.customer.editSpamRule(...message.args)
			},
			createUser: (message: Request) => {
				return locator.userManagement.createUser.apply(locator.userManagement, message.args)
			},
			readUsedGroupStorage: (message: Request) => {
				return locator.groupManagement.readUsedGroupStorage.apply(locator.groupManagement, message.args)
			},
			createMailGroup: (message: Request) => {
				return locator.groupManagement.createMailGroup.apply(locator.groupManagement, message.args)
			},
			createLocalAdminGroup: (message: Request) => {
				return locator.groupManagement.createLocalAdminGroup.apply(locator.groupManagement, message.args)
			},
			addUserToGroup: (message: Request) => {
				return locator.groupManagement.addUserToGroup.apply(locator.groupManagement, message.args)
			},
			removeUserFromGroup: (message: Request) => {
				return locator.groupManagement.removeUserFromGroup.apply(locator.groupManagement, message.args)
			},
			deactivateGroup: (message: Request) => {
				return locator.groupManagement.deactivateGroup.apply(locator.groupManagement, message.args)
			},
			loadContactFormByPath: (message: Request) => {
				return loadContactForm.apply(null, message.args)
			},
			addDomain: (message: Request) => {
				return locator.customer.addDomain.apply(locator.customer, message.args)
			},
			removeDomain: (message: Request) => {
				return locator.customer.removeDomain.apply(locator.customer, message.args)
			},
			setCatchAllGroup: (message: Request) => {
				return locator.customer.setCatchAllGroup.apply(locator.customer, message.args)
			},
			uploadCertificate: (message: Request) => {
				return locator.customer.uploadCertificate.apply(locator.customer, message.args)
			},
			deleteCertificate: (message: Request) => {
				return locator.customer.deleteCertificate.apply(locator.customer, message.args)
			},
			generateTotpSecret: (message: Request) => {
				return this.getTotpVerifier().then(totp => totp.generateSecret.apply(totp, message.args))
			},
			generateTotpCode: (message: Request) => {
				return this.getTotpVerifier().then(totp => totp.generateTotp.apply(totp, message.args))
			},
			search: (message: Request) => {
				return locator.search.search.apply(locator.search, message.args)
			},
			enableMailIndexing: (message: Request) => {
				return locator.indexer.enableMailIndexing()
			},
			disableMailIndexing: (message: Request) => {
				return locator.indexer.disableMailIndexing()
			},

			extendMailIndex: (message: Request) => {
				return locator.indexer.extendMailIndex.apply(locator.indexer, message.args)
			},
			cancelMailIndexing: (message: Request) => {
				return locator.indexer.cancelMailIndexing()
			},
			readCounterValue: (message: Request) => {
				return locator.counters.readCounterValue.apply(locator.counters, message.args)
			},
			cancelCreateSession: (message: Request) => {
				locator.login.cancelCreateSession()
				return Promise.resolve()
			},
			entropy: (message: Request) => {
				return this.addEntropy(message.args[0])
			},
			tryReconnectEventBus(message: Request) {
				locator.eventBusClient.tryReconnect.apply(locator.eventBusClient, message.args)
				return Promise.resolve()
			},
			generateSsePushIdentifer: () => {
				return Promise.resolve(keyToBase64(aes256RandomKey()))
			},
			decryptUserPassword: (message: Request) => {
				return locator.login.decryptUserPassword.apply(locator.login, message.args)
			},
			closeEventBus: (message: Request) => {
				locator.eventBusClient.close(message.args[0])
				return Promise.resolve()
			},
			getMoreSearchResults: (message: Request) => {
				return locator.search.getMoreSearchResults.apply(locator.search, message.args).return(message.args[0])
			},
			getRecoveryCode: (message: Request) => {
				return locator.login.getRecoverCode.apply(locator.login, message.args)
			},
			createRecoveryCode: (message: Request) => {
				return locator.login.createRecoveryCode.apply(locator.login, message.args)
			},
			recoverLogin: (message: Request) => {
				return locator.login.recoverLogin.apply(locator.login, message.args)
			},
			resetSecondFactors: (message: Request) => {
				return locator.login.resetSecondFactors.apply(locator.login, message.args)
			},
			resetSession: () => locator.login.reset(),
			createCalendarEvent: (message: Request) => {
				return locator.calendar.createCalendarEvent.apply(locator.calendar, message.args)
			},
			updateCalendarEvent: (message: Request) => {
				return locator.calendar.updateCalendarEvent.apply(locator.calendar, message.args)
			},
			resolveSessionKey: (message: Request) => {
				return resolveSessionKey.apply(null, message.args).then(sk => sk ? keyToBase64(sk) : null)
			},
			addCalendar: (message: Request) => {
				return locator.calendar.addCalendar.apply(locator.calendar, message.args)
			},
			scheduleAlarmsForNewDevice: (message: Request) => {
				return locator.calendar.scheduleAlarmsForNewDevice(...message.args)
			},
			loadAlarmEvents: (message: Request) => {
				return locator.calendar.loadAlarmEvents(...message.args)
			},
			getDomainValidationRecord: (message: Request) => {
				return locator.customer.getDomainValidationRecord(...message.args)
			},
			visibilityChange: (message: Request) => {
				locator.indexer.onVisibilityChanged(...message.args)
				return Promise.resolve()
			},
			getLog: () => {
				const global = downcast(self)
				if (global.logger) {
					return Promise.resolve(global.logger.getEntries())
				} else {
					return Promise.resolve([])
				}
			},
			sendGroupInvitation: (message: Request) => {
				return locator.share.sendGroupInvitation(...message.args)
			},
			acceptGroupInvitation: (message: Request) => {
				return locator.share.acceptGroupInvitation(...message.args)
			},
			rejectGroupInvitation: (message: Request) => {
				return locator.share.rejectGroupInvitation(...message.args)
			},
			checkMailForPhishing: (message: Request) => {
				return locator.mail.checkMailForPhishing(...message.args)
			},
			getEventByUid: (message: Request) => {
				return locator.calendar.getEventByUid(...message.args)
			},
		})

		// only register oncaught error handler if we are in the *real* worker scope
		// Otherwise uncaught error handler might end up in an infinite loop for test cases.
		if (workerScope && !isMainOrNode()) {
			Promise.onPossiblyUnhandledRejection(e => {
				this.sendError(e)
			})

			workerScope.onerror = (e: string | Event, source, lineno, colno, error) => {
				console.error("workerImpl.onerror", e, source, lineno, colno, error)
				if (error instanceof Error) {
					this.sendError(error)
				} else {
					const err = new Error(e)
					err.lineNumber = lineno
					err.columnNumber = colno
					err.fileName = source
					this.sendError(err)
				}
				return true
			}
		}
	}

	getTotpVerifier(): Promise<TotpVerifier> {
		return Promise.resolve(new TotpVerifier())
	}

	/**
	 * Adds entropy to the randomizer. Updated the stored entropy for a user when enough entropy has been collected.
	 * @param entropy
	 * @returns {Promise.<void>}
	 */
	addEntropy(entropy: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		try {
			return random.addEntropy(entropy)
		} finally {
			this._newEntropy = this._newEntropy + entropy.reduce((sum, value) => value.entropy + sum, 0)
			let now = new Date().getTime()
			if (this._newEntropy > 5000 && (now - this._lastEntropyUpdate) > 1000 * 60 * 5) {
				this._lastEntropyUpdate = now
				this._newEntropy = 0
				locator.login.storeEntropy()
			}
		}
	}

	entityEventsReceived(data: EntityUpdate[], eventOwnerGroupId: Id): Promise<void> {
		return this._queue.postMessage(new Request("entityEvent", [data, eventOwnerGroupId]))
	}

	sendError(e: Error): Promise<void> {
		return this._queue.postMessage(new Request("error", [errorToObj(e)]))
	}

	sendProgress(progressPercentage: number): Promise<void> {
		return this._queue.postMessage(new Request("progress", [progressPercentage])).then(() => {
			// the worker sometimes does not send the request if it does not get time
			return Promise.fromCallback(cb => {
				setTimeout(() => {
					cb()
				}, 0)
			})
		})
	}

	sendIndexState(state: SearchIndexStateInfo): Promise<void> {
		return this._queue.postMessage(new Request("updateIndexState", [state]))
	}

	updateWebSocketState(state: WsConnectionState): Promise<void> {
		console.log("ws displayed state: ", state)
		return this._queue.postMessage(new Request("updateWebSocketState", [state]))
	}

	updateEntityEventProgress(state: number): Promise<void> {
		return this._queue.postMessage(new Request("updateEntityEventProgress", [state]))
	}

	updateCounter(update: WebsocketCounterData): Promise<void> {
		return this._queue.postMessage(new Request("counterUpdate", [update]))
	}

	infoMessage(message: InfoMessage) {
		return this._queue.postMessage(new Request("infoMessage", [message]))
	}
}

