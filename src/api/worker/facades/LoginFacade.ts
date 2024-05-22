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
	ChangeKdfService,
	ChangePasswordService,
	CustomerService,
	ResetFactorsService,
	SaltService,
	SecondFactorAuthService,
	SessionService,
	TakeOverDeletedAddressService,
} from "../../entities/sys/Services"
import { AccountType, asKdfType, CloseEventBusOption, Const, DEFAULT_KDF_TYPE, KdfType } from "../../common/TutanotaConstants"
import {
	Challenge,
	createChangeKdfPostIn,
	createChangePasswordData,
	createCreateSessionData,
	createDeleteCustomerData,
	createResetFactorsDeleteData,
	createSaltData,
	createSecondFactorAuthDeleteData,
	createSecondFactorAuthGetData,
	CreateSessionReturn,
	createTakeOverDeletedAddressData,
	GroupInfo,
	GroupInfoTypeRef,
	RecoverCodeTypeRef,
	SecondFactorAuthData,
	SessionTypeRef,
	SurveyData,
	User,
	UserTypeRef,
} from "../../entities/sys/TypeRefs.js"
import { TutanotaPropertiesTypeRef } from "../../entities/tutanota/TypeRefs.js"
import { HttpMethod, MediaType, resolveTypeReference } from "../../common/EntityFunctions"
import { assertWorkerOrNode } from "../../common/Env"
import { ConnectMode, EventBusClient } from "../EventBusClient"
import { EntityRestClient, typeRefToPath } from "../rest/EntityRestClient"
import { AccessExpiredError, ConnectionError, LockedError, NotAuthenticatedError, NotFoundError, SessionExpiredError } from "../../common/error/RestError"
import type { WorkerImpl } from "../WorkerImpl"
import { CancelledError } from "../../common/error/CancelledError"
import { RestClient } from "../rest/RestClient"
import { EntityClient } from "../../common/EntityClient"
import { GENERATED_ID_BYTES_LENGTH, isSameId } from "../../common/utils/EntityUtils"
import type { Credentials } from "../../../misc/credentials/Credentials"
import {
	Aes128Key,
	aes256DecryptWithRecoveryKey,
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	AesKey,
	base64ToKey,
	createAuthVerifier,
	createAuthVerifierAsBase64Url,
	encryptKey,
	generateKeyFromPassphraseBcrypt,
	generateRandomSalt,
	KeyLength,
	keyToUint8Array,
	sha256Hash,
	TotpSecret,
	TotpVerifier,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import { CryptoFacade, encryptString } from "../crypto/CryptoFacade"
import { InstanceMapper } from "../crypto/InstanceMapper"
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
import { ExternalUserKeyDeriver } from "../../../misc/LoginUtils.js"
import { Argon2idFacade } from "./Argon2idFacade.js"
import { KeyRotationFacade } from "./KeyRotationFacade.js"

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

/**
 * All attributes that are required to derive the passphrase key.
 */
export type PassphraseKeyData = {
	kdfType: KdfType
	salt: Uint8Array
	passphrase: string
}

export interface LoginListener {
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
		private readonly keyRotationFacade: KeyRotationFacade,
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
		private readonly argon2idFacade: Argon2idFacade,
		private readonly noncachingEntityClient: EntityClient,
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

		const { userPassphraseKey, kdfType } = await this.loadUserPassphraseKey(mailAddress, passphrase)
		// the verifier is always sent as url parameter, so it must be url encoded
		const authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
		const createSessionData = createCreateSessionData({
			accessKey: null,
			authToken: null,
			authVerifier,
			clientIdentifier,
			mailAddress: mailAddress.toLowerCase().trim(),
			recoverCodeVerifier: null,
			user: null,
		})

		let accessKey: AesKey | null = null

		if (sessionType === SessionType.Persistent) {
			accessKey = aes256RandomKey()
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

		if (!this.isModernKdfType(kdfType)) {
			await this.migrateKdfType(KdfType.Argon2id, passphrase, user)
		} else {
			// If we have not migrated to argon2 we postpone key rotation until next login.
			await this.keyRotationFacade.loadPendingKeyRotations(user, userPassphraseKey)
		}

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
	 * Ensure that the user is using a modern KDF type, migrating if not.
	 * @param targetKdfType the current KDF type
	 * @param passphrase either the plaintext passphrase or the encrypted passphrase with the access token necessary to decrypt it
	 * @param user the user we are updating
	 */
	public async migrateKdfType(targetKdfType: KdfType, passphrase: string, user: User): Promise<void> {
		if (!Const.EXECUTE_KDF_MIGRATION) {
			// Migration is not yet enabled on this version.
			return
		}
		const currentPassphraseKeyData = {
			passphrase,
			kdfType: asKdfType(user.kdfVersion),
			salt: assertNotNull(user.salt, `current salt for user ${user._id} not found`),
		}

		const currentUserPassphraseKey = await this.deriveUserPassphraseKey(currentPassphraseKeyData)
		const currentAuthVerifier = createAuthVerifier(currentUserPassphraseKey)

		const newPassphraseKeyData = {
			passphrase,
			kdfType: targetKdfType,
			salt: generateRandomSalt(),
		}
		const newUserPassphraseKey = await this.deriveUserPassphraseKey(newPassphraseKeyData)

		const pwEncUserGroupKey = encryptKey(newUserPassphraseKey, this.userFacade.getCurrentUserGroupKey().object)
		const newAuthVerifier = createAuthVerifier(newUserPassphraseKey)

		const changeKdfPostIn = createChangeKdfPostIn({
			kdfVersion: newPassphraseKeyData.kdfType,
			salt: newPassphraseKeyData.salt,
			pwEncUserGroupKey,
			verifier: newAuthVerifier,
			oldVerifier: currentAuthVerifier,
		})
		console.log("Migrate KDF from:", user.kdfVersion, "to", targetKdfType)
		await this.serviceExecutor.post(ChangeKdfService, changeKdfPostIn)
		this.userFacade.setUserGroupKeyDistributionKey(newUserPassphraseKey)
	}

	/**
	 * Checks if the given KDF type is phased out.
	 * @param kdfType
	 * @private
	 */
	private isModernKdfType(kdfType: KdfType): boolean {
		// resist the temptation to just check if it is equal to the default, because that will yield false for KDF types we don't know about yet
		return kdfType !== KdfType.Bcrypt
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
		let secondFactorAuthGetData = createSecondFactorAuthGetData({
			accessToken,
		})
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
				// Connection error can occur on ios when switching between apps or just as a timeout (our request timeout is shorter than the overall
				// auth flow timeout). Just retry in this case.
				return this.waitUntilSecondFactorApproved(accessToken, sessionId, retryOnNetworkError + 1)
			}
			throw e
		}
	}

	/**
	 * Create external (temporary mailbox for passphrase-protected emails) session and log in.
	 * Changes internal state to refer to the logged-in user.
	 */
	async createExternalSession(
		userId: Id,
		passphrase: string,
		salt: Uint8Array,
		kdfType: KdfType,
		clientIdentifier: string,
		persistentSession: boolean,
	): Promise<NewSessionData> {
		if (this.userFacade.isPartiallyLoggedIn()) {
			throw new Error("user already logged in")
		}

		console.log("login external worker")
		const userPassphraseKey = await this.deriveUserPassphraseKey({ kdfType, passphrase, salt })
		// the verifier is always sent as url parameter, so it must be url encoded
		const authVerifier = createAuthVerifierAsBase64Url(userPassphraseKey)
		const authToken = base64ToBase64Url(uint8ArrayToBase64(sha256Hash(salt)))
		const sessionData = createCreateSessionData({
			accessKey: null,
			authToken,
			authVerifier,
			clientIdentifier,
			mailAddress: null,
			recoverCodeVerifier: null,
			user: userId,
		})
		let accessKey: Aes256Key | null = null

		if (persistentSession) {
			accessKey = aes256RandomKey()
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

	/**
	 * Derive a key given a KDF type, passphrase, and salt
	 */
	async deriveUserPassphraseKey({ kdfType, passphrase, salt }: PassphraseKeyData): Promise<AesKey> {
		switch (kdfType) {
			case KdfType.Bcrypt: {
				return generateKeyFromPassphraseBcrypt(passphrase, salt, KeyLength.b128)
			}
			case KdfType.Argon2id: {
				return this.argon2idFacade.generateKeyFromPassphrase(passphrase, salt)
			}
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
		await this.serviceExecutor
			.delete(SecondFactorAuthService, secondFactorAuthDeleteData)
			.catch(
				ofClass(NotFoundError, (e) => {
					// This can happen during some odd behavior in browser where main loop would be blocked by webauthn (hello, FF) and then we would try to
					// cancel too late. No harm here anyway if the session is already gone.
					console.warn("Tried to cancel second factor but it was not there anymore", e)
				}),
			)
			.catch(
				ofClass(LockedError, (e) => {
					// Might happen if we trigger cancel and confirm at the same time.
					console.warn("Tried to cancel second factor but it is currently locked", e)
				}),
			)
		this.loginRequestSessionId = null
		this.loggingInPromiseWrapper?.reject(new CancelledError("login cancelled"))
	}

	/** Finishes 2FA process either using second factor or approving session on another client. */
	async authenticateWithSecondFactor(data: SecondFactorAuthData, host?: string): Promise<void> {
		await this.serviceExecutor.post(SecondFactorAuthService, data, { baseUrl: host })
	}

	/**
	 * Resumes previously created session (using persisted credentials).
	 * @param credentials the saved credentials to use
	 * @param externalUserKeyDeriver information for deriving a key (if external user)
	 * @param databaseKey key to unlock the local database (if enabled)
	 * @param timeRangeDays the user configured time range for the offline database
	 */
	async resumeSession(
		credentials: Credentials,
		externalUserKeyDeriver: ExternalUserKeyDeriver | null,
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
			// synchronous login in order to load all the necessary keys and such
			// the next time they log in they will be able to do asynchronous login
			if (cacheInfo?.isPersistent && !cacheInfo.isNewOfflineDb) {
				const user = await this.entityClient.load(UserTypeRef, credentials.userId)
				if (user.accountType !== AccountType.PAID) {
					// if account is free do not start offline login/async login workflow.
					// await before return to catch errors here
					return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo).catch(
						ofClass(ConnectionError, async () => {
							await this.resetSession()
							return { type: "error", reason: ResumeSessionErrorReason.OfflineNotAvailableForFree }
						}),
					)
				}
				this.userFacade.setUser(user)

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
						return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo)
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
				return await this.finishResumeSession(credentials, externalUserKeyDeriver, cacheInfo)
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

	private async finishResumeSession(
		credentials: Credentials,
		externalUserKeyDeriver: ExternalUserKeyDeriver | null,
		cacheInfo: CacheInfo,
	): Promise<ResumeSessionSuccess> {
		const sessionId = this.getSessionId(credentials)
		const sessionData = await this.loadSessionData(credentials.accessToken)
		const encryptedPassword = base64ToUint8Array(assertNotNull(credentials.encryptedPassword, "encryptedPassword was null!"))
		const passphrase = utf8Uint8ArrayToString(aesDecrypt(assertNotNull(sessionData.accessKey, "no access key on session data!"), encryptedPassword))
		let userPassphraseKey: AesKey
		let kdfType: KdfType | null

		const isExternalUser = externalUserKeyDeriver != null

		if (isExternalUser) {
			await this.checkOutdatedExternalSalt(credentials, sessionData, externalUserKeyDeriver.salt)
			userPassphraseKey = await this.deriveUserPassphraseKey({ ...externalUserKeyDeriver, passphrase })
			kdfType = null
		} else {
			const passphraseData = await this.loadUserPassphraseKey(credentials.login, passphrase)
			userPassphraseKey = passphraseData.userPassphraseKey
			kdfType = passphraseData.kdfType
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

		// We only need to migrate the kdf in case an internal user resumes the session.
		if (kdfType && !this.isModernKdfType(kdfType)) {
			await this.migrateKdfType(KdfType.Argon2id, passphrase, user)
		} else if (!isExternalUser) {
			// We trigger group key rotation only for internal users.
			// If we have not migrated to argon2 we postpone key rotation until next login.
			await this.keyRotationFacade.loadPendingKeyRotations(user, userPassphraseKey)
		}

		return { type: "success", data }
	}

	private async initSession(
		userId: Id,
		accessToken: Base64Url,
		userPassphraseKey: AesKey,
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
			// We need to use up-to-date user to make sure that we are not checking for outdated verified against cached user.
			const user = await this.noncachingEntityClient.load(UserTypeRef, userId)
			await this.checkOutdatedVerifier(user, accessToken, userPassphraseKey)

			// this may be the second time we set user in case we had a partial offline login before
			// we do it unconditionally here, to make sure we unlock the latest user group key right below
			this.userFacade.setUser(user)
			const wasFullyLoggedIn = this.userFacade.isFullyLoggedIn()

			this.userFacade.unlockUserGroupKey(userPassphraseKey)
			const userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)

			await this.loadEntropy()

			// If we have been fully logged in at least once already (probably expired ephemeral session)
			// then we just reconnect and re-download missing events.
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
	private async checkOutdatedExternalSalt(
		credentials: Credentials,
		sessionData: {
			userId: Id
			accessKey: AesKey | null
		},
		externalUserSalt: Uint8Array,
	) {
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
	 * Check that the auth verifier is not changed e.g. due to the password change.
	 * Normally this won't happen for internal users as all sessions are closed on password change. This may happen for external users when the sender has
	 * changed the password.
	 * We do not delete all sessions on the server when changing the external password to avoid that an external user is immediately logged out.
	 *
	 * @param user Should be up-to-date, i.e., not loaded from cache, but fresh from the server, otherwise an outdated verifier will cause a logout.
	 */
	private async checkOutdatedVerifier(user: User, accessToken: string, userPassphraseKey: Aes128Key) {
		if (uint8ArrayToBase64(user.verifier) !== uint8ArrayToBase64(sha256Hash(createAuthVerifier(userPassphraseKey)))) {
			console.log("Auth verifier has changed")
			// delete the obsolete session to make sure it can not be used any more
			await this.deleteSession(accessToken).catch((e) => console.error("Could not delete session", e))
			await this.resetSession()
			throw new NotAuthenticatedError("Auth verifier has changed")
		}
	}

	private async loadUserPassphraseKey(mailAddress: string, passphrase: string): Promise<{ kdfType: KdfType; userPassphraseKey: AesKey }> {
		mailAddress = mailAddress.toLowerCase().trim()
		const saltRequest = createSaltData({ mailAddress })
		const saltReturn = await this.serviceExecutor.get(SaltService, saltRequest)
		const kdfType = asKdfType(saltReturn.kdfVersion)
		return {
			userPassphraseKey: await this.deriveUserPassphraseKey({ kdfType, passphrase, salt: saltReturn.salt }),
			kdfType,
		}
	}

	/**
	 * We use the accessToken that should be deleted for authentication. Therefore it can be invoked while logged in or logged out.
	 *
	 * @param pushIdentifier identifier associated with this device, if any, to delete PushIdentifier on the server
	 */
	async deleteSession(accessToken: Base64Url, pushIdentifier: string | null = null): Promise<void> {
		let path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken)
		const sessionTypeModel = await resolveTypeReference(SessionTypeRef)

		const headers = {
			accessToken: neverNull(accessToken),
			v: sessionTypeModel.version,
		}
		const queryParams: Dict = pushIdentifier == null ? {} : { pushIdentifier }
		return this.restClient
			.request(path, HttpMethod.DELETE, {
				headers,
				responseType: MediaType.Json,
				queryParams,
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
		accessKey: AesKey | null
	}> {
		const path = typeRefToPath(SessionTypeRef) + "/" + this.getSessionListId(accessToken) + "/" + this.getSessionElementId(accessToken)
		const SessionTypeModel = await resolveTypeReference(SessionTypeRef)

		let headers = {
			accessToken: accessToken,
			v: SessionTypeModel.version,
		}
		// we cannot use the entity client yet because this type is encrypted and we don't have an owner key yet
		return this.restClient
			.request(path, HttpMethod.GET, {
				headers,
				responseType: MediaType.Json,
			})
			.then((instance) => {
				let session = JSON.parse(instance)
				return {
					userId: session.user,
					accessKey: session.accessKey ? base64ToKey(session.accessKey) : null,
				}
			})
	}

	/**
	 * Loads entropy from the last logout.
	 */
	private async loadEntropy(): Promise<void> {
		const tutanotaProperties = await this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.userFacade.getUserGroupId())
		return this.entropyFacade.loadEntropy(tutanotaProperties)
	}

	/**
	 * Change password and/or KDF type for the current user. This will cause all other sessions to be closed.
	 * @return New password encrypted with accessKey if this is a persistent session or {@code null}  if it's an ephemeral one.
	 */
	async changePassword(currentPasswordKeyData: PassphraseKeyData, newPasswordKeyDataTemplate: Omit<PassphraseKeyData, "salt">): Promise<Base64 | null> {
		const currentUserPassphraseKey = await this.deriveUserPassphraseKey(currentPasswordKeyData)
		const currentAuthVerifier = createAuthVerifier(currentUserPassphraseKey)
		const newPasswordKeyData = { ...newPasswordKeyDataTemplate, salt: generateRandomSalt() }

		const newUserPassphraseKey = await this.deriveUserPassphraseKey(newPasswordKeyData)
		const pwEncUserGroupKey = encryptKey(newUserPassphraseKey, this.userFacade.getCurrentUserGroupKey().object)
		const authVerifier = createAuthVerifier(newUserPassphraseKey)
		const service = createChangePasswordData({
			code: null,
			kdfVersion: newPasswordKeyDataTemplate.kdfType,
			oldVerifier: currentAuthVerifier,
			pwEncUserGroupKey: pwEncUserGroupKey,
			recoverCodeVerifier: null,
			salt: newPasswordKeyData.salt,
			verifier: authVerifier,
		})

		await this.serviceExecutor.post(ChangePasswordService, service)

		this.userFacade.setUserGroupKeyDistributionKey(newUserPassphraseKey)
		const accessToken = assertNotNull(this.userFacade.getAccessToken())
		const sessionData = await this.loadSessionData(accessToken)
		if (sessionData.accessKey != null) {
			// if we have an accessKey, this means we are storing the encrypted password locally, in which case we need to store the new one
			return uint8ArrayToBase64(encryptString(sessionData.accessKey, newPasswordKeyDataTemplate.passphrase))
		} else {
			return null
		}
	}

	async deleteAccount(password: string, takeover: string, surveyData: SurveyData | null = null): Promise<void> {
		const userSalt = assertNotNull(this.userFacade.getLoggedInUser().salt)

		const passphraseKeyData = {
			kdfType: asKdfType(this.userFacade.getLoggedInUser().kdfVersion),
			passphrase: password,
			salt: userSalt,
		}
		const passwordKey = await this.deriveUserPassphraseKey(passphraseKeyData)
		const deleteCustomerData = createDeleteCustomerData({
			authVerifier: createAuthVerifier(passwordKey),
			reason: null,
			takeoverMailAddress: null,
			undelete: false,
			customer: neverNull(neverNull(this.userFacade.getLoggedInUser()).customer),
			surveyData: surveyData,
		})

		if (takeover !== "") {
			deleteCustomerData.takeoverMailAddress = takeover
		} else {
			deleteCustomerData.takeoverMailAddress = null
		}
		await this.serviceExecutor.delete(CustomerService, deleteCustomerData)
	}

	/** Changes user password to another one using recoverCode instead of the old password. */
	async recoverLogin(mailAddress: string, recoverCode: string, newPassword: string, clientIdentifier: string): Promise<void> {
		const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
		const recoverCodeVerifier = createAuthVerifier(recoverCodeKey)
		const recoverCodeVerifierBase64 = base64ToBase64Url(uint8ArrayToBase64(recoverCodeVerifier))
		const sessionData = createCreateSessionData({
			accessKey: null,
			authToken: null,
			authVerifier: null,
			clientIdentifier: clientIdentifier,
			mailAddress: mailAddress.toLowerCase().trim(),
			recoverCodeVerifier: recoverCodeVerifierBase64,
			user: null,
		})
		// we need a separate entity rest client because to avoid caching of the user instance which is updated on password change. the web socket is not connected because we
		// don't do a normal login, and therefore we would not get any user update events. we can not use permanentLogin=false with initSession because caching would be enabled,
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
		const createSessionReturn = await this.serviceExecutor.post(SessionService, sessionData) // Don't pass email address to avoid proposing to reset second factor when we're resetting password

		const { userId, accessToken } = await this.waitUntilSecondFactorApprovedOrCancelled(createSessionReturn, null)
		const user = await entityClient.load(UserTypeRef, userId, undefined, {
			accessToken,
		})
		if (user.auth == null || user.auth.recoverCode == null) {
			throw new Error("missing recover code")
		}
		const recoverCodeExtraHeaders = {
			accessToken,
			recoverCodeVerifier: recoverCodeVerifierBase64,
		}

		const recoverCodeData = await entityClient.load(RecoverCodeTypeRef, user.auth.recoverCode, undefined, recoverCodeExtraHeaders)
		try {
			const groupKey = aes256DecryptWithRecoveryKey(recoverCodeKey, recoverCodeData.recoverCodeEncUserGroupKey)
			const salt = generateRandomSalt()
			const newKdfType = DEFAULT_KDF_TYPE

			const newPassphraseKeyData = { kdfType: newKdfType, passphrase: newPassword, salt }
			const userPassphraseKey = await this.deriveUserPassphraseKey(newPassphraseKeyData)
			const pwEncUserGroupKey = encryptKey(userPassphraseKey, groupKey)
			const newPasswordVerifier = createAuthVerifier(userPassphraseKey)
			const postData = createChangePasswordData({
				code: null,
				kdfVersion: newKdfType,
				oldVerifier: null,
				salt: salt,
				pwEncUserGroupKey: pwEncUserGroupKey,
				verifier: newPasswordVerifier,
				recoverCodeVerifier: recoverCodeVerifier,
			})

			const extraHeaders = {
				accessToken,
			}
			await this.serviceExecutor.post(ChangePasswordService, postData, { extraHeaders })
		} finally {
			this.deleteSession(accessToken)
		}
	}

	/** Deletes second factors using recoverCode as second factor. */
	resetSecondFactors(mailAddress: string, password: string, recoverCode: Hex): Promise<void> {
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn.userPassphraseKey)
			const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
			const recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey)
			const deleteData = createResetFactorsDeleteData({
				mailAddress,
				authVerifier,
				recoverCodeVerifier,
			})
			return this.serviceExecutor.delete(ResetFactorsService, deleteData)
		})
	}

	takeOverDeletedAddress(mailAddress: string, password: string, recoverCode: Hex | null, targetAccountMailAddress: string): Promise<void> {
		return this.loadUserPassphraseKey(mailAddress, password).then((passphraseReturn) => {
			const authVerifier = createAuthVerifierAsBase64Url(passphraseReturn.userPassphraseKey)
			let recoverCodeVerifier: Base64 | null = null

			if (recoverCode) {
				const recoverCodeKey = uint8ArrayToBitArray(hexToUint8Array(recoverCode))
				recoverCodeVerifier = createAuthVerifierAsBase64Url(recoverCodeKey)
			}

			let data = createTakeOverDeletedAddressData({
				mailAddress,
				authVerifier,
				recoverCodeVerifier,
				targetAccountMailAddress,
			})
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

	async rotateKeysIfNeeded() {
		await this.keyRotationFacade.processPendingKeyRotation()
	}
}
