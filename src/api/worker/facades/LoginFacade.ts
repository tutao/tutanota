import {SysService} from "../../entities/sys/Services"
import type {Base64Url, Hex} from "@tutao/tutanota-utils"
import {
	assertNotNull,
	Base64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	defer,
	delay,
	hexToUint8Array,
	isSameTypeRefByAttr,
	lazy,
	neverNull,
	noOp,
	ofClass,
	promiseMap,
	uint8ArrayToBase64,
	uint8ArrayToHex,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import {CloseEventBusOption, GroupType, OperationType} from "../../common/TutanotaConstants"
import {CryptoError} from "../../common/error/CryptoError"
import {createSaltData} from "../../entities/sys/SaltData"
import type {SaltReturn} from "../../entities/sys/SaltReturn"
import {SaltReturnTypeRef} from "../../entities/sys/SaltReturn"
import type {GroupInfo} from "../../entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../../entities/sys/GroupInfo"
import {TutanotaPropertiesTypeRef} from "../../entities/tutanota/TutanotaProperties"
import type {User} from "../../entities/sys/User"
import {UserTypeRef} from "../../entities/sys/User"
import {HttpMethod, MediaType} from "../../common/EntityFunctions"
import {assertWorkerOrNode, isAdminClient, isTest} from "../../common/Env"
import {createChangePasswordData} from "../../entities/sys/ChangePasswordData"
import {ConnectMode, EventBusClient} from "../EventBusClient"
import {createCreateSessionData} from "../../entities/sys/CreateSessionData"
import type {CreateSessionReturn} from "../../entities/sys/CreateSessionReturn"
import {CreateSessionReturnTypeRef} from "../../entities/sys/CreateSessionReturn"
import {_TypeModel as SessionModelType, SessionTypeRef} from "../../entities/sys/Session"
import {EntityRestClient, typeRefToPath} from "../rest/EntityRestClient"
import {createSecondFactorAuthGetData} from "../../entities/sys/SecondFactorAuthGetData"
import {SecondFactorAuthGetReturnTypeRef} from "../../entities/sys/SecondFactorAuthGetReturn"
import {ConnectionError, LockedError, NotAuthenticatedError, NotFoundError, ServiceUnavailableError} from "../../common/error/RestError"
import type {WorkerImpl} from "../WorkerImpl"
import type {Indexer} from "../search/Indexer"
import {createDeleteCustomerData} from "../../entities/sys/DeleteCustomerData"
import {createAutoLoginDataGet} from "../../entities/sys/AutoLoginDataGet"
import {AutoLoginDataReturnTypeRef} from "../../entities/sys/AutoLoginDataReturn"
import {CancelledError} from "../../common/error/CancelledError"
import {TutanotaService} from "../../entities/tutanota/Services"
import {createRecoverCode, RecoverCodeTypeRef} from "../../entities/sys/RecoverCode"
import {createResetFactorsDeleteData} from "../../entities/sys/ResetFactorsDeleteData"
import type {GroupMembership} from "../../entities/sys/GroupMembership"
import type {EntityUpdate} from "../../entities/sys/EntityUpdate"
import {RestClient} from "../rest/RestClient"
import {EntityClient} from "../../common/EntityClient"
import {createTakeOverDeletedAddressData} from "../../entities/sys/TakeOverDeletedAddressData"
import type {WebsocketLeaderStatus} from "../../entities/sys/WebsocketLeaderStatus"
import {createWebsocketLeaderStatus} from "../../entities/sys/WebsocketLeaderStatus"
import {createEntropyData} from "../../entities/tutanota/EntropyData"
import {GENERATED_ID_BYTES_LENGTH, isSameId} from "../../common/utils/EntityUtils"
import type {Credentials} from "../../../misc/credentials/Credentials"
import {
	aes128Decrypt,
	aes128RandomKey,
	aes256DecryptKey,
	aes256EncryptKey,
	aes256RandomKey,
	base64ToKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	createAuthVerifierAsBase64Url,
	decrypt256Key,
	decryptKey,
	encrypt256Key,
	encryptKey,
	generateKeyFromPassphrase,
	generateRandomSalt,
	KeyLength,
	keyToUint8Array,
	random,
	sha256Hash,
	TotpSecret,
	TotpVerifier,
	uint8ArrayToBitArray,
	uint8ArrayToKey,
} from "@tutao/tutanota-crypto"
import {CryptoFacade, encryptBytes, encryptString} from "../crypto/CryptoFacade"
import {InstanceMapper} from "../crypto/InstanceMapper"
import type {SecondFactorAuthHandler} from "../../../misc/2fa/SecondFactorHandler"
import {createSecondFactorAuthDeleteData} from "../../entities/sys/SecondFactorAuthDeleteData"
import type {SecondFactorAuthData} from "../../entities/sys/SecondFactorAuthData"
import {Aes128Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {SessionType} from "../../common/SessionType"
import {LateInitializedCacheStorage} from "../rest/CacheStorageProxy"
import {ServiceRestInterface} from "../rest/ServiceRestInterface"

assertWorkerOrNode()
const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000
export type NewSessionData = {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
	credentials: Credentials
}

export interface LoginFacade {
	/**
	 * Create session and log in. Changes internal state to refer to the logged in user.
	 */
	createSession(
		mailAddress: string,
		passphrase: string,
		clientIdentifier: string,
		sessionType: SessionType,
		databaseKey: Uint8Array | null,
	): Promise<NewSessionData>

	/**
	 * Create external (temporary mailbox for password-protected emails) session and log in.
	 * Changes internal state to refer to the logged in user.
	 */
	createExternalSession(
		userId: Id,
		passphrase: string,
		salt: Uint8Array,
		clientIdentifier: string,
		persistentSession: boolean
	): Promise<NewSessionData>

	/** Resumes previously created session (using persisted credentials). */
	resumeSession(
		credentials: Credentials,
		externalUserSalt: Uint8Array | null,
		databaseKey: Uint8Array | null
	): Promise<{
		user: User
		userGroupInfo: GroupInfo
		sessionId: IdTuple
	}>

	deleteSession(accessToken: Base64Url): Promise<void>

	changePassword(oldPassword: string, newPassword: string): Promise<void>

	generateTotpSecret(): Promise<TotpSecret>

	generateTotpCode(time: number, key: Uint8Array): Promise<number>

	getRecoverCode(password: string): Promise<string>

	createRecoveryCode(password: string): Promise<string>

	deleteAccount(password: string, reason: string, takeover: string): Promise<void>

	/** Cancels 2FA process. */
	cancelCreateSession(sessionId: IdTuple): Promise<void>

	/** Finishes 2FA process either using second factor or approving session on another client. */
	authenticateWithSecondFactor(data: SecondFactorAuthData): Promise<void>

	resetSession(): Promise<void>

	takeOverDeletedAddress(mailAddress: string, password: string, recoverCode: Hex | null, targetAccountMailAddress: string): Promise<void>

	/** Changes user password to another one using recoverCode instead of the old password. */
	recoverLogin(mailAddress: string, recoverCode: string, newPassword: string, clientIdentifier: string): Promise<void>

	/** Deletes second factors using recoverCode as second factor. */
	resetSecondFactors(mailAddress: string, password: string, recoverCode: Hex): Promise<void>

	decryptUserPassword(userId: string, deviceToken: string, encryptedPassword: string): Promise<string>

}

export class LoginFacadeImpl implements LoginFacade {
	_user: User | null = null
	private _userGroupInfo: GroupInfo | null = null
	private _accessToken: string | null = null
	private groupKeys!: Record<Id, Aes128Key>
	private _eventBusClient!: EventBusClient
	private _indexer!: Indexer
	/**
	 * Used for cancelling second factor and to not mix different attempts
	 */
	private _loginRequestSessionId: IdTuple | null = null

	/**
	 * Used for cancelling second factor immediately
	 */
	private _loggingInPromiseWrapper:
		| {promise: Promise<void>, reject: (arg0: Error) => void}
		| null
		| undefined

	// needed here for entropy updates, init as non-leader
	private _leaderStatus!: WebsocketLeaderStatus

	constructor(
		readonly worker: WorkerImpl,
		private readonly service: ServiceRestInterface,
		private readonly restClient: RestClient,
		private readonly entityClient: EntityClient,
		private readonly secondFactorAuthHandler: SecondFactorAuthHandler,
		private readonly instanceMapper: InstanceMapper,
		private readonly cryptoFacade: lazy<CryptoFacade>,
		/**
		 *  Only needed so that we can initialize the offline storage after login.
		 *  This is necessary because we don't know if we'll be persistent or not until the user tries to login
		 *  Once the credentials handling has been changed to *always* save in desktop, then this should become obsolete
		 */
		private readonly initializeCacheStorage: LateInitializedCacheStorage["initialize"]
	) {
		this.initializeMembers()
	}


	private initializeMembers() {
		this._user = null
		this._userGroupInfo = null
		this._accessToken = null
		this.groupKeys = {}
		this._leaderStatus = createWebsocketLeaderStatus({
			leaderStatus: false,
		})
	}

	init(indexer: Indexer, eventBusClient: EventBusClient) {
		this._indexer = indexer
		this._eventBusClient = eventBusClient
	}


	async resetSession(): Promise<void> {

		this.initializeMembers()

		if (this._eventBusClient) {
			this._eventBusClient.close(CloseEventBusOption.Terminate)
		}
	}

	/** @inheritDoc */
	createSession(
		mailAddress: string,
		passphrase: string,
		clientIdentifier: string,
		sessionType: SessionType,
		databaseKey: Uint8Array | null,
	): Promise<NewSessionData> {
		if (this._user) {
			console.log("session already exists, reuse data") // do not reset here because the event bus client needs to be kept if the same user is logged in as before
			// check if it is the same user in _initSession()
		}

		return this._loadUserPassphraseKey(mailAddress, passphrase).then(userPassphraseKey => {
			// the verifier is always sent as url parameter, so it must be url encoded
			let authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
			let sessionData = createCreateSessionData()
			sessionData.mailAddress = mailAddress.toLowerCase().trim()
			sessionData.clientIdentifier = clientIdentifier
			sessionData.authVerifier = authVerifier
			let accessKey: Aes128Key | null = null

			if (sessionType === SessionType.Persistent) {
				accessKey = aes128RandomKey()
				sessionData.accessKey = keyToUint8Array(accessKey)
			}

			return this.service.serviceRequest(SysService.SessionService, HttpMethod.POST, sessionData, CreateSessionReturnTypeRef)
					   .then(createSessionReturn => this._waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, mailAddress))
					   .then(sessionData => {
						   return this.initSession(sessionData.userId, sessionData.accessToken, userPassphraseKey, sessionType, databaseKey).then(() => {
							   return {
								   user: neverNull(this._user),
								   userGroupInfo: neverNull(this._userGroupInfo),
								   sessionId: sessionData.sessionId,
								   credentials: {
									   login: mailAddress,
									   accessToken: neverNull(this._accessToken),
									   encryptedPassword: sessionType === SessionType.Persistent ? uint8ArrayToBase64(encryptString(neverNull(accessKey), passphrase)) : null,
									   userId: sessionData.userId,
									   type: "internal",
								   },
							   }
						   })
					   })
		})
	}

	/**
	 * If the second factor login has been cancelled a CancelledError is thrown.
	 */
	_waitUntilSecondFactorApprovedOrCancelled(
		createSessionReturn: CreateSessionReturn,
		mailAddress: string | null,
	): Promise<{
		sessionId: IdTuple
		userId: Id
		accessToken: Base64Url
	}> {
		let p = Promise.resolve()
		let sessionId = [this._getSessionListId(createSessionReturn.accessToken), this._getSessionElementId(createSessionReturn.accessToken)] as const
		this._loginRequestSessionId = sessionId

		if (createSessionReturn.challenges.length > 0) {
			// Show a message to the user and give them a chance to complete the challenges.
			this.secondFactorAuthHandler.showSecondFactorAuthenticationDialog(sessionId, createSessionReturn.challenges, mailAddress)

			p = this._waitUntilSecondFactorApproved(createSessionReturn.accessToken, sessionId, 0)
		}

		this._loggingInPromiseWrapper = defer()
		// Wait for either login or cancel
		return Promise.race([this._loggingInPromiseWrapper.promise, p]).then(() => ({
			sessionId,
			accessToken: createSessionReturn.accessToken,
			userId: createSessionReturn.user,
		}))
	}

	_waitUntilSecondFactorApproved(accessToken: Base64Url, sessionId: IdTuple, retryOnNetworkError: number): Promise<void> {
		let secondFactorAuthGetData = createSecondFactorAuthGetData()
		secondFactorAuthGetData.accessToken = accessToken
		return this.service.serviceRequest(SysService.SecondFactorAuthService, HttpMethod.GET, secondFactorAuthGetData, SecondFactorAuthGetReturnTypeRef)
				   .then(secondFactorAuthGetReturn => {
					   if (!this._loginRequestSessionId || !isSameId(this._loginRequestSessionId, sessionId)) {
						   return Promise.reject(new CancelledError("login cancelled"))
					   }

					   if (secondFactorAuthGetReturn.secondFactorPending) {
						   return this._waitUntilSecondFactorApproved(accessToken, sessionId, 0)
					   }
				   })
				   .catch(
					   ofClass(ConnectionError, e => {
						   // connection error can occur on ios when switching between apps, just retry in this case.
						   if (retryOnNetworkError < 10) {
							   return this._waitUntilSecondFactorApproved(accessToken, sessionId, retryOnNetworkError + 1)
						   } else {
							   throw e
						   }
					   }),
				   )
	}

	/** @inheritDoc */
	async createExternalSession(userId: Id, passphrase: string, salt: Uint8Array, clientIdentifier: string, persistentSession: boolean): Promise<NewSessionData> {
		if (this._user) {
			throw new Error("user already logged in")
		}

		console.log("login external worker")
		let userPassphraseKey = generateKeyFromPassphrase(passphrase, salt, KeyLength.b128)
		// the verifier is always sent as url parameter, so it must be url encoded
		let authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
		let authToken = base64ToBase64Url(uint8ArrayToBase64(sha256Hash(salt)))
		let sessionData = createCreateSessionData()
		sessionData.user = userId
		sessionData.authToken = authToken
		sessionData.clientIdentifier = clientIdentifier
		sessionData.authVerifier = authVerifier
		let accessKey: Aes128Key | null = null

		if (persistentSession) {
			accessKey = aes128RandomKey()
			sessionData.accessKey = keyToUint8Array(accessKey)
		}

		const createSessionReturn = await this.service.serviceRequest(SysService.SessionService, HttpMethod.POST, sessionData, CreateSessionReturnTypeRef)


		let sessionId = [this._getSessionListId(createSessionReturn.accessToken), this._getSessionElementId(createSessionReturn.accessToken)] as const
		await this.initSession(createSessionReturn.user, createSessionReturn.accessToken, userPassphraseKey, SessionType.Login, null)
		const userGroupInfo = neverNull(this._userGroupInfo)
		return {
			user: assertNotNull<User>(this._user),
			userGroupInfo,
			sessionId,
			credentials: {
				login: userId,
				accessToken: neverNull(this._accessToken),
				encryptedPassword: accessKey ? uint8ArrayToBase64(encryptString(accessKey, passphrase)) : null,
				userId,
				type: "external",
			},
		}
	}

	/** @inheritDoc */
	async cancelCreateSession(sessionId: IdTuple): Promise<void> {
		if (!this._loginRequestSessionId || !isSameId(this._loginRequestSessionId, sessionId)) {
			throw new Error("Trying to cancel session creation but the state is invalid")
		}

		const secondFactorAuthDeleteData = createSecondFactorAuthDeleteData({
			session: sessionId,
		})
		await this.service.serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.DELETE, secondFactorAuthDeleteData)
				  .catch(ofClass(NotFoundError, (e) => {
					  // This can happen during some odd behavior in browser where main loop would be blocked by webauthn (hello, FF) and then we would try to
					  // cancel too late. No harm here anyway if the session is already gone.
					  console.warn("Tried to cancel second factor but it was not there anymore", e)
				  }))
		this._loginRequestSessionId = null
		this._loggingInPromiseWrapper && this._loggingInPromiseWrapper.reject(new CancelledError("login cancelled"))
	}

	/** @inheritDoc */
	async authenticateWithSecondFactor(data: SecondFactorAuthData): Promise<void> {
		await this.service.serviceRequestVoid(SysService.SecondFactorAuthService, HttpMethod.POST, data)
	}

	/**
	 * Resume a session of stored credentials.
	 */
	resumeSession(
		credentials: Credentials,
		externalUserSalt: Uint8Array | null,
		databaseKey: Uint8Array | null
	): Promise<{
		user: User
		userGroupInfo: GroupInfo
		sessionId: IdTuple
	}> {
		return this._loadSessionData(credentials.accessToken).then(sessionData => {
			let passphrase = utf8Uint8ArrayToString(aes128Decrypt(sessionData.accessKey, base64ToUint8Array(neverNull(credentials.encryptedPassword))))
			let passphraseKeyPromise: Promise<Aes128Key>

			if (externalUserSalt) {
				passphraseKeyPromise = Promise.resolve(generateKeyFromPassphrase(passphrase, externalUserSalt, KeyLength.b128))
			} else {
				passphraseKeyPromise = this._loadUserPassphraseKey(credentials.login, passphrase)
			}

			return passphraseKeyPromise.then(userPassphraseKey => {
				return this.initSession(sessionData.userId, credentials.accessToken, userPassphraseKey, SessionType.Persistent, databaseKey).then(() => {
					return {
						user: neverNull(this._user),
						userGroupInfo: neverNull(this._userGroupInfo),
						sessionId: [this._getSessionListId(credentials.accessToken), this._getSessionElementId(credentials.accessToken)],
					}
				})
			})
		})
	}

	private async initSession(
		userId: Id,
		accessToken: Base64Url,
		userPassphraseKey: Aes128Key,
		sessionType: SessionType,
		databaseKey: Uint8Array | null
	): Promise<void> {
		let userIdFromFormerLogin = this._user ? this._user._id : null

		if (userIdFromFormerLogin && userId !== userIdFromFormerLogin) {
			throw new Error("different user is tried to login in existing other user's session")
		}

		this._accessToken = accessToken

		const usingOfflineStorage = databaseKey != null

		try {
			if (usingOfflineStorage) {
				await this.initializeCacheStorage({
					persistent: true,
					userId,
					databaseKey
				})
			} else {
				await this.initializeCacheStorage({persistent: false})
			}

			const user = await this.entityClient.load(UserTypeRef, userId)
			// we check that the password is not changed
			// this may happen when trying to resume a session with an old stored password for externals when the password was changed by the sender
			// we do not delete all sessions on the server when changing the external password to avoid that an external user is immediately logged out
			if (uint8ArrayToBase64(user.verifier) !== uint8ArrayToBase64(sha256Hash(createAuthVerifier(userPassphraseKey)))) {
				// delete the obsolete session in parallel to make sure it can not be used any more
				this.deleteSession(accessToken)
				this._accessToken = null
				console.log("password has changed")
				throw new NotAuthenticatedError("password has changed")
			}

			this._user = user
			this.groupKeys[this.getUserGroupId()] = decryptKey(userPassphraseKey, this._user.userGroup.symEncGKey)
			this._userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)

			if (!isTest() && sessionType !== SessionType.Temporary && !isAdminClient()) {
				// index new items in background
				console.log("_initIndexer after log in")

				this._initIndexer(usingOfflineStorage)
			}

			await this.loadEntropy()

			// userIdFromFormerLogin is set if session had expired an the user has entered the correct password.
			// close the event bus and reconnect to make sure we get all missed events
			if (userIdFromFormerLogin) {
				this._eventBusClient.tryReconnect(true, true)
			} else {
				this._eventBusClient.connect(ConnectMode.Initial)
			}

			await this.storeEntropy()
		} catch (e) {
			this.resetSession()
			throw e
		}
	}

	_initIndexer(isUsingOfflineCache: boolean): Promise<void> {
		return this._indexer
				   .init({
						   user: assertNotNull(this._user),
						   userGroupKey: this.getUserGroupKey(),
						   isUsingOfflineCache
					   }
				   )
				   .catch(
					   ofClass(ServiceUnavailableError, e => {
						   console.log("Retry init indexer in 30 seconds after ServiceUnavailableError")
						   return delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
							   console.log("_initIndexer after ServiceUnavailableError")
							   return this._initIndexer(isUsingOfflineCache)
						   })
					   }),
				   )
				   .catch(
					   ofClass(ConnectionError, e => {
						   console.log("Retry init indexer in 30 seconds after ConnectionError")
						   return delay(RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS).then(() => {
							   console.log("_initIndexer after ConnectionError")
							   return this._initIndexer(isUsingOfflineCache)
						   })
					   }),
				   )
				   .catch(e => {
					   this.worker.sendError(e)
				   })
	}

	_loadUserPassphraseKey(mailAddress: string, passphrase: string): Promise<Aes128Key> {
		mailAddress = mailAddress.toLowerCase().trim()
		let saltRequest = createSaltData()
		saltRequest.mailAddress = mailAddress
		return this.service.serviceRequest(SysService.SaltService, HttpMethod.GET, saltRequest, SaltReturnTypeRef).then((saltReturn: SaltReturn) => {
			return generateKeyFromPassphrase(passphrase, saltReturn.salt, KeyLength.b128)
		})
	}

	/**
	 * We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	 */
	deleteSession(accessToken: Base64Url): Promise<void> {
		let path = typeRefToPath(SessionTypeRef) + "/" + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)

		let headers = {
			accessToken: neverNull(accessToken),
			v: SessionModelType.version,
		}
		return this.restClient
				   .request(path, HttpMethod.DELETE, {
					   headers,
					   responseType: MediaType.Json,
				   })
				   .catch(
					   ofClass(NotAuthenticatedError, () => {
						   console.log("authentication failed => session is already closed")
					   }),
				   )
				   .catch(
					   ofClass(NotFoundError, () => {
						   console.log("authentication failed => session instance is already deleted")
					   }),
				   )
	}

	_getSessionElementId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Url(uint8ArrayToBase64(sha256Hash(byteAccessToken.slice(GENERATED_ID_BYTES_LENGTH))))
	}

	_getSessionListId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Ext(uint8ArrayToBase64(byteAccessToken.slice(0, GENERATED_ID_BYTES_LENGTH)))
	}

	_loadSessionData(
		accessToken: Base64Url,
	): Promise<{
		userId: Id
		accessKey: Aes128Key
	}> {
		let path = typeRefToPath(SessionTypeRef) + "/" + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)

		let headers = {
			accessToken: accessToken,
			v: SessionModelType.version,
		}
		return this.restClient.request(path, HttpMethod.GET, {
			headers,
			responseType: MediaType.Json,
		}).then(instance => {
			let session = JSON.parse(instance)
			return {
				userId: session.user,
				accessKey: base64ToKey(session.accessKey),
			}
		})
	}

	/**
	 * @return The map which contains authentication data for the logged in user.
	 */
	createAuthHeaders(): Dict {
		return this._accessToken
			? {
				accessToken: this._accessToken,
			}
			: {}
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

	getGroupId(groupType: GroupType): Id {
		if (groupType === GroupType.User) {
			return this.getUserGroupId()
		} else {
			let membership = this.getLoggedInUser().memberships.find(m => m.groupType === groupType)

			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + this.getLoggedInUser()._id)
			}

			return membership.group
		}
	}

	getGroupIds(groupType: GroupType): Id[] {
		return this.getLoggedInUser()
				   .memberships.filter(m => m.groupType === groupType)
				   .map(gm => gm.group)
	}

	isLoggedIn(): boolean {
		return this._user != null
	}

	getLoggedInUser(): User {
		return neverNull(this._user)
	}

	/**
	 * Loads entropy from the last logout.
	 */
	loadEntropy(): Promise<void> {
		return this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.getUserGroupId()).then(tutanotaProperties => {
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
		// We only store entropy to the server if we are the leader
		if (!this._accessToken || !this.isLeader()) return Promise.resolve()
		const userGroupKey = this.getUserGroupKey()
		const entropyData = createEntropyData({
			groupEncEntropy: encryptBytes(userGroupKey, random.generateRandomData(32)),
		})
		return this.service.serviceRequestVoid(TutanotaService.EntropyService, HttpMethod.PUT, entropyData)
				   .catch(ofClass(LockedError, noOp))
				   .catch(
					   ofClass(ConnectionError, e => {
						   console.log("could not store entropy", e)
					   }),
				   )
				   .catch(
					   ofClass(ServiceUnavailableError, e => {
						   console.log("could not store entropy", e)
					   }),
				   )
	}

	entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		return promiseMap(data, update => {
			if (
				this._user &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(UserTypeRef, update.application, update.type) &&
				isSameId(this._user._id, update.instanceId)
			) {
				return this.entityClient.load(UserTypeRef, this._user._id).then(updatedUser => {
					this._user = updatedUser
				})
			} else if (
				this._userGroupInfo &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(GroupInfoTypeRef, update.application, update.type) &&
				isSameId(this._userGroupInfo._id, [neverNull(update.instanceListId), update.instanceId])
			) {
				return this.entityClient.load(GroupInfoTypeRef, this._userGroupInfo._id).then(updatedUserGroupInfo => {
					this._userGroupInfo = updatedUserGroupInfo
				})
			} else {
				return Promise.resolve()
			}
		}).then(noOp)
	}

	changePassword(oldPassword: string, newPassword: string): Promise<void> {
		let oldAuthVerifier = createAuthVerifier(generateKeyFromPassphrase(oldPassword, neverNull(neverNull(this._user).salt), KeyLength.b128))
		let salt = generateRandomSalt()
		let userPassphraseKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
		let pwEncUserGroupKey = encryptKey(userPassphraseKey, this.getUserGroupKey())
		let authVerifier = createAuthVerifier(userPassphraseKey)
		let service = createChangePasswordData()
		service.oldVerifier = oldAuthVerifier
		service.salt = salt
		service.verifier = authVerifier
		service.pwEncUserGroupKey = pwEncUserGroupKey
		return this.service.serviceRequestVoid(SysService.ChangePasswordService, HttpMethod.POST, service)
	}

	deleteAccount(password: string, reason: string, takeover: string): Promise<void> {
		let d = createDeleteCustomerData()
		d.authVerifier = createAuthVerifier(generateKeyFromPassphrase(password, neverNull(neverNull(this._user).salt), KeyLength.b128))
		d.undelete = false
		d.customer = neverNull(neverNull(this._user).customer)
		d.reason = reason

		if (takeover !== "") {
			d.takeoverMailAddress = takeover
		} else {
			d.takeoverMailAddress = null
		}

		return this.service.serviceRequestVoid(SysService.CustomerService, HttpMethod.DELETE, d)
	}

	decryptUserPassword(userId: string, deviceToken: string, encryptedPassword: string): Promise<string> {
		const getData = createAutoLoginDataGet()
		getData.userId = userId
		getData.deviceToken = deviceToken
		return this.service.serviceRequest(SysService.AutoLoginService, HttpMethod.GET, getData, AutoLoginDataReturnTypeRef, undefined).then(returnData => {
			const key = uint8ArrayToKey(returnData.deviceKey)
			return utf8Uint8ArrayToString(aes128Decrypt(key, base64ToUint8Array(encryptedPassword)))
		})
	}

	getRecoverCode(password: string): Promise<string> {
		if (this._user == null || this._user.auth == null || this._user.auth.recoverCode == null) {
			return Promise.reject(new Error("Auth is missing"))
		}

		const recoverCodeId = this._user.auth.recoverCode
		const key = generateKeyFromPassphrase(password, neverNull(this._user.salt), KeyLength.b128)
		const extraHeaders = {
			authVerifier: createAuthVerifierAsBase64Url(key),
		}
		return this.entityClient.load(RecoverCodeTypeRef, recoverCodeId, undefined, extraHeaders).then(result => {
			return uint8ArrayToHex(bitArrayToUint8Array(decrypt256Key(this.getUserGroupKey(), result.userEncRecoverCode)))
		})
	}

	createRecoveryCode(password: string): Promise<string> {
		const user = this._user

		if (user == null || user.auth == null) {
			throw new Error("Invalid state: no user or no user.auth")
		}

		const {
			userEncRecoverCode,
			recoverCodeEncUserGroupKey,
			hexCode,
			recoveryCodeVerifier
		} = this.generateRecoveryCode(this.getUserGroupKey())
		const recoverPasswordEntity = createRecoverCode()
		recoverPasswordEntity.userEncRecoverCode = userEncRecoverCode
		recoverPasswordEntity.recoverCodeEncUserGroupKey = recoverCodeEncUserGroupKey
		recoverPasswordEntity._ownerGroup = this.getUserGroupId()
		recoverPasswordEntity.verifier = recoveryCodeVerifier
		const pwKey = generateKeyFromPassphrase(password, neverNull(user.salt), KeyLength.b128)
		const authVerifier = createAuthVerifierAsBase64Url(pwKey)
		return this.entityClient
				   .setup(null, recoverPasswordEntity, {
					   authVerifier,
				   })
				   .then(() => hexCode)
	}

	generateRecoveryCode(userGroupKey: Aes128Key): RecoverData {
		const recoveryCode = aes256RandomKey()
		const userEncRecoverCode = encrypt256Key(userGroupKey, recoveryCode)
		const recoverCodeEncUserGroupKey = aes256EncryptKey(recoveryCode, userGroupKey)
		const recoveryCodeVerifier = createAuthVerifier(recoveryCode)
		return {
			userEncRecoverCode,
			recoverCodeEncUserGroupKey,
			hexCode: uint8ArrayToHex(bitArrayToUint8Array(recoveryCode)),
			recoveryCodeVerifier,
		}
	}

	/** @inheritDoc */
	recoverLogin(mailAddress: string, recoverCode: string, newPassword: string, clientIdentifier: string): Promise<void> {
		const sessionData = createCreateSessionData()
		const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
		const recoverCodeVerifier = createAuthVerifier(recoverCodeKey)
		const recoverCodeVerifierBase64 = base64ToBase64Url(uint8ArrayToBase64(recoverCodeVerifier))
		sessionData.mailAddress = mailAddress.toLowerCase().trim()
		sessionData.clientIdentifier = clientIdentifier
		sessionData.recoverCodeVerifier = recoverCodeVerifierBase64
		// we need a separate entity rest client because to avoid caching of the user instance which is updated on password change. the web socket is not connected because we
		// don't do a normal login and therefore we would not get any user update events. we can not use permanentLogin=false with initSession because caching would be enabled
		// and therefore we would not be able to read the updated user
		// additionally we do not want to use initSession() to keep the LoginFacade stateless (except second factor handling) because we do not want to have any race conditions
		// when logging in normally after resetting the password
		const eventRestClient = new EntityRestClient(
			() => ({}),
			this.restClient,
			() => this.cryptoFacade(),
			this.instanceMapper,
		)
		const entityClient = new EntityClient(eventRestClient)
		return this.service.serviceRequest(SysService.SessionService, HttpMethod.POST, sessionData, CreateSessionReturnTypeRef) // Don't pass email address to avoid proposing to reset second factor when we're resetting password
				   .then(createSessionReturn => this._waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, null))
				   .then(sessionData => {
					   return entityClient
						   .load(UserTypeRef, sessionData.userId, undefined, {
							   accessToken: sessionData.accessToken,
						   })
						   .then(user => {
							   if (user.auth == null || user.auth.recoverCode == null) {
								   return Promise.reject(new Error("missing recover code"))
							   }

							   const extraHeaders = {
								   accessToken: sessionData.accessToken,
								   recoverCodeVerifier: recoverCodeVerifierBase64,
							   }
							   return entityClient.load(RecoverCodeTypeRef, user.auth.recoverCode, undefined, extraHeaders)
						   })
						   .then(recoverCode => {
							   const groupKey = aes256DecryptKey(recoverCodeKey, recoverCode.recoverCodeEncUserGroupKey)
							   let salt = generateRandomSalt()
							   let userPassphraseKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
							   let pwEncUserGroupKey = encryptKey(userPassphraseKey, groupKey)
							   let newPasswordVerifier = createAuthVerifier(userPassphraseKey)
							   const postData = createChangePasswordData()
							   postData.salt = salt
							   postData.pwEncUserGroupKey = pwEncUserGroupKey
							   postData.verifier = newPasswordVerifier
							   postData.recoverCodeVerifier = recoverCodeVerifier
							   const extraHeaders = {
								   accessToken: sessionData.accessToken,
							   }
							   return this.service.serviceRequestVoid(SysService.ChangePasswordService, HttpMethod.POST, postData, undefined, undefined, extraHeaders)
						   })
						   .finally(() => this.deleteSession(sessionData.accessToken))
				   })
	}

	/** @inheritDoc */
	resetSecondFactors(mailAddress: string, password: string, recoverCode: Hex): Promise<void> {
		return this._loadUserPassphraseKey(mailAddress, password).then(passphraseReturn => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn)
			const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
			const recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey)
			const deleteData = createResetFactorsDeleteData()
			deleteData.mailAddress = mailAddress
			deleteData.authVerifier = authVerifier
			deleteData.recoverCodeVerifier = recoverCodeVerifier
			return this.service.serviceRequestVoid(SysService.ResetFactorsService, HttpMethod.DELETE, deleteData)
		})
	}

	takeOverDeletedAddress(mailAddress: string, password: string, recoverCode: Hex | null, targetAccountMailAddress: string): Promise<void> {
		return this._loadUserPassphraseKey(mailAddress, password).then(passphraseReturn => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn)
			let recoverCodeVerifier: Base64 | null = null

			if (recoverCode) {
				const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
				recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey)
			}

			let data = createTakeOverDeletedAddressData()
			data.mailAddress = mailAddress
			data.authVerifier = authVerifier
			data.recoverCodeVerifier = recoverCodeVerifier
			data.targetAccountMailAddress = targetAccountMailAddress
			return this.service.serviceRequestVoid(SysService.TakeOverDeletedAddressService, HttpMethod.POST, data)
		})
	}

	getUserGroupInfo(): GroupInfo {
		return neverNull(this._userGroupInfo)
	}

	setLeaderStatus(status: WebsocketLeaderStatus): Promise<void> {
		this._leaderStatus = status
		console.log("New leader status set:", status.leaderStatus)
		return this.worker.updateLeaderStatus(status)
	}

	isLeader(): boolean {
		return this._leaderStatus.leaderStatus
	}

	generateTotpSecret(): Promise<TotpSecret> {
		return this.getTotpVerifier().then(totp => totp.generateSecret())
	}

	generateTotpCode(time: number, key: Uint8Array): Promise<number> {
		return this.getTotpVerifier().then(totp => totp.generateTotp(time, key))
	}

	getTotpVerifier(): Promise<TotpVerifier> {
		return Promise.resolve(new TotpVerifier())
	}
}

export type RecoverData = {
	userEncRecoverCode: Uint8Array
	recoverCodeEncUserGroupKey: Uint8Array
	hexCode: Hex
	recoveryCodeVerifier: Uint8Array
}