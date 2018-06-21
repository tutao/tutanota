// @flow
import {Queue, Request, errorToObj} from "../common/WorkerProtocol"
import {CryptoError} from "../common/error/CryptoError"
import {bookingFacade} from "./facades/BookingFacade"
import {NotAuthenticatedError} from "../common/error/RestError"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {locator, initLocator, resetLocator} from "./WorkerLocator"
import {_service} from "./rest/ServiceRestClient"
import {random} from "./crypto/Randomizer"
import {assertWorkerOrNode} from "../Env"
import {nativeApp} from "../../native/NativeWrapper"
import {restClient} from "./rest/RestClient"
import {TotpVerifier} from "./crypto/TotpVerifier"
import type {EntropySrcEnum} from "../common/TutanotaConstants"
import {loadContactForm} from "./facades/ContactFormFacade"
import {keyToBase64} from "./crypto/CryptoUtils"
import {aes256RandomKey} from "./crypto/Aes"

assertWorkerOrNode()

export class WorkerImpl {

	_queue: Queue;
	_newEntropy: number;
	_lastEntropyUpdate: number;

	constructor(self: ?DedicatedWorkerGlobalScope, indexedDbSupported: boolean) {
		const workerScope = self
		this._queue = new Queue(workerScope)
		nativeApp.setWorkerQueue(this._queue)
		this._newEntropy = -1
		this._lastEntropyUpdate = new Date().getTime()

		initLocator(this, indexedDbSupported);

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
				return restClient.request.apply(restClient, message.args)
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
				return locator.customer.addSpamRule.apply(locator.customer, message.args)
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
			cancelMailIndexing: (message: Request) => {
				return locator.indexer.cancelMailIndexing()
			},
			entropy: (message: Request) => {
				return this.addEntropy(message.args[0])
			},
			tryReconnectEventBus(message: Request) {
				return locator.login.tryReconnectEventBus()
			},
			generateSsePushIdentifer: () => {
				return Promise.resolve(keyToBase64(aes256RandomKey()))
			}
		})

		Promise.onPossiblyUnhandledRejection(e => this.sendError(e));
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

	entityEventReceived(data: EntityUpdate): Promise<void> {
		return this._queue.postMessage(new Request("entityEvent", [data]))
	}

	sendError(e: Error): Promise<void> {
		return this._queue.postMessage(new Request("error", [errorToObj(e)]))
	}

	sendProgress(progressPercentage: number): Promise<void> {
		return this._queue.postMessage(new Request("progress", [progressPercentage])).then(() => {
			// the worker sometimes does not send the request if it does not get time
			return Promise.fromCallback(cb => {
				setTimeout(() => {
					cb(null, null)
				}, 0)
			})
		})
	}

	sendIndexState(state: SearchIndexStateInfo): Promise<void> {
		return this._queue.postMessage(new Request("updateIndexState", [state]))
	}
}

