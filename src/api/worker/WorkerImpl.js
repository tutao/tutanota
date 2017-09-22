// @flow
import {Queue, Request, errorToObj} from "../common/WorkerProtocol"
import {CryptoError} from "../common/error/CryptoError"
import {loginFacade} from "./facades/LoginFacade"
import {userManagementFacade} from "./facades/UserManagementFacade"
import {groupManagementFacade} from "./facades/GroupManagementFacade"
import {bookingFacade} from "./facades/BookingFacade"
import {mailFacade} from "./facades/MailFacade"
import {mailAddressAliasFacade} from "./facades/MailAddressFacade"
import {NotAuthenticatedError} from "../common/error/RestError"
import {ProgrammingError} from "../common/error/ProgrammingError"
import {getEntityRestCache, resetEntityRestCache} from "./rest/EntityRestCache"
import {_service} from "./rest/ServiceRestClient"
import {customerFacade} from "./facades/CustomerFacade"
import {fileFacade} from "./facades/FileFacade"
import {random} from "./crypto/Randomizer"
import {assertWorkerOrNode} from "../Env"
import {nativeApp} from "../../native/NativeWrapper"
import {contactFormFacade} from "./facades/ContactFormFacade"
import {restClient} from "./rest/RestClient"
import {TotpVerifier} from "./crypto/TotpVerifier"
import type {EntropySrcEnum} from "../common/TutanotaConstants"

assertWorkerOrNode()

export class WorkerImpl {

	_queue: Queue;

	constructor(self: ?DedicatedWorkerGlobalScope) {
		const workerScope = self
		this._queue = new Queue(workerScope)
		nativeApp.setWorkerQueue(this._queue)

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
				return customerFacade.signup.apply(customerFacade, message.args)
			},
			createContactFormUserGroupData: (message: Request) => {
				return customerFacade.createContactFormUserGroupData.apply(customerFacade, message.args)
			},
			createContactFormUser: (message: Request): Promise<ContactFormAccountReturn> => {
				return customerFacade.createContactFormUser.apply(customerFacade, message.args)
			},
			createSession: (message: Request) => {
				return loginFacade.createSession.apply(loginFacade, message.args)
			},
			createExternalSession: (message: Request) => {
				return loginFacade.createExternalSession.apply(loginFacade, message.args)
			},
			logout: (message: Request) => {
				return loginFacade.logout().then(() => resetEntityRestCache())
			},
			resumeSession: (message: Request) => {
				return loginFacade.resumeSession.apply(loginFacade, message.args)
			},
			deleteSession: (message: Request) => {
				return loginFacade.deleteSession.apply(loginFacade, message.args)
			},
			changePassword: (message: Request) => {
				return loginFacade.changePassword.apply(loginFacade, message.args)
			},
			createMailFolder: (message: Request) => {
				return mailFacade.createMailFolder.apply(mailFacade, message.args)
			},
			createMailDraft: (message: Request) => {
				return mailFacade.createDraft.apply(mailFacade, message.args)
			},
			updateMailDraft: (message: Request) => {
				return mailFacade.updateDraft.apply(mailFacade, message.args)
			},
			sendMailDraft: (message: Request) => {
				return mailFacade.sendDraft.apply(mailFacade, message.args)
			},
			readAvailableCustomerStorage: (message: Request) => {
				return customerFacade.readAvailableCustomerStorage.apply(customerFacade, message.args)
			},
			readUsedCustomerStorage: (message: Request) => {
				return customerFacade.readUsedCustomerStorage.apply(customerFacade, message.args)
			},
			restRequest: (message: Request) => {
				message.args[3] = Object.assign(loginFacade.createAuthHeaders(), message.args[3])
				return restClient.request.apply(restClient, message.args)
			},
			entityRequest: (message: Request) => {
				return getEntityRestCache().entityRequest.apply(getEntityRestCache(), message.args)
			},
			serviceRequest: (message: Request) => {
				return _service.apply(null, message.args)
			},
			downloadFileContent: (message: Request) => {
				return fileFacade.downloadFileContent.apply(fileFacade, message.args)
			},
			addMailAlias: (message: Request) => {
				return mailAddressAliasFacade.addMailAlias.apply(mailAddressAliasFacade, message.args)
			},
			setMailAliasStatus: (message: Request) => {
				return mailAddressAliasFacade.setMailAliasStatus.apply(mailAddressAliasFacade, message.args)
			},
			isMailAddressAvailable: (message: Request) => {
				return mailAddressAliasFacade.isMailAddressAvailable.apply(mailAddressAliasFacade, message.args)
			},
			getAliasCounters: (message: Request) => {
				return mailAddressAliasFacade.getAliasCounters.apply(mailAddressAliasFacade, message.args)
			},
			changeUserPassword: (message: Request) => {
				return userManagementFacade.changeUserPassword.apply(userManagementFacade, message.args)
			},
			changeAdminFlag: (message: Request) => {
				return userManagementFacade.changeAdminFlag.apply(userManagementFacade, message.args)
			},
			readUsedUserStorage: (message: Request) => {
				return userManagementFacade.readUsedUserStorage.apply(userManagementFacade, message.args)
			},
			deleteUser: (message: Request) => {
				return userManagementFacade.deleteUser.apply(userManagementFacade, message.args)
			},
			getPrice: (message: Request) => {
				return bookingFacade.getPrice.apply(bookingFacade, message.args)
			},
			loadCustomerServerProperties: (message: Request) => {
				return customerFacade.loadCustomerServerProperties.apply(customerFacade, message.args)
			},
			addSpamRule: (message: Request) => {
				return customerFacade.addSpamRule.apply(customerFacade, message.args)
			},
			createUser: (message: Request) => {
				return userManagementFacade.createUser.apply(userManagementFacade, message.args)
			},
			readUsedGroupStorage: (message: Request) => {
				return groupManagementFacade.readUsedGroupStorage.apply(groupManagementFacade, message.args)
			},
			createMailGroup: (message: Request) => {
				return groupManagementFacade.createMailGroup.apply(groupManagementFacade, message.args)
			},
			createTeamGroup: (message: Request) => {
				return groupManagementFacade.createTeamGroup.apply(groupManagementFacade, message.args)
			},
			addUserToGroup: (message: Request) => {
				return groupManagementFacade.addUserToGroup.apply(groupManagementFacade, message.args)
			},
			removeUserFromGroup: (message: Request) => {
				return groupManagementFacade.removeUserFromGroup.apply(groupManagementFacade, message.args)
			},
			deactivateGroup: (message: Request) => {
				return groupManagementFacade.deactivateGroup.apply(groupManagementFacade, message.args)
			},
			loadContactFormByPath: (message: Request) => {
				return contactFormFacade.loadContactForm.apply(contactFormFacade, message.args)
			},
			addDomain: (message: Request) => {
				return customerFacade.addDomain.apply(customerFacade, message.args)
			},
			removeDomain: (message: Request) => {
				return customerFacade.removeDomain.apply(customerFacade, message.args)
			},
			setCatchAllGroup: (message: Request) => {
				return customerFacade.setCatchAllGroup.apply(customerFacade, message.args)
			},
			uploadCertificate: (message: Request) => {
				return customerFacade.uploadCertificate.apply(customerFacade, message.args)
			},
			deleteCertificate: (message: Request) => {
				return customerFacade.deleteCertificate.apply(customerFacade, message.args)
			},
			generateTotpSecret: (message: Request) => {
				return this.getTotpVerifier().then(totp => totp.generateSecret.apply(totp, message.args))
			},
			generateTotpCode: (message: Request) => {
				return this.getTotpVerifier().then(totp => totp.generateTotp.apply(totp, message.args))
			},
			entropy(message: Request) {
				return random.addEntropy.apply(random, message.args)
			},
			tryReconnectEventBus(message: Request) {
				return loginFacade.tryReconnectEventBus()
			}
		})
	}

	getTotpVerifier(): Promise<TotpVerifier> {
		return Promise.resolve(new TotpVerifier())
	}

	addEntropy(entropy: {source: EntropySrcEnum, entropy: number, data: number}[]): Promise<void> {
		return random.addEntropy(entropy)
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
}

export const workerImpl: WorkerImpl = new WorkerImpl(typeof self !== 'undefined' ? self : null)