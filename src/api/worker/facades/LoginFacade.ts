import type {Base64Url, DeferredObject, Hex} from "@tutao/tutanota-utils"
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
	neverNull,
	noOp,
	ofClass,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import {
	AutoLoginService,
	ChangePasswordService,
	CustomerService,
	ResetFactorsService,
	SaltService,
	SecondFactorAuthService,
	SessionService,
	TakeOverDeletedAddressService
} from "../../entities/sys/Services"
import {AccountType, CloseEventBusOption, OperationType} from "../../common/TutanotaConstants"
import {CryptoError} from "../../common/error/CryptoError"
import {
	createAutoLoginDataGet,
	createChangePasswordData, createCreateSessionData, createDeleteCustomerData,
	createResetFactorsDeleteData,
	createSaltData, createSecondFactorAuthGetData, CreateSessionReturn,
	createTakeOverDeletedAddressData, EntityUpdate, RecoverCodeTypeRef,
	SessionTypeRef
} from "../../entities/sys/TypeRefs.js"
import type {SaltReturn} from "../../entities/sys/TypeRefs.js"
import type {GroupInfo} from "../../entities/sys/TypeRefs.js"
import {GroupInfoTypeRef} from "../../entities/sys/TypeRefs.js"
import {createEntropyData, TutanotaPropertiesTypeRef} from "../../entities/tutanota/TypeRefs.js"
import type {User} from "../../entities/sys/TypeRefs.js"
import {UserTypeRef} from "../../entities/sys/TypeRefs.js"
import {HttpMethod, MediaType, resolveTypeReference} from "../../common/EntityFunctions"
import {assertWorkerOrNode, isAdminClient, isTest} from "../../common/Env"
import {ConnectMode, EventBusClient} from "../EventBusClient"
import {EntityRestClient, typeRefToPath} from "../rest/EntityRestClient"
import {ConnectionError, LockedError, NotAuthenticatedError, NotFoundError, ServiceUnavailableError, SessionExpiredError} from "../../common/error/RestError"
import type {WorkerImpl} from "../WorkerImpl"
import type {Indexer} from "../search/Indexer"
import {CancelledError} from "../../common/error/CancelledError"
import {RestClient} from "../rest/RestClient"
import {EntityClient} from "../../common/EntityClient"
import {GENERATED_ID_BYTES_LENGTH, isSameId} from "../../common/utils/EntityUtils"
import type {Credentials} from "../../../misc/credentials/Credentials"
import {
	aes128Decrypt,
	aes128RandomKey,
	aes256DecryptKey,
	base64ToKey,
	createAuthVerifier,
	createAuthVerifierAsBase64Url,
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
import {createSecondFactorAuthDeleteData} from "../../entities/sys/TypeRefs.js"
import type {SecondFactorAuthData} from "../../entities/sys/TypeRefs.js"
import {Aes128Key} from "@tutao/tutanota-crypto/dist/encryption/Aes"
import {EntropyService} from "../../entities/tutanota/Services"
import {IServiceExecutor} from "../../common/ServiceRequest"
import {SessionType} from "../../common/SessionType"
import {LateInitializedCacheStorage} from "../rest/CacheStorageProxy"
import {AuthHeadersProvider, UserFacade} from "./UserFacade"
import {ILoginListener} from "../../main/LoginListener"

assertWorkerOrNode()
const RETRY_TIMOUT_AFTER_INIT_INDEXER_ERROR_MS = 30000
export type NewSessionData = {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
	credentials: Credentials
}

interface ResumeSessionResultData {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
}

export const enum ResumeSessionErrorReason {
	OfflineNotAvailableForFree
}

type ResumeSessionResult =
	| {type: "success", data: ResumeSessionResultData}
	| {type: "error", reason: ResumeSessionErrorReason}

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
		databaseKey: Uint8Array | null,
		offlineTimeRangeDays: number | null
	): Promise<ResumeSessionResult>

	deleteSession(accessToken: Base64Url): Promise<void>

	changePassword(oldPassword: string, newPassword: string): Promise<void>

	generateTotpSecret(): Promise<TotpSecret>

	generateTotpCode(time: number, key: Uint8Array): Promise<number>

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

	retryAsyncLogin(): Promise<void>
}

interface InitSessionParams {
	userId: Id;
	accessToken: Base64Url;
	userPassphraseKey: Aes128Key;
	sessionType: SessionType;
	databaseKey: Uint8Array | null;
	offlineTimeRangeDays: number | null;
}

export class LoginFacadeImpl implements LoginFacade {
	private _eventBusClient!: EventBusClient
	private _indexer!: Indexer
	/**
	 * Used for cancelling second factor and to not mix different attempts
	 */
	private _loginRequestSessionId: IdTuple | null = null

	/**
	 * Used for cancelling second factor immediately
	 */
	private loggingInPromiseWrapper: DeferredObject<void> | null = null

	/** On platforms with offline cache we do the actual login asynchronously and we can retry it. This is the state of such async login. */
	asyncLoginState:
		| {state: "idle"}
		| {state: "running"}
		| {state: "failed", credentials: Credentials, usingOfflineStorage: boolean} = {state: "idle"}

	// This is really just for tests, we need to wait for async login before moving on
	asyncLoginPromise: Promise<null> | null = null

	constructor(
		readonly worker: WorkerImpl,
		private readonly restClient: RestClient,
		private readonly entityClient: EntityClient,
		private readonly loginListener: ILoginListener,
		private readonly instanceMapper: InstanceMapper,
		private readonly cryptoFacade: CryptoFacade,
		/**
		 *  Only needed so that we can initialize the offline storage after login.
		 *  This is necessary because we don't know if we'll be persistent or not until the user tries to login
		 *  Once the credentials handling has been changed to *always* save in desktop, then this should become obsolete
		 */
		private readonly initializeCacheStorage: LateInitializedCacheStorage["initialize"],
		private readonly serviceExecutor: IServiceExecutor,
		private readonly userFacade: UserFacade,
	) {

	}

	init(indexer: Indexer, eventBusClient: EventBusClient) {
		this._indexer = indexer
		this._eventBusClient = eventBusClient
	}


	async resetSession(): Promise<void> {
		this._eventBusClient.close(CloseEventBusOption.Terminate)
		this.userFacade.reset()
	}

	/** @inheritDoc */
	async createSession(
		mailAddress: string,
		passphrase: string,
		clientIdentifier: string,
		sessionType: SessionType,
		databaseKey: Uint8Array | null,
	): Promise<NewSessionData> {
		if (this.userFacade.isPartiallyLoggedIn()) {
			console.log("session already exists, reuse data") // do not reset here because the event bus client needs to be kept if the same user is logged in as before
			// check if it is the same user in _initSession()
		}

		const userPassphraseKey = await this._loadUserPassphraseKey(mailAddress, passphrase)
		// the verifier is always sent as url parameter, so it must be url encoded
		const authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
		const createSessionData = createCreateSessionData({
			mailAddress: mailAddress.toLowerCase().trim(),
			clientIdentifier,
			authVerifier,
		})

		let accessKey: Aes128Key | null = null

		if (sessionType === SessionType.Persistent) {
			accessKey = aes128RandomKey()
			createSessionData.accessKey = keyToUint8Array(accessKey)
		}
		const createSessionReturn = await this.serviceExecutor.post(SessionService, createSessionData)
		const sessionData = await this._waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, mailAddress)

		const {isPersistent} = await this.initCache(sessionData.userId, databaseKey, null)
		const {
			user,
			userGroupInfo,
			accessToken
		} = await this.initSession(sessionData.userId, sessionData.accessToken, userPassphraseKey, sessionType, isPersistent)

		return {
			user,
			userGroupInfo,
			sessionId: sessionData.sessionId,
			credentials: {
				login: mailAddress,
				accessToken,
				encryptedPassword: sessionType === SessionType.Persistent ? uint8ArrayToBase64(encryptString(neverNull(accessKey), passphrase)) : null,
				userId: sessionData.userId,
				type: "internal",
			},
		}
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
			this.loginListener.onSecondFactorChallenge(sessionId, createSessionReturn.challenges, mailAddress)

			p = this._waitUntilSecondFactorApproved(createSessionReturn.accessToken, sessionId, 0)
		}

		this.loggingInPromiseWrapper = defer()
		// Wait for either login or cancel
		return Promise.race([this.loggingInPromiseWrapper.promise, p]).then(() => ({
			sessionId,
			accessToken: createSessionReturn.accessToken,
			userId: createSessionReturn.user,
		}))
	}

	_waitUntilSecondFactorApproved(accessToken: Base64Url, sessionId: IdTuple, retryOnNetworkError: number): Promise<void> {
		let secondFactorAuthGetData = createSecondFactorAuthGetData()
		secondFactorAuthGetData.accessToken = accessToken
		return this.serviceExecutor.get(SecondFactorAuthService, secondFactorAuthGetData)
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
		if (this.userFacade.isPartiallyLoggedIn()) {
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

		const createSessionReturn = await this.serviceExecutor.post(SessionService, sessionData)


		let sessionId = [this._getSessionListId(createSessionReturn.accessToken), this._getSessionElementId(createSessionReturn.accessToken)] as const
		const {isPersistent} = await this.initCache(userId, null, null)
		const {
			user,
			userGroupInfo,
			accessToken
		} = await this.initSession(createSessionReturn.user, createSessionReturn.accessToken, userPassphraseKey, SessionType.Login, isPersistent)
		return {
			user,
			userGroupInfo,
			sessionId,
			credentials: {
				login: userId,
				accessToken,
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
		await this.serviceExecutor.delete(SecondFactorAuthService, secondFactorAuthDeleteData)
				  .catch(ofClass(NotFoundError, (e) => {
					  // This can happen during some odd behavior in browser where main loop would be blocked by webauthn (hello, FF) and then we would try to
					  // cancel too late. No harm here anyway if the session is already gone.
					  console.warn("Tried to cancel second factor but it was not there anymore", e)
				  }))
		this._loginRequestSessionId = null
		this.loggingInPromiseWrapper?.reject(new CancelledError("login cancelled"))
	}

	/** @inheritDoc */
	async authenticateWithSecondFactor(data: SecondFactorAuthData): Promise<void> {
		await this.serviceExecutor.post(SecondFactorAuthService, data)
	}

	/**
	 * Resume a session of stored credentials.
	 */
	async resumeSession(
		credentials: Credentials,
		externalUserSalt: Uint8Array | null,
		databaseKey: Uint8Array | null,
		offlineTimeRangeDays: number | null
	): Promise<ResumeSessionResult> {
		this.userFacade.setAccessToken(credentials.accessToken)
		const {
			isPersistent: usingOfflineStorage,
			isNewOfflineDb
		} = await this.initCache(credentials.userId, databaseKey, offlineTimeRangeDays)

		const sessionId = this.getSessionId(credentials)

		// using offline, free, have connection         -> sync login
		// using offline, free, no connection           -> indicate that offline login is not for free customers
		// using offline, premium, have connection      -> async login
		// using offline, premium, no connection        -> async login w/ later retry
		// no offline, free, have connection            -> sync login
		// no offline, free, no connection              -> sync login, fail with connection error
		// no offline, premium, have connection         -> sync login
		// no offline, premium, no connection           -> sync login, fail with connection error

		// If a user enables offline storage for the first time, after already having saved credentials
		// then upon their next login, they won't have an offline database available, meaning we have to do
		// synchronous login in order to load all of the necessary keys and such
		// the next time they login they will be able to do asynchronous login
		if (usingOfflineStorage && !isNewOfflineDb) {
			const user = await this.entityClient.load(UserTypeRef, credentials.userId)
			if (user.accountType !== AccountType.PREMIUM) {
				// if account is free do not start offline login/async login workflow
				return this.finishResumeSession(credentials, externalUserSalt, usingOfflineStorage)
						   .catch(ofClass(ConnectionError, (e) => {
							   return {type: "error", reason: ResumeSessionErrorReason.OfflineNotAvailableForFree}
						   }))
			}
			this.userFacade.setUser(user)
			this.loginListener.onPartialLoginSuccess()
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
			// Start full login async
			Promise.resolve().then(() => this.asyncResumeSession(credentials, usingOfflineStorage))
			const data = {
				user,
				userGroupInfo,
				sessionId,
			}
			return {type: "success", data}
		} else {
			return this.finishResumeSession(credentials, externalUserSalt, usingOfflineStorage)
		}
	}

	private getSessionId(credentials: Credentials): IdTuple {
		return [this._getSessionListId(credentials.accessToken), this._getSessionElementId(credentials.accessToken)]
	}

	private async asyncResumeSession(credentials: Credentials, usingOfflineStorage: boolean): Promise<void> {
		const deferred = defer<null>()
		this.asyncLoginPromise = deferred.promise
		if (this.asyncLoginState.state === "running") {
			throw new Error("finishLoginResume run in parallel")
		}
		this.asyncLoginState = {state: "running"}
		try {
			await this.finishResumeSession(credentials, null, usingOfflineStorage)
		} catch (e) {
			if (e instanceof NotAuthenticatedError || e instanceof SessionExpiredError) {
				// For this type of errors we cannot use credentials anymore.
				this.asyncLoginState = {state: "idle"}
				await this.loginListener.onLoginError()
			} else {
				this.asyncLoginState = {state: "failed", credentials, usingOfflineStorage}
				if (!(e instanceof ConnectionError)) await this.worker.sendError(e)
			}
		} finally {
			deferred.resolve(null)
			this.asyncLoginPromise = null
		}
	}

	private async finishResumeSession(credentials: Credentials, externalUserSalt: Uint8Array | null, usingOfflineStorage: boolean): Promise<ResumeSessionResult> {
		const sessionId = this.getSessionId(credentials)
		const sessionData = await this._loadSessionData(credentials.accessToken)
		const passphrase = utf8Uint8ArrayToString(aes128Decrypt(sessionData.accessKey, base64ToUint8Array(neverNull(credentials.encryptedPassword))))
		let userPassphraseKey: Aes128Key

		if (externalUserSalt) {
			userPassphraseKey = generateKeyFromPassphrase(passphrase, externalUserSalt, KeyLength.b128)
		} else {
			userPassphraseKey = await this._loadUserPassphraseKey(credentials.login, passphrase)
		}

		const {
			user,
			userGroupInfo
		} = await this.initSession(sessionData.userId, credentials.accessToken, userPassphraseKey, SessionType.Persistent, usingOfflineStorage)

		this.asyncLoginState = {state: "idle"}

		const data = {
			user,
			userGroupInfo,
			sessionId,
		}

		return {type: "success", data}
	}

	private async initSession(
		userId: Id,
		accessToken: Base64Url,
		userPassphraseKey: Aes128Key,
		sessionType: SessionType,
		usingOfflineStorage: boolean,
	): Promise<{user: User, accessToken: string, userGroupInfo: GroupInfo}> {
		let userIdFromFormerLogin = this.userFacade.getUser()?._id ?? null

		if (userIdFromFormerLogin && userId !== userIdFromFormerLogin) {
			throw new Error("different user is tried to login in existing other user's session")
		}

		this.userFacade.setAccessToken(accessToken)

		try {
			const user = await this.entityClient.load(UserTypeRef, userId)
			// we check that the password is not changed
			// this may happen when trying to resume a session with an old stored password for externals when the password was changed by the sender
			// we do not delete all sessions on the server when changing the external password to avoid that an external user is immediately logged out
			if (uint8ArrayToBase64(user.verifier) !== uint8ArrayToBase64(sha256Hash(createAuthVerifier(userPassphraseKey)))) {
				// delete the obsolete session in parallel to make sure it can not be used any more
				this.deleteSession(accessToken)
				this.userFacade.setAccessToken(null)
				console.log("password has changed")
				throw new NotAuthenticatedError("password has changed")
			}

			const wasPartiallyLoggedIn = this.userFacade.isPartiallyLoggedIn()
			if (!wasPartiallyLoggedIn) {
				this.userFacade.setUser(user)
				this.loginListener.onPartialLoginSuccess()
			}

			this.userFacade.unlockUserGroupKey(userPassphraseKey)
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)

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
			this.loginListener.onFullLoginSuccess()
			return {user, accessToken, userGroupInfo}
		} catch (e) {
			this.resetSession()
			throw e
		}
	}

	private async initCache(userId: string, databaseKey: Uint8Array | null, timeRangeDays: number | null): Promise<{isPersistent: boolean, isNewOfflineDb: boolean}> {
		if (databaseKey != null) {
			return this.initializeCacheStorage({userId, databaseKey, timeRangeDays})
		} else {
			return this.initializeCacheStorage(null)
		}
	}

	_initIndexer(isUsingOfflineCache: boolean): Promise<void> {
		return this._indexer
				   .init({
						   user: assertNotNull(this.userFacade.getUser()),
						   userGroupKey: this.userFacade.getUserGroupKey(),
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
		const saltRequest = createSaltData({mailAddress})
		return this.serviceExecutor.get(SaltService, saltRequest).then((saltReturn: SaltReturn) => {
			return generateKeyFromPassphrase(passphrase, saltReturn.salt, KeyLength.b128)
		})
	}

	/**
	 * We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	 */
	async deleteSession(accessToken: Base64Url): Promise<void> {
		let path = typeRefToPath(SessionTypeRef) + "/" + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)
		const sessionTypeModel = await resolveTypeReference(SessionTypeRef)

		const headers = {
			accessToken: neverNull(accessToken),
			v: sessionTypeModel.version,
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

	async _loadSessionData(
		accessToken: Base64Url,
	): Promise<{
		userId: Id
		accessKey: Aes128Key
	}> {
		const path = typeRefToPath(SessionTypeRef) + "/" + this._getSessionListId(accessToken) + "/" + this._getSessionElementId(accessToken)
		const SessionTypeModel = await resolveTypeReference(SessionTypeRef)

		let headers = {
			accessToken: accessToken,
			v: SessionTypeModel.version,
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
	 * Loads entropy from the last logout.
	 */
	loadEntropy(): Promise<void> {
		return this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId()).then(tutanotaProperties => {
			if (tutanotaProperties.groupEncEntropy) {
				try {
					let entropy = aes128Decrypt(this.userFacade.getUserGroupKey(), neverNull(tutanotaProperties.groupEncEntropy))
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
		if (!this.userFacade.isFullyLoggedIn() || !this.userFacade.isLeader()) return Promise.resolve()
		const userGroupKey = this.userFacade.getUserGroupKey()
		const entropyData = createEntropyData({
			groupEncEntropy: encryptBytes(userGroupKey, random.generateRandomData(32)),
		})
		return this.serviceExecutor.put(EntropyService, entropyData)
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

	async changePassword(oldPassword: string, newPassword: string): Promise<void> {
		const userSalt = assertNotNull(this.userFacade.getLoggedInUser().salt)
		let oldAuthVerifier = createAuthVerifier(generateKeyFromPassphrase(oldPassword, userSalt, KeyLength.b128))
		let salt = generateRandomSalt()
		let userPassphraseKey = generateKeyFromPassphrase(newPassword, salt, KeyLength.b128)
		let pwEncUserGroupKey = encryptKey(userPassphraseKey, this.userFacade.getUserGroupKey())
		let authVerifier = createAuthVerifier(userPassphraseKey)
		let service = createChangePasswordData()
		service.oldVerifier = oldAuthVerifier
		service.salt = salt
		service.verifier = authVerifier
		service.pwEncUserGroupKey = pwEncUserGroupKey
		await this.serviceExecutor.post(ChangePasswordService, service)
	}

	async deleteAccount(password: string, reason: string, takeover: string): Promise<void> {
		let d = createDeleteCustomerData()
		const userSalt = assertNotNull(this.userFacade.getLoggedInUser().salt)
		d.authVerifier = createAuthVerifier(generateKeyFromPassphrase(password, userSalt, KeyLength.b128))
		d.undelete = false
		d.customer = neverNull(neverNull(this.userFacade.getLoggedInUser()).customer)
		d.reason = reason

		if (takeover !== "") {
			d.takeoverMailAddress = takeover
		} else {
			d.takeoverMailAddress = null
		}
		await this.serviceExecutor.delete(CustomerService, d)
	}

	decryptUserPassword(userId: string, deviceToken: string, encryptedPassword: string): Promise<string> {
		const getData = createAutoLoginDataGet()
		getData.userId = userId
		getData.deviceToken = deviceToken
		return this.serviceExecutor.get(AutoLoginService, getData).then(returnData => {
			const key = uint8ArrayToKey(returnData.deviceKey)
			return utf8Uint8ArrayToString(aes128Decrypt(key, base64ToUint8Array(encryptedPassword)))
		})
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
		const tempAuthHeadersProvider: AuthHeadersProvider = {
			createAuthHeaders(): Dict {
				return {}
			}
		}
		const eventRestClient = new EntityRestClient(
			tempAuthHeadersProvider,
			this.restClient,
			() => this.cryptoFacade,
			this.instanceMapper,
		)
		const entityClient = new EntityClient(eventRestClient)
		return this.serviceExecutor.post(SessionService, sessionData) // Don't pass email address to avoid proposing to reset second factor when we're resetting password
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
							   return this.serviceExecutor.post(ChangePasswordService, postData, {extraHeaders})
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
			return this.serviceExecutor.delete(ResetFactorsService, deleteData)
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
			return this.serviceExecutor.post(TakeOverDeletedAddressService, data)
		})
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

	async entityEventsReceived(data: EntityUpdate[]): Promise<void> {
		// This is a compromise to not add entityClient to UserFacade which would introduce a circular dep.
		for (const update of data) {
			const user = this.userFacade.getUser()
			if (
				user != null &&
				update.operation === OperationType.UPDATE &&
				isSameTypeRefByAttr(UserTypeRef, update.application, update.type) &&
				isSameId(user._id, update.instanceId)
			) {
				this.userFacade.updateUser(await this.entityClient.load(UserTypeRef, user._id))
			}
		}
	}

	async retryAsyncLogin(): Promise<void> {
		if (this.asyncLoginState.state === "running") {
			return
		} else if (this.asyncLoginState.state === "failed") {
			await this.asyncResumeSession(this.asyncLoginState.credentials, this.asyncLoginState.usingOfflineStorage)
		} else {
			throw new Error("credentials went missing")
		}
	}
}

export type RecoverData = {
	userEncRecoverCode: Uint8Array
	recoverCodeEncUserGroupKey: Uint8Array
	hexCode: Hex
	recoveryCodeVerifier: Uint8Array
}