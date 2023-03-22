import type { Base64Url, DeferredObject, Hex } from "@tutao/tutanota-utils"
import {
	arrayEquals,
	assertNotNull,
	Base64,
	base64ToBase64Ext,
	base64ToBase64Url,
	base64ToUint8Array,
	base64UrlToBase64,
	defer,
	hexToUint8Array,
	neverNull,
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
	TakeOverDeletedAddressService,
} from "../../entities/sys/Services"
import { AccountType, CloseEventBusOption } from "../../common/TutanotaConstants"
import { CryptoError } from "../../common/error/CryptoError"
import type { GroupInfo, SaltReturn, SecondFactorAuthData, User } from "../../entities/sys/TypeRefs.js"
import {
	Challenge,
	createAutoLoginDataGet,
	createChangePasswordData,
	createCreateSessionData,
	createDeleteCustomerData,
	createResetFactorsDeleteData,
	createSaltData,
	createSecondFactorAuthDeleteData,
	createSecondFactorAuthGetData,
	CreateSessionReturn,
	createTakeOverDeletedAddressData,
	GroupInfoTypeRef,
	RecoverCodeTypeRef,
	SessionTypeRef,
	UserTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { TutanotaPropertiesTypeRef } from "../../entities/tutanota/TypeRefs.js"
import { HttpMethod, MediaType, resolveTypeReference } from "../../common/EntityFunctions"
import { assertWorkerOrNode } from "../../common/Env"
import { ConnectMode, EventBusClient } from "../EventBusClient"
import { EntityRestClient, typeRefToPath } from "../rest/EntityRestClient"
import { AccessExpiredError, ConnectionError, NotAuthenticatedError, NotFoundError, SessionExpiredError } from "../../common/error/RestError"
import type { WorkerImpl } from "../WorkerImpl"
import { CancelledError } from "../../common/error/CancelledError"
import { RestClient } from "../rest/RestClient"
import { EntityClient } from "../../common/EntityClient"
import { GENERATED_ID_BYTES_LENGTH, isSameId } from "../../common/utils/EntityUtils"
import type { Credentials } from "../../../misc/credentials/Credentials"
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
import { CryptoFacade, encryptString } from "../crypto/CryptoFacade"
import { InstanceMapper } from "../crypto/InstanceMapper"
import { Aes128Key } from "@tutao/tutanota-crypto/dist/encryption/Aes"
import { IServiceExecutor } from "../../common/ServiceRequest"
import { SessionType } from "../../common/SessionType"
import { CacheStorageLateInitializer } from "../rest/CacheStorageProxy"
import { AuthDataProvider, UserFacade } from "./UserFacade"
import { LoginFailReason } from "../../main/PageContextLoginListener.js"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError.js"
import { EntropyFacade } from "./EntropyFacade.js"
import { BlobAccessTokenFacade } from "./BlobAccessTokenFacade.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { DatabaseKeyFactory } from "../../../misc/credentials/DatabaseKeyFactory.js"

assertWorkerOrNode()

export type NewSessionData = {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
	credentials: Credentials
	databaseKey: Uint8Array | null
}

export type CacheInfo = {
	isPersistent: boolean
	isNewOfflineDb: boolean
}

interface ResumeSessionResultData {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
}

export const enum ResumeSessionErrorReason {
	OfflineNotAvailableForFree,
}

export type InitCacheOptions = {
	userId: Id
	databaseKey: Uint8Array | null
	timeRangeDays: number | null
	forceNewDatabase: boolean
}

type ResumeSessionSuccess = { type: "success"; data: ResumeSessionResultData }
type ResumeSessionFailure = { type: "error"; reason: ResumeSessionErrorReason }
type ResumeSessionResult = ResumeSessionSuccess | ResumeSessionFailure

type AsyncLoginState = { state: "idle" } | { state: "running" } | { state: "failed"; credentials: Credentials; cacheInfo: CacheInfo }

export interface LoginListener {
	/**
	 * Partial login reached: cached entities and user are available.
	 */
	onPartialLoginSuccess(): Promise<void>

	/**
	 * Full login reached: any network requests can be made
	 */
	onFullLoginSuccess(sessionType: SessionType, cacheInfo: CacheInfo): Promise<void>

	/**
	 * call when the login fails for invalid session or other reasons
	 */
	onLoginFailure(reason: LoginFailReason): Promise<void>

	/**
	 * Shows a dialog with possibility to use second factor and with a message that the login can be approved from another client.
	 */
	onSecondFactorChallenge(sessionId: IdTuple, challenges: ReadonlyArray<Challenge>, mailAddress: string | null): Promise<void>
}

export class LoginFacade {
	private eventBusClient!: EventBusClient
	/**
	 * Used for cancelling second factor and to not mix different attempts
	 */
	private loginRequestSessionId: IdTuple | null = null

	/**
	 * Used for cancelling second factor immediately
	 */
	private loggingInPromiseWrapper: DeferredObject<void> | null = null

	/** On platforms with offline cache we do the actual login asynchronously and we can retry it. This is the state of such async login. */
	asyncLoginState: AsyncLoginState = { state: "idle" }

	constructor(
		readonly worker: WorkerImpl,
		private readonly restClient: RestClient,
		private readonly entityClient: EntityClient,
		private readonly loginListener: LoginListener,
		private readonly instanceMapper: InstanceMapper,
		private readonly cryptoFacade: CryptoFacade,
		/**
		 *  Only needed so that we can initialize the offline storage after login.
		 *  This is necessary because we don't know if we'll be persistent or not until the user tries to login
		 *  Once the credentials handling has been changed to *always* save in desktop, then this should become obsolete
		 */
		private readonly cacheInitializer: CacheStorageLateInitializer,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly userFacade: UserFacade,
		private readonly blobAccessTokenFacade: BlobAccessTokenFacade,
		private readonly entropyFacade: EntropyFacade,
		private readonly databaseKeyFactory: DatabaseKeyFactory,
	) {}

	init(eventBusClient: EventBusClient) {
		this.eventBusClient = eventBusClient
	}

	async resetSession(): Promise<void> {
		this.eventBusClient.close(CloseEventBusOption.Terminate)
		await this.deInitCache()
		this.userFacade.reset()
	}

	/**
	 * Create session and log in. Changes internal state to refer to the logged in user.
	 */
	async createSession(
		mailAddress: string,
		passphrase: string,
		clientIdentifier: string,
		sessionType: SessionType,
		databaseKey: Uint8Array | null,
	): Promise<NewSessionData> {
		if (this.userFacade.isPartiallyLoggedIn()) {
			// do not reset here because the event bus client needs to be kept if the same user is logged in as before
			console.log("session already exists, reuse data")
			// check if it is the same user in _initSession()
		}

		const userPassphraseKey = await this.loadUserPassphraseKey(mailAddress, passphrase)
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
		const sessionData = await this.waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, mailAddress)

		const forceNewDatabase = sessionType === SessionType.Persistent && databaseKey == null
		if (forceNewDatabase) {
			console.log("generating new database key for persistent session")
			databaseKey = await this.databaseKeyFactory.generateKey()
		}

		const cacheInfo = await this.initCache({
			userId: sessionData.userId,
			databaseKey,
			timeRangeDays: null,
			forceNewDatabase,
		})
		const { user, userGroupInfo, accessToken } = await this.initSession(
			sessionData.userId,
			sessionData.accessToken,
			userPassphraseKey,
			sessionType,
			cacheInfo,
		)

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
			// we always try to make a persistent cache with a key for persistent session, but this
			// falls back to ephemeral cache in browsers. no point storing the key then.
			databaseKey: cacheInfo.isPersistent ? databaseKey : null,
		}
	}

	/**
	 * If the second factor login has been cancelled a CancelledError is thrown.
	 */
	private waitUntilSecondFactorApprovedOrCancelled(
		createSessionReturn: CreateSessionReturn,
		mailAddress: string | null,
	): Promise<{
		sessionId: IdTuple
		userId: Id
		accessToken: Base64Url
	}> {
		let p = Promise.resolve()
		let sessionId = [this.getSessionListId(createSessionReturn.accessToken), this.getSessionElementId(createSessionReturn.accessToken)] as const
		this.loginRequestSessionId = sessionId

		if (createSessionReturn.challenges.length > 0) {
			// Show a message to the user and give them a chance to complete the challenges.
			this.loginListener.onSecondFactorChallenge(sessionId, createSessionReturn.challenges, mailAddress)

			p = this.waitUntilSecondFactorApproved(createSessionReturn.accessToken, sessionId, 0)
		}

		this.loggingInPromiseWrapper = defer()
		// Wait for either login or cancel
		return Promise.race([this.loggingInPromiseWrapper.promise, p]).then(() => ({
			sessionId,
			accessToken: createSessionReturn.accessToken,
			userId: createSessionReturn.user,
		}))
	}

	private async waitUntilSecondFactorApproved(accessToken: Base64Url, sessionId: IdTuple, retryOnNetworkError: number): Promise<void> {
		let secondFactorAuthGetData = createSecondFactorAuthGetData()
		secondFactorAuthGetData.accessToken = accessToken
		try {
			const secondFactorAuthGetReturn = await this.serviceExecutor.get(SecondFactorAuthService, secondFactorAuthGetData)
			if (!this.loginRequestSessionId || !isSameId(this.loginRequestSessionId, sessionId)) {
				throw new CancelledError("login cancelled")
			}

			if (secondFactorAuthGetReturn.secondFactorPending) {
				return this.waitUntilSecondFactorApproved(accessToken, sessionId, 0)
			}
		} catch (e) {
			if (e instanceof ConnectionError && retryOnNetworkError < 10) {
				// connection error can occur on ios when switching between apps, just retry in this case.
				return this.waitUntilSecondFactorApproved(accessToken, sessionId, retryOnNetworkError + 1)
			}
			throw e
		}
	}

	/**
	 * Create external (temporary mailbox for password-protected emails) session and log in.
	 * Changes internal state to refer to the logged in user.
	 */
	async createExternalSession(
		userId: Id,
		passphrase: string,
		salt: Uint8Array,
		clientIdentifier: string,
		persistentSession: boolean,
	): Promise<NewSessionData> {
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

		let sessionId = [this.getSessionListId(createSessionReturn.accessToken), this.getSessionElementId(createSessionReturn.accessToken)] as const
		const cacheInfo = await this.initCache({
			userId,
			databaseKey: null,
			timeRangeDays: null,
			forceNewDatabase: true,
		})
		const { user, userGroupInfo, accessToken } = await this.initSession(
			createSessionReturn.user,
			createSessionReturn.accessToken,
			userPassphraseKey,
			SessionType.Login,
			cacheInfo,
		)
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
			databaseKey: null,
		}
	}

	/** Cancels 2FA process. */
	async cancelCreateSession(sessionId: IdTuple): Promise<void> {
		if (!this.loginRequestSessionId || !isSameId(this.loginRequestSessionId, sessionId)) {
			throw new Error("Trying to cancel session creation but the state is invalid")
		}

		const secondFactorAuthDeleteData = createSecondFactorAuthDeleteData({
			session: sessionId,
		})
		await this.serviceExecutor.delete(SecondFactorAuthService, secondFactorAuthDeleteData).catch(
			ofClass(NotFoundError, (e) => {
				// This can happen during some odd behavior in browser where main loop would be blocked by webauthn (hello, FF) and then we would try to
				// cancel too late. No harm here anyway if the session is already gone.
				console.warn("Tried to cancel second factor but it was not there anymore", e)
			}),
		)
		this.loginRequestSessionId = null
		this.loggingInPromiseWrapper?.reject(new CancelledError("login cancelled"))
	}

	/** Finishes 2FA process either using second factor or approving session on another client. */
	async authenticateWithSecondFactor(data: SecondFactorAuthData): Promise<void> {
		await this.serviceExecutor.post(SecondFactorAuthService, data)
	}

	/**
	 * Resumes previously created session (using persisted credentials).
	 * @param credentials the saved credentials to use
	 * @param externalUserSalt
	 * @param databaseKey key to unlock the local database (if enabled)
	 * @param timeRangeDays the user configured time range for the offline database
	 */
	async resumeSession(
		credentials: Credentials,
		externalUserSalt: Uint8Array | null,
		databaseKey: Uint8Array | null,
		timeRangeDays: number | null,
	): Promise<ResumeSessionResult> {
		if (this.userFacade.getUser() != null) {
			throw new ProgrammingError(
				`Trying to resume the session for user ${credentials.userId} while already logged in for ${this.userFacade.getUser()?._id}`,
			)
		}
		if (this.asyncLoginState.state !== "idle") {
			throw new ProgrammingError(`Trying to resume the session for user ${credentials.userId} while the asyncLoginState is ${this.asyncLoginState.state}`)
		}
		this.userFacade.setAccessToken(credentials.accessToken)
		// important: any exit point from here on should deinit the cache if the login hasn't succeeded
		const cacheInfo = await this.initCache({
			userId: credentials.userId,
			databaseKey,
			timeRangeDays,
			forceNewDatabase: false,
		})
		const sessionId = this.getSessionId(credentials)
		try {
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
			if (cacheInfo?.isPersistent && !cacheInfo.isNewOfflineDb) {
				const user = await this.entityClient.load(UserTypeRef, credentials.userId)
				if (user.accountType !== AccountType.PREMIUM) {
					// if account is free do not start offline login/async login workflow.
					// await before return to catch errors here
					return await this.finishResumeSession(credentials, externalUserSalt, cacheInfo).catch(
						ofClass(ConnectionError, async () => {
							await this.resetSession()
							return { type: "error", reason: ResumeSessionErrorReason.OfflineNotAvailableForFree }
						}),
					)
				}
				this.userFacade.setUser(user)
				this.loginListener.onPartialLoginSuccess()

				// Temporary workaround for the transitional period
				// Before offline login was enabled (in 3.96.4) we didn't use cache for the login process, only afterwards.
				// This could lead to a situation where we never loaded or saved user groupInfo but would try to use it now.
				// We can remove this after a few versions when the bulk of people who enabled offline will upgrade.
				let userGroupInfo: GroupInfo
				try {
					userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
				} catch (e) {
					console.log("Could not do start login, groupInfo is not cached, falling back to sync login")
					if (e instanceof LoginIncompleteError) {
						// await before return to catch the errors here
						return await this.finishResumeSession(credentials, externalUserSalt, cacheInfo)
					} else {
						// noinspection ExceptionCaughtLocallyJS: we want to make sure we go throw the same exit point
						throw e
					}
				}

				// Start full login async
				Promise.resolve().then(() => this.asyncResumeSession(credentials, cacheInfo))
				const data = {
					user,
					userGroupInfo,
					sessionId,
				}
				return { type: "success", data }
			} else {
				// await before return to catch errors here
				return await this.finishResumeSession(credentials, externalUserSalt, cacheInfo)
			}
		} catch (e) {
			// If we initialized the cache, but then we couldn't authenticate we should de-initialize
			// the cache again because we will initialize it for the next attempt.
			// It might be also called in initSession but the error can be thrown even before that (e.g. if the db is empty for some reason) so we reset
			// the session here as well, otherwise we might try to open the DB twice.
			await this.resetSession()
			throw e
		}
	}

	private getSessionId(credentials: Credentials): IdTuple {
		return [this.getSessionListId(credentials.accessToken), this.getSessionElementId(credentials.accessToken)]
	}

	private async asyncResumeSession(credentials: Credentials, cacheInfo: CacheInfo): Promise<void> {
		if (this.asyncLoginState.state === "running") {
			throw new Error("finishLoginResume run in parallel")
		}
		this.asyncLoginState = { state: "running" }
		try {
			await this.finishResumeSession(credentials, null, cacheInfo)
		} catch (e) {
			if (e instanceof NotAuthenticatedError || e instanceof SessionExpiredError) {
				// For this type of errors we cannot use credentials anymore.
				this.asyncLoginState = { state: "idle" }
				await this.loginListener.onLoginFailure(LoginFailReason.SessionExpired)
			} else {
				this.asyncLoginState = { state: "failed", credentials, cacheInfo }
				if (!(e instanceof ConnectionError)) await this.worker.sendError(e)
				await this.loginListener.onLoginFailure(LoginFailReason.Error)
			}
		}
	}

	private async finishResumeSession(credentials: Credentials, externalUserSalt: Uint8Array | null, cacheInfo: CacheInfo): Promise<ResumeSessionSuccess> {
		const sessionId = this.getSessionId(credentials)
		const sessionData = await this.loadSessionData(credentials.accessToken)
		const passphrase = utf8Uint8ArrayToString(aes128Decrypt(sessionData.accessKey, base64ToUint8Array(neverNull(credentials.encryptedPassword))))
		let userPassphraseKey: Aes128Key

		if (externalUserSalt) {
			await this.checkOutdatedExternalSalt(credentials, sessionData, externalUserSalt)
			userPassphraseKey = generateKeyFromPassphrase(passphrase, externalUserSalt, KeyLength.b128)
		} else {
			userPassphraseKey = await this.loadUserPassphraseKey(credentials.login, passphrase)
		}

		const { user, userGroupInfo } = await this.initSession(
			sessionData.userId,
			credentials.accessToken,
			userPassphraseKey,
			SessionType.Persistent,
			cacheInfo,
		)

		this.asyncLoginState = { state: "idle" }

		const data = {
			user,
			userGroupInfo,
			sessionId,
		}

		return { type: "success", data }
	}

	private async initSession(
		userId: Id,
		accessToken: Base64Url,
		userPassphraseKey: Aes128Key,
		sessionType: SessionType,
		cacheInfo: CacheInfo,
	): Promise<{ user: User; accessToken: string; userGroupInfo: GroupInfo }> {
		// We might have userId already if:
		// - session has expired and a new one was created
		// - if it's a partial login
		const userIdFromFormerLogin = this.userFacade.getUser()?._id ?? null

		if (userIdFromFormerLogin && userId !== userIdFromFormerLogin) {
			throw new Error("different user is tried to login in existing other user's session")
		}

		this.userFacade.setAccessToken(accessToken)

		try {
			const user = await this.entityClient.load(UserTypeRef, userId)
			await this.checkOutdatedPassword(user, accessToken, userPassphraseKey)

			const wasPartiallyLoggedIn = this.userFacade.isPartiallyLoggedIn()
			if (!wasPartiallyLoggedIn) {
				this.userFacade.setUser(user)
				this.loginListener.onPartialLoginSuccess()
			}
			const wasFullyLoggedIn = this.userFacade.isFullyLoggedIn()

			this.userFacade.unlockUserGroupKey(userPassphraseKey)
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)

			await this.loadEntropy()

			// If we have been fully logged in at least once already (probably expired ephemeral session)
			// then we just reconnnect and re-download missing events.
			// For new connections we have special handling.
			if (wasFullyLoggedIn) {
				this.eventBusClient.connect(ConnectMode.Reconnect)
			} else {
				this.eventBusClient.connect(ConnectMode.Initial)
			}

			await this.entropyFacade.storeEntropy()
			this.loginListener.onFullLoginSuccess(sessionType, cacheInfo)
			return { user, accessToken, userGroupInfo }
		} catch (e) {
			this.resetSession()
			throw e
		}
	}

	/**
	 * init an appropriate cache implementation. we will always try to create a persistent cache for persistent sessions and fall back to an ephemeral cache
	 * in the browser.
	 *
	 * @param userId the user for which the cache is created
	 * @param databaseKey the key to use
	 * @param timeRangeDays how far into the past the cache keeps data around
	 * @param forceNewDatabase true if the old database should be deleted if there is one
	 * @private
	 */
	private async initCache({ userId, databaseKey, timeRangeDays, forceNewDatabase }: InitCacheOptions): Promise<CacheInfo> {
		if (databaseKey != null) {
			return this.cacheInitializer.initialize({ type: "offline", userId, databaseKey, timeRangeDays, forceNewDatabase })
		} else {
			return this.cacheInitializer.initialize({ type: "ephemeral", userId })
		}
	}

	private async deInitCache(): Promise<void> {
		return this.cacheInitializer.deInitialize()
	}

	/**
	 * Check whether the passed salt for external user is up-to-date (whether an outdated link was used).
	 */
	private async checkOutdatedExternalSalt(credentials: Credentials, sessionData: { userId: Id; accessKey: Aes128Key }, externalUserSalt: Uint8Array) {
		this.userFacade.setAccessToken(credentials.accessToken)
		const user = await this.entityClient.load(UserTypeRef, sessionData.userId)
		const latestSaltHash = assertNotNull(user.externalAuthInfo!.latestSaltHash, "latestSaltHash is not set!")
		if (!arrayEquals(latestSaltHash, sha256Hash(externalUserSalt))) {
			// Do not delete session or credentials, we can still use them if the password
			// hasn't been changed.
			this.resetSession()
			throw new AccessExpiredError("Salt changed, outdated link?")
		}
	}

	/**
	 * Check that the password is not changed.
	 * Normally this won't happen for internal users as all sessions are closed on password change. This may happen for external users when the sender has
	 * changed the password.
	 * We do not delete all sessions on the server when changing the external password to avoid that an external user is immediately logged out.
	 */
	private async checkOutdatedPassword(user: User, accessToken: string, userPassphraseKey: Aes128Key) {
		if (uint8ArrayToBase64(user.verifier) !== uint8ArrayToBase64(sha256Hash(createAuthVerifier(userPassphraseKey)))) {
			console.log("External password has changed")
			// delete the obsolete session to make sure it can not be used any more
			await this.deleteSession(accessToken).catch((e) => console.error("Could not delete session", e))
			await this.resetSession()
			throw new NotAuthenticatedError("External password has changed")
		}
	}

	private loadUserPassphraseKey(mailAddress: string, passphrase: string): Promise<Aes128Key> {
		mailAddress = mailAddress.toLowerCase().trim()
		const saltRequest = createSaltData({ mailAddress })
		return this.serviceExecutor.get(SaltService, saltRequest).then((saltReturn: SaltReturn) => {
			return generateKeyFromPassphrase(passphrase, saltReturn.salt, KeyLength.b128)
		})
	}

	/**
	 * We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	 */
	async deleteSession(accessToken: Base64Url): Promise<void> {
		let path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken)
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

	private getSessionElementId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Url(uint8ArrayToBase64(sha256Hash(byteAccessToken.slice(GENERATED_ID_BYTES_LENGTH))))
	}

	private getSessionListId(accessToken: Base64Url): Id {
		let byteAccessToken = base64ToUint8Array(base64UrlToBase64(neverNull(accessToken)))
		return base64ToBase64Ext(uint8ArrayToBase64(byteAccessToken.slice(0, GENERATED_ID_BYTES_LENGTH)))
	}

	private async loadSessionData(accessToken: Base64Url): Promise<{
		userId: Id
		accessKey: Aes128Key
	}> {
		const path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken)
		const SessionTypeModel = await resolveTypeReference(SessionTypeRef)

		let headers = {
			accessToken: accessToken,
			v: SessionTypeModel.version,
		}
		return this.restClient
			.request(path, HttpMethod.GET, {
				headers,
				responseType: MediaType.Json,
			})
			.then((instance) => {
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
	private loadEntropy(): Promise<void> {
		return this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId()).then((tutanotaProperties) => {
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
		return this.serviceExecutor.get(AutoLoginService, getData).then((returnData) => {
			const key = uint8ArrayToKey(returnData.deviceKey)
			return utf8Uint8ArrayToString(aes128Decrypt(key, base64ToUint8Array(encryptedPassword)))
		})
	}

	/** Changes user password to another one using recoverCode instead of the old password. */
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
		const tempAuthDataProvider: AuthDataProvider = {
			createAuthHeaders(): Dict {
				return {}
			},
			isFullyLoggedIn(): boolean {
				return false
			},
		}
		const eventRestClient = new EntityRestClient(
			tempAuthDataProvider,
			this.restClient,
			() => this.cryptoFacade,
			this.instanceMapper,
			this.blobAccessTokenFacade,
		)
		const entityClient = new EntityClient(eventRestClient)
		return this.serviceExecutor
			.post(SessionService, sessionData) // Don't pass email address to avoid proposing to reset second factor when we're resetting password
			.then((createSessionReturn) => this.waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, null))
			.then((sessionData) => {
				return entityClient
					.load(UserTypeRef, sessionData.userId, undefined, {
						accessToken: sessionData.accessToken,
					})
					.then((user) => {
						if (user.auth == null || user.auth.recoverCode == null) {
							return Promise.reject(new Error("missing recover code"))
						}

						const extraHeaders = {
							accessToken: sessionData.accessToken,
							recoverCodeVerifier: recoverCodeVerifierBase64,
						}
						return entityClient.load(RecoverCodeTypeRef, user.auth.recoverCode, undefined, extraHeaders)
					})
					.then((recoverCode) => {
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
						return this.serviceExecutor.post(ChangePasswordService, postData, { extraHeaders })
					})
					.finally(() => this.deleteSession(sessionData.accessToken))
			})
	}

	/** Deletes second factors using recoverCode as second factor. */
	resetSecondFactors(mailAddress: string, password: string, recoverCode: Hex): Promise<void> {
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
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
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
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
		return this.getTotpVerifier().then((totp) => totp.generateSecret())
	}

	generateTotpCode(time: number, key: Uint8Array): Promise<number> {
		return this.getTotpVerifier().then((totp) => totp.generateTotp(time, key))
	}

	private getTotpVerifier(): Promise<TotpVerifier> {
		return Promise.resolve(new TotpVerifier())
	}

	async retryAsyncLogin(): Promise<void> {
		if (this.asyncLoginState.state === "running") {
			return
		} else if (this.asyncLoginState.state === "failed") {
			await this.asyncResumeSession(this.asyncLoginState.credentials, this.asyncLoginState.cacheInfo)
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
