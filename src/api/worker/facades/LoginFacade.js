// @flow
import {serviceRequest, serviceRequestVoid, load, loadRoot, update} from "../EntityWorker"
import {SysService} from "../../entities/sys/Services"
import {
	base64ToBase64Url,
	base64ToUint8Array,
	utf8Uint8ArrayToString,
	uint8ArrayToBase64,
	base64UrlToBase64,
	base64ToBase64Ext
} from "../../common/utils/Encoding"
import {generateKeyFromPassphrase, generateRandomSalt} from "../crypto/Bcrypt"
import {KeyLength} from "../crypto/CryptoConstants"
import {createAuthVerifierAsBase64Url, createAuthVerifier, base64ToKey, keyToUint8Array} from "../crypto/CryptoUtils"
import {decryptKey, encryptKey, encryptBytes, encryptString} from "../crypto/CryptoFacade"
import type {GroupTypeEnum} from "../../common/TutanotaConstants"
import {GroupType, OperationType, AccountType} from "../../common/TutanotaConstants"
import {aes128Decrypt, aes128RandomKey} from "../crypto/Aes"
import {random} from "../crypto/Randomizer"
import {CryptoError} from "../../common/error/CryptoError"
import {createSaltData} from "../../entities/sys/SaltData"
import {SaltReturnTypeRef} from "../../entities/sys/SaltReturn"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {TutanotaPropertiesTypeRef} from "../../entities/tutanota/TutanotaProperties"
import {UserTypeRef} from "../../entities/sys/User"
import {createReceiveInfoServiceData} from "../../entities/tutanota/ReceiveInfoServiceData"
import {neverNull} from "../../common/utils/Utils"
import {isSameTypeRef, TypeRef, isSameId, HttpMethod, GENERATED_ID_BYTES_LENGTH} from "../../common/EntityFunctions"
import {assertWorkerOrNode, isTest} from "../../Env"
import {hash} from "../crypto/Sha256"
import {createChangePasswordData} from "../../entities/sys/ChangePasswordData"
import {EventBusClient} from "../EventBusClient"
import {createCreateSessionData} from "../../entities/sys/CreateSessionData"
import {CreateSessionReturnTypeRef} from "../../entities/sys/CreateSessionReturn"
import {SessionTypeRef, _TypeModel as SessionModelType} from "../../entities/sys/Session"
import {typeRefToPath} from "../rest/EntityRestClient"
import {restClient, MediaType} from "../rest/RestClient"
import {createSecondFactorAuthGetData} from "../../entities/sys/SecondFactorAuthGetData"
import {SecondFactorAuthGetReturnTypeRef} from "../../entities/sys/SecondFactorAuthGetReturn"
import {SecondFactorPendingError} from "../../common/error/SecondFactorPendingError"
import {NotAuthenticatedError, NotFoundError} from "../../common/error/RestError"
import type {WorkerImpl} from "../WorkerImpl"
import type {Indexer} from "../search/Indexer"

assertWorkerOrNode()


export class LoginFacade {
	_user: ?User;
	_userGroupInfo: ?GroupInfo;
	_accessToken: ?string;
	_authVerifierAfterNextRequest: ?Base64Url; // needed for password changes
	groupKeys: {[key:Id] : Aes128Key};
	_eventBusClient: EventBusClient;
	_worker: WorkerImpl;
	_indexer: Indexer;

	constructor(worker: WorkerImpl) {
		this._worker = worker
		this.reset()
	}

	init(indexer: Indexer, eventBusClient: EventBusClient) {
		if (indexer) {
			this._indexer = indexer
		}
		if (eventBusClient) {
			this._eventBusClient = eventBusClient
		}
	}

	reset(): Promise<void> {
		this._user = null
		this._userGroupInfo = null
		this._accessToken = null
		this._authVerifierAfterNextRequest = null
		this.groupKeys = {}
		if (this._eventBusClient) {
			this._eventBusClient.close()
		}
		return Promise.resolve()
	}

	/**
	 * @param permanentLogin True if a user logs in normally, false if this is just a temporary login like for sending a contact form request. If false does not connect the websocket and indexer.
	 */
	createSession(mailAddress: string, passphrase: string, clientIdentifier: string, persistentSession: boolean, permanentLogin: boolean): Promise<{user:User, userGroupInfo: GroupInfo, sessionId: IdTuple, credentials: Credentials}> {
		if (this._user) {
			console.log("session already exists, reuse data")
			// do not reset here because the event bus client needs to be kept if the same user is logged in as before
			// check if it is the same user in _initSession()
		}
		console.log("createSession worker")
		return this._loadUserPassphraseKey(mailAddress, passphrase).then(userPassphraseKey => {
			// the verifier is always sent as url parameter, so it must be url encoded
			let authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
			let sessionData = createCreateSessionData();
			sessionData.mailAddress = mailAddress.toLowerCase().trim()
			sessionData.clientIdentifier = clientIdentifier
			sessionData.authVerifier = authVerifier
			let accessKey = null
			if (persistentSession) {
				accessKey = aes128RandomKey()
				sessionData.accessKey = keyToUint8Array(accessKey)
			}
			return serviceRequest(SysService.SessionService, HttpMethod.POST, sessionData, CreateSessionReturnTypeRef).then(createSessionReturn => {
				let p = Promise.resolve()
				let sessionId = [this._getSessionListId(createSessionReturn.accessToken), this._getSessionElementId(createSessionReturn.accessToken)]
				if (createSessionReturn.challenges.length > 0) {
					this._worker.sendError(new SecondFactorPendingError(sessionId, createSessionReturn.challenges)) // show a notification to the user
					p = this._waitUntilSecondFactorApproved(createSessionReturn.accessToken)
				}
				return p.then(() => {
					return this._initSession(createSessionReturn.user, createSessionReturn.accessToken, userPassphraseKey, permanentLogin).then(() => {
						return {
							user: neverNull(this._user),
							userGroupInfo: neverNull(this._userGroupInfo),
							sessionId,
							credentials: {
								mailAddress,
								accessToken: neverNull(this._accessToken),
								encryptedPassword: accessKey ? uint8ArrayToBase64(encryptString(accessKey, passphrase)) : null
							}
						}
					})
				})
			})
		})
	}

	_waitUntilSecondFactorApproved(accessToken: Base64Url): Promise<void> {
		let secondFactorAuthGetData = createSecondFactorAuthGetData()
		secondFactorAuthGetData.accessToken = accessToken
		return serviceRequest(SysService.SecondFactorAuthService, HttpMethod.GET, secondFactorAuthGetData, SecondFactorAuthGetReturnTypeRef).then(secondFactorAuthGetReturn => {
			if (secondFactorAuthGetReturn.secondFactorPending) {
				return this._waitUntilSecondFactorApproved(accessToken)
			}
		})
	}

	createExternalSession(userId: Id, passphrase: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean): Promise<{user:User, userGroupInfo: GroupInfo, sessionId: IdTuple, credentials: Credentials}> {
		if (this._user) {
			throw new Error("user already logged in")
		}
		console.log("login external worker")
		let userPassphraseKey = generateKeyFromPassphrase(passphrase, salt, KeyLength.b128)
		// the verifier is always sent as url parameter, so it must be url encoded
		let authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
		let authToken = base64ToBase64Url(uint8ArrayToBase64(hash(salt)));

		let sessionData = createCreateSessionData();
		sessionData.user = userId
		sessionData.authToken = authToken
		sessionData.clientIdentifier = clientIdentifier
		sessionData.authVerifier = authVerifier
		let accessKey = null
		if (persistentSession) {
			accessKey = aes128RandomKey()
			sessionData.accessKey = keyToUint8Array(accessKey)
		}
		return serviceRequest(SysService.SessionService, HttpMethod.POST, sessionData, CreateSessionReturnTypeRef).then(createSessionReturn => {
			let sessionId = [this._getSessionListId(createSessionReturn.accessToken), this._getSessionElementId(createSessionReturn.accessToken)]
			return this._initSession(createSessionReturn.user, createSessionReturn.accessToken, userPassphraseKey, true).then(() => {
				return {
					user: neverNull(this._user),
					userGroupInfo: neverNull(this._userGroupInfo),
					sessionId,
					credentials: {
						mailAddress: userId, // we set the external user id because we do not have the mail address
						accessToken: neverNull(this._accessToken),
						encryptedPassword: accessKey ? uint8ArrayToBase64(encryptString(accessKey, passphrase)) : null
					}
				}
			})
		})
	}

	/**
	 * Resume a session of stored credentials.
	 */
	resumeSession(credentials: Credentials, externalUserSalt: ?Uint8Array): Promise<{user:User, userGroupInfo: GroupInfo, sessionId: IdTuple}> {
		console.log("resumeSession worker")
		return this._loadSessionData(credentials.accessToken).then(sessionData => {
			let passphrase = utf8Uint8ArrayToString(aes128Decrypt(sessionData.accessKey, base64ToUint8Array(neverNull(credentials.encryptedPassword))))
			let passphraseKeyPromise: Promise<Aes128Key>
			if (externalUserSalt) {
				passphraseKeyPromise = Promise.resolve(generateKeyFromPassphrase(passphrase, externalUserSalt, KeyLength.b128))
			} else {
				passphraseKeyPromise = this._loadUserPassphraseKey(credentials.mailAddress, passphrase)
			}
			return passphraseKeyPromise.then(userPassphraseKey => {
				return this._initSession(sessionData.userId, credentials.accessToken, userPassphraseKey, true).then(() => {
					return {
						user: neverNull(this._user),
						userGroupInfo: neverNull(this._userGroupInfo),
						sessionId: [this._getSessionListId(credentials.accessToken), this._getSessionElementId(credentials.accessToken)]
					}
				})
			})
		})
	}

	_initSession(userId: Id, accessToken: Base64Url, userPassphraseKey: Aes128Key, permanentLogin: boolean): Promise<void> {
		let userIdFromFormerLogin = (this._user) ? this._user._id : null
		if (userIdFromFormerLogin && userId != userIdFromFormerLogin) {
			throw new Error("different user is tried to login in existing other user's session")
		}
		this._accessToken = accessToken
		return load(UserTypeRef, userId).then(user => {
			this._user = user
			this.groupKeys[this.getUserGroupId()] = decryptKey(userPassphraseKey, this._user.userGroup.symEncGKey)
			return load(GroupInfoTypeRef, user.userGroup.groupInfo)
		}).then(groupInfo => this._userGroupInfo = groupInfo)
			.then(() => {
				if (!isTest() && permanentLogin) {
					// index new items in background
					this._indexer.init(neverNull(this._user), this.getUserGroupKey())
				}
			})
			.then(() => this.loadEntropy())
			.then(() => this._getInfoMails())
			.then(() => {
				if (permanentLogin) {
					// userIdFromFormerLogin is set if session had expired an the user has entered the correct password.
					// close the event bus and reconnect to make sure we get all missed events
					if (userIdFromFormerLogin) {
						this._eventBusClient.tryReconnect(true)
					} else {
						this._eventBusClient.connect(false)
					}
				}
			})
			.then(() => this.storeEntropy())
			.catch(e => {
				this.reset()
				throw e
			})
	}


	_loadUserPassphraseKey(mailAddress: string, passphrase: string): Promise<Aes128Key> {
		mailAddress = mailAddress.toLowerCase().trim()
		let saltRequest = createSaltData()
		saltRequest.mailAddress = mailAddress
		return serviceRequest(SysService.SaltService, HttpMethod.GET, saltRequest, SaltReturnTypeRef).then((saltReturn: SaltReturn) => {
			return generateKeyFromPassphrase(passphrase, saltReturn.salt, KeyLength.b128)
		})
	}

	_getInfoMails() {
		if (!this.isExternalUserLoggedIn()) {
			let receiveInfoData = createReceiveInfoServiceData()
			return serviceRequestVoid("receiveinfoservice", HttpMethod.POST, receiveInfoData)
		}
	}


	/**
	 * We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	 */
	deleteSession(accessToken: Base64Url): Promise<void> {
		let path = typeRefToPath(SessionTypeRef) + '/' + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)
		let headers = {
			'accessToken': neverNull(accessToken),
			"v": SessionModelType.version
		}
		return restClient.request(path, HttpMethod.DELETE, {}, headers, null, MediaType.Json)
			.catch(NotAuthenticatedError, () => {
				console.log("authentication failed => session is already closed")
			}).catch(NotFoundError, () => {
				console.log("authentication failed => session instance is already deleted")
			})
	}

	_getSessionElementId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Url(uint8ArrayToBase64(hash(byteAccessToken.slice(GENERATED_ID_BYTES_LENGTH))))
	}

	_getSessionListId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Ext(uint8ArrayToBase64(byteAccessToken.slice(0, GENERATED_ID_BYTES_LENGTH)))
	}


	_loadSessionData(accessToken: Base64Url): Promise<{userId:Id, accessKey:Aes128Key}> {
		let path = typeRefToPath(SessionTypeRef) + '/' + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)
		let headers = {
			'accessToken': accessToken,
			"v": SessionModelType.version
		}
		return restClient.request(path, HttpMethod.GET, {}, headers, null, MediaType.Json).then(instance => {
			let session = JSON.parse(instance)
			return {userId: session.user, accessKey: base64ToKey(session.accessKey)}
		})
	}

	/**
	 * @return The map which contains authentication data for the logged in user.
	 */
	createAuthHeaders(): Params {
		return this._accessToken ? {
				'accessToken': this._accessToken
			} : {}
	}

	getUserGroupId(): Id {
		return this.getLoggedInUser().userGroup.group
	}

	getAllGroupIds(): Id[] {
		let groups = this.getLoggedInUser().memberships.map(membership => membership.group)
		groups.push(this.getLoggedInUser().userGroup.group)
		return groups
	}

	getUserGroupKey(): Aes128Key {
		return this.groupKeys[this.getUserGroupId()] // the userGroupKey is always written after the login to this.groupKeys
	}

	getGroupKey(groupId: Id): Aes128Key {
		if (!this.groupKeys[groupId]) {
			this.groupKeys[groupId] = decryptKey(this.groupKeys[this.getUserGroupId()], this.getMembership(groupId).symEncGKey)
		}
		return this.groupKeys[groupId]
	}

	getMembership(groupId: Id): GroupMembership {
		let membership = this.getLoggedInUser().memberships.find((g: GroupMembership) => g.group === groupId)
		if (!membership) {
			throw new Error(`No group with groupId ${groupId} found!`)
		}
		return membership
	}

	hasGroup(groupId: Id): boolean {
		if (!this._user) {
			return false
		} else {
			return groupId === this._user.userGroup.group || this._user.memberships.find(m => m.group === groupId) != null
		}
	}

	getGroupId(groupType: GroupTypeEnum): Id {
		if (groupType == GroupType.User) {
			return this.getUserGroupId()
		} else {
			let membership = this.getLoggedInUser().memberships.find(m => m.groupType === groupType)
			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + this.getLoggedInUser()._id)
			}
			return membership.group
		}
	}

	getGroupIds(groupType: GroupTypeEnum): Id[] {
		return this.getLoggedInUser().memberships.filter(m => m.groupType === groupType).map(gm => gm.group)
	}

	isExternalUserLoggedIn() {
		return this._user && this._user.accountType == AccountType.EXTERNAL
	}

	isLoggedIn() {
		return this._user != null
	}

	getLoggedInUser(): User {
		return neverNull(this._user)
	}

	/**
	 * Loads entropy from the last logout.
	 */
	loadEntropy(): Promise<void> {
		return loadRoot(TutanotaPropertiesTypeRef, this.getUserGroupId()).then(tutanotaProperties => {
			if (tutanotaProperties.groupEncEntropy) {
				try {
					let entropy = aes128Decrypt(this.getUserGroupKey(), neverNull(tutanotaProperties.groupEncEntropy))
					random.addStaticEntropy(entropy)
				} catch (error) {
					if (error instanceof CryptoError) {
						console.log("could not decrypt entropy", error)
					}
				}
			}
		})
	}

	storeEntropy(): Promise<void> {
		if (!this._accessToken) return Promise.resolve()
		console.log("updating stored entropy")
		return loadRoot(TutanotaPropertiesTypeRef, this.getUserGroupId()).then(tutanotaProperties => {
			tutanotaProperties.groupEncEntropy = encryptBytes(this.getUserGroupKey(), random.generateRandomData(32))
			return update(tutanotaProperties)
		})
	}

	entityEventReceived(data: EntityUpdate): Promise<void> {
		if (this._user && data.operation == OperationType.UPDATE && isSameTypeRef(new TypeRef(data.application, data.type), UserTypeRef) && isSameId(this._user._id, data.instanceId)) {
			return load(UserTypeRef, this._user._id).then(updatedUser => {
				this._user = updatedUser
			})
		} else if (this._userGroupInfo && data.operation == OperationType.UPDATE && isSameTypeRef(new TypeRef(data.application, data.type), GroupInfoTypeRef) && isSameId(this._userGroupInfo._id, [neverNull(data.instanceListId), data.instanceId])) {
			return load(GroupInfoTypeRef, this._userGroupInfo._id).then(updatedUserGroupInfo => {
				this._userGroupInfo = updatedUserGroupInfo
			})
		} else {
			return Promise.resolve()
		}
	}

	changePassword(oldPassword: string, newPassword: string): Promise<void> {
		let oldAuthVerifier = createAuthVerifier(generateKeyFromPassphrase(oldPassword, neverNull(neverNull(this._user).salt), KeyLength.b128))

		let salt = generateRandomSalt();
		let userPassphraseKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
		let pwEncUserGroupKey = encryptKey(userPassphraseKey, this.getUserGroupKey())
		let authVerifier = createAuthVerifier(userPassphraseKey)
		let authVerifierBase64Url = base64ToBase64Url(uint8ArrayToBase64(authVerifier))

		let service = createChangePasswordData()
		service.oldVerifier = oldAuthVerifier
		service.salt = salt
		service.verifier = authVerifier
		service.pwEncUserGroupKey = pwEncUserGroupKey
		this._authVerifierAfterNextRequest = authVerifierBase64Url
		return serviceRequestVoid(SysService.ChangePasswordService, HttpMethod.POST, service)
	}

	tryReconnectEventBus(): Promise<void> {
		this._eventBusClient.tryReconnect(true);
		return Promise.resolve()
	}
}



