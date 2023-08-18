import o from "@tutao/otest"
import td, { instance, matchers, object, when } from "testdouble"
import {
	createCreateSessionReturn,
	createGroupInfo,
	createGroupMembership,
	createSaltReturn,
	createUser,
	createUserExternalAuthInfo,
	GroupInfoTypeRef,
	User,
	UserTypeRef,
} from "../../../../../src/api/entities/sys/TypeRefs"
import { createAuthVerifier, encryptKey, keyToBase64, sha256Hash } from "@tutao/tutanota-crypto"
import { LoginFacade, LoginListener, ResumeSessionErrorReason } from "../../../../../src/api/worker/facades/LoginFacade"
import { IServiceExecutor } from "../../../../../src/api/common/ServiceRequest"
import { EntityClient } from "../../../../../src/api/common/EntityClient"
import { RestClient } from "../../../../../src/api/worker/rest/RestClient"
import { WorkerImpl } from "../../../../../src/api/worker/WorkerImpl"
import { InstanceMapper } from "../../../../../src/api/worker/crypto/InstanceMapper"
import { CryptoFacade, encryptString } from "../../../../../src/api/worker/crypto/CryptoFacade"
import { CacheStorageLateInitializer } from "../../../../../src/api/worker/rest/CacheStorageProxy"
import { UserFacade } from "../../../../../src/api/worker/facades/UserFacade"
import { SaltService, SessionService } from "../../../../../src/api/entities/sys/Services"
import { Credentials } from "../../../../../src/misc/credentials/Credentials"
import { defer, DeferredObject, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { AccountType, KdfType } from "../../../../../src/api/common/TutanotaConstants"
import { AccessExpiredError, ConnectionError, NotAuthenticatedError } from "../../../../../src/api/common/error/RestError"
import { SessionType } from "../../../../../src/api/common/SessionType"
import { HttpMethod } from "../../../../../src/api/common/EntityFunctions"
import { ConnectMode, EventBusClient } from "../../../../../src/api/worker/EventBusClient"
import { createTutanotaProperties, TutanotaPropertiesTypeRef } from "../../../../../src/api/entities/tutanota/TypeRefs"
import { BlobAccessTokenFacade } from "../../../../../src/api/worker/facades/BlobAccessTokenFacade.js"
import { EntropyFacade } from "../../../../../src/api/worker/facades/EntropyFacade.js"
import { DatabaseKeyFactory } from "../../../../../src/misc/credentials/DatabaseKeyFactory.js"

const { anything } = matchers

/** Verify using testdouble, but register as an ospec assertion */
export function verify(demonstration: any, config?: td.VerificationConfig) {
	function check(demonstration) {
		try {
			td.verify(demonstration, config)
			return {
				pass: true,
				message: "Successful verification",
			}
		} catch (e) {
			return {
				pass: false,
				message: e.toString(),
			}
		}
	}

	o(demonstration).satisfies(check)
}

const SALT = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

async function makeUser({ id, passphrase, salt }, facade: LoginFacade): Promise<User> {
	const userPassphraseKey = await facade.deriveUserPassphraseKey(KdfType.Bcrypt, passphrase, salt)

	const groupKey = encryptKey(userPassphraseKey, [3229306880, 2716953871, 4072167920, 3901332676])

	return createUser({
		_id: id,
		verifier: sha256Hash(createAuthVerifier(userPassphraseKey)),
		userGroup: createGroupMembership({
			group: "groupId",
			symEncGKey: groupKey,
			groupInfo: ["groupInfoListId", "groupInfoElId"],
		}),
		externalAuthInfo: createUserExternalAuthInfo({
			latestSaltHash: SALT,
		}),
	})
}

o.spec("LoginFacadeTest", function () {
	let facade: LoginFacade
	let workerMock: WorkerImpl
	let serviceExecutor: IServiceExecutor
	let restClientMock: RestClient
	let entityClientMock: EntityClient
	let loginListener: LoginListener
	let instanceMapperMock: InstanceMapper
	let cryptoFacadeMock: CryptoFacade
	let cacheStorageInitializerMock: CacheStorageLateInitializer
	let eventBusClientMock: EventBusClient
	let usingOfflineStorage: boolean
	let userFacade: UserFacade
	let entropyFacade: EntropyFacade
	let blobAccessTokenFacade: BlobAccessTokenFacade
	let databaseKeyFactoryMock: DatabaseKeyFactory

	const timeRangeDays = 42

	o.beforeEach(function () {
		workerMock = instance(WorkerImpl)
		serviceExecutor = object()
		when(serviceExecutor.get(SaltService, anything()), { ignoreExtraArgs: true }).thenResolve(createSaltReturn({ salt: SALT }))

		restClientMock = instance(RestClient)
		entityClientMock = instance(EntityClient)
		when(entityClientMock.loadRoot(TutanotaPropertiesTypeRef, anything())).thenResolve(createTutanotaProperties())

		loginListener = object<LoginListener>()
		instanceMapperMock = instance(InstanceMapper)
		cryptoFacadeMock = object<CryptoFacade>()
		usingOfflineStorage = false
		cacheStorageInitializerMock = object()
		when(
			cacheStorageInitializerMock.initialize({
				userId: anything(),
				databaseKey: anything(),
				timeRangeDays: anything(),
				forceNewDatabase: anything(),
				type: "offline",
			}),
		).thenDo(async () => {
			return {
				isPersistent: usingOfflineStorage,
				isNewOfflineDb: false,
			}
		})
		when(cacheStorageInitializerMock.initialize({ userId: anything() as Id, type: "ephemeral" })).thenResolve({
			isPersistent: false,
			isNewOfflineDb: false,
		})
		userFacade = object()
		entropyFacade = object()
		databaseKeyFactoryMock = object()

		facade = new LoginFacade(
			workerMock,
			restClientMock,
			entityClientMock,
			loginListener,
			instanceMapperMock,
			cryptoFacadeMock,
			cacheStorageInitializerMock,
			serviceExecutor,
			userFacade,
			blobAccessTokenFacade,
			entropyFacade,
			databaseKeyFactoryMock,
		)

		eventBusClientMock = instance(EventBusClient)

		facade.init(eventBusClientMock)
	})

	o.spec("Creating new sessions", function () {
		o.spec("initializing cache storage", function () {
			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"

			o.beforeEach(async function () {
				when(serviceExecutor.post(SessionService, anything()), { ignoreExtraArgs: true }).thenResolve(
					createCreateSessionReturn({ user: userId, accessToken: "accessToken", challenges: [] }),
				)
				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(
					await makeUser(
						{
							id: userId,
							passphrase,
							salt: SALT,
						},
						facade,
					),
				)
			})

			o("When a database key is provided and session is persistent it is passed to the offline storage initializer", async function () {
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, dbKey)
				verify(cacheStorageInitializerMock.initialize({ type: "offline", databaseKey: dbKey, userId, timeRangeDays: null, forceNewDatabase: false }))
				verify(databaseKeyFactoryMock.generateKey(), { times: 0 })
			})
			o("When no database key is provided and session is persistent, a key is generated and we attempt offline db init", async function () {
				const databaseKey = Uint8Array.from([1, 2, 3, 4])
				when(databaseKeyFactoryMock.generateKey()).thenResolve(databaseKey)
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, null)
				verify(cacheStorageInitializerMock.initialize({ type: "offline", userId, databaseKey, timeRangeDays: null, forceNewDatabase: true }))
				verify(databaseKeyFactoryMock.generateKey(), { times: 1 })
			})
			o("When no database key is provided and session is Login, nothing is passed to the offline storage initialzier", async function () {
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Login, null)
				verify(cacheStorageInitializerMock.initialize({ type: "ephemeral", userId }))
				verify(databaseKeyFactoryMock.generateKey(), { times: 0 })
			})
		})
	})

	o.spec("Resuming existing sessions", function () {
		o.spec("initializing cache storage", async function () {
			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"
			const accessKey = [3229306880, 2716953871, 4072167920, 3901332677]
			const accessToken = "accessToken"

			let credentials: Credentials

			const user = await makeUser(
				{
					id: userId,
					passphrase,
					salt: SALT,
				},
				facade,
			)

			o.beforeEach(function () {
				credentials = {
					/**
					 * Identifier which we use for logging in.
					 * Email address used to log in for internal users, userId for external users.
					 * */
					login: "born.slippy@tuta.io",

					/** Session#accessKey encrypted password. Is set when session is persisted. */
					encryptedPassword: uint8ArrayToBase64(encryptString(accessKey, passphrase)), // We can't call encryptString in the top level of spec because `random` isn't initialized yet
					accessToken,
					userId,
					type: "internal",
				} as Credentials

				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)

				// The call to /sys/session/...
				when(
					restClientMock.request(
						matchers.argThat((path) => typeof path === "string" && path.startsWith("/rest/sys/session/")),
						HttpMethod.GET,
						anything(),
					),
				).thenResolve(JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) }))
			})

			o("When resuming a session and there is a database key, it is passed to offline storage initialization", async function () {
				usingOfflineStorage = true
				await facade.resumeSession(credentials, null, dbKey, timeRangeDays)
				verify(cacheStorageInitializerMock.initialize({ type: "offline", databaseKey: dbKey, userId, timeRangeDays, forceNewDatabase: false }))
			})
			o("When resuming a session and there is no database key, nothing is passed to offline storage initialization", async function () {
				usingOfflineStorage = true
				await facade.resumeSession(credentials, null, null, timeRangeDays)
				verify(cacheStorageInitializerMock.initialize({ type: "ephemeral", userId }))
			})
			o("when resuming a session and the offline initialization has created a new database, we do synchronous login", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.PAID
				when(
					cacheStorageInitializerMock.initialize({ type: "offline", databaseKey: dbKey, userId, timeRangeDays, forceNewDatabase: false }),
				).thenResolve({
					isPersistent: true,
					isNewOfflineDb: true,
				})

				await facade.resumeSession(credentials, null, dbKey, timeRangeDays)

				o(facade.asyncLoginState).deepEquals({ state: "idle" })("Synchronous login occured, so once resume returns we have already logged in")
			})
			o("when resuming a session and the offline initialization has an existing database, we do async login", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.PAID

				when(
					cacheStorageInitializerMock.initialize({ type: "offline", databaseKey: dbKey, userId, timeRangeDays, forceNewDatabase: false }),
				).thenResolve({
					isPersistent: true,
					isNewOfflineDb: false,
				})

				await facade.resumeSession(credentials, null, dbKey, timeRangeDays)

				o(facade.asyncLoginState).deepEquals({ state: "running" })("Async login occurred so it is still running")
			})
			o("when resuming a session and a notauthenticatedError is thrown, the offline db is deleted", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.FREE
				when(
					restClientMock.request(
						matchers.argThat((path) => path.startsWith("/rest/sys/session/")),
						HttpMethod.GET,
						anything(),
					),
				).thenReject(new NotAuthenticatedError("not your cheese"))

				await o(() =>
					facade.resumeSession(
						credentials,
						{
							salt: SALT,
							kdfType: KdfType.Bcrypt,
						},
						dbKey,
						timeRangeDays,
					),
				).asyncThrows(NotAuthenticatedError)
				verify(cacheStorageInitializerMock.deInitialize())
			})
		})

		o.spec("account type combinations", async function () {
			let credentials: Credentials
			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"
			const accessKey = [3229306880, 2716953871, 4072167920, 3901332677]
			const accessToken = "accessToken"
			const user = await makeUser(
				{
					id: userId,
					passphrase,
					salt: SALT,
				},
				facade,
			)
			let calls: string[]
			let fullLoginDeferred: DeferredObject<void>

			o.beforeEach(function () {
				credentials = {
					/**
					 * Identifier which we use for logging in.
					 * Email address used to log in for internal users, userId for external users.
					 * */
					login: "born.slippy@tuta.io",

					/** Session#accessKey encrypted password. Is set when session is persisted. */
					encryptedPassword: uint8ArrayToBase64(encryptString(accessKey, passphrase)), // We can't call encryptString in the top level of spec because `random` isn't initialized yet
					accessToken,
					userId,
					type: "internal",
				} as Credentials

				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)

				// // The call to /sys/session/...
				// when(restClientMock.request(anything(), HttpMethod.GET, anything()))
				// 	.thenResolve(JSON.stringify({user: userId, accessKey: keyToBase64(accessKey)}))

				calls = []
				// .thenReturn(sessionServiceDefer)
				when(userFacade.setUser(anything())).thenDo(() => {
					calls.push("setUser")
				})
				when(userFacade.isPartiallyLoggedIn()).thenDo(() => calls.includes("setUser"))

				fullLoginDeferred = defer()
				when(loginListener.onFullLoginSuccess(matchers.anything(), matchers.anything())).thenDo(() => fullLoginDeferred.resolve())
			})

			o("When using offline as a free user and with stable connection, login sync", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.FREE
				await testSuccessfulSyncLogin()
			})

			o("When using offline as a free user with unstable connection, no offline for free users", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.FREE
				when(restClientMock.request(anything(), HttpMethod.GET, anything())).thenDo(async () => {
					calls.push("sessionService")
					throw new ConnectionError("Oopsie 1")
				})

				const result = await facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays).finally(() => {
					calls.push("return")
				})

				o(result).deepEquals({ type: "error", reason: ResumeSessionErrorReason.OfflineNotAvailableForFree })
				o(calls).deepEquals(["sessionService", "return"])
			})

			o("When using offline as premium user with stable connection, async login", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.PAID
				when(restClientMock.request(anything(), HttpMethod.GET, anything())).thenDo(async () => {
					calls.push("sessionService")
					return JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) })
				})

				const deferred = defer()
				when(loginListener.onFullLoginSuccess(matchers.anything(), matchers.anything())).thenDo(() => deferred.resolve(null))

				const result = await facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)

				o(result.type).equals("success")

				await deferred.promise

				// we would love to prove that part of the login is done async but without injecting some asyncExecutor it's a bit tricky to do
				o(calls).deepEquals(["setUser", "sessionService"])

				// just wait for the async login to not bleed into other test cases or to not randomly fail
				await fullLoginDeferred.promise
			})

			o("When using offline as premium user with unstable connection, async login with later retry", async function () {
				usingOfflineStorage = true
				user.accountType = AccountType.PAID
				const connectionError = new ConnectionError("Oopsie 2")
				when(restClientMock.request(anything(), HttpMethod.GET, anything())).thenDo(async () => {
					calls.push("sessionService")
					throw connectionError
				})

				const deferred = defer()
				when(loginListener.onPartialLoginSuccess()).thenDo(() => deferred.resolve(null))

				const result = await facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)

				await deferred.promise

				o(result.type).equals("success")
				o(calls).deepEquals(["setUser", "sessionService"])

				// Did not finish login
				verify(userFacade.unlockUserGroupKey(anything()), { times: 0 })
			})

			o("When not using offline as free user with connection, sync login", async function () {
				usingOfflineStorage = false
				user.accountType = AccountType.FREE
				await testSuccessfulSyncLogin()
			})

			o("When not using offline as free user with unstable connection, sync login with connection error", async function () {
				usingOfflineStorage = false
				user.accountType = AccountType.FREE
				await testConnectionFailingSyncLogin()
			})

			o("When not using offline as premium user with stable connection, sync login", async function () {
				usingOfflineStorage = false
				user.accountType = AccountType.PAID
				await testSuccessfulSyncLogin()
			})
			o("When not using offline as premium with unstable connection, sync login with connection error", async function () {
				usingOfflineStorage = false
				user.accountType = AccountType.PAID
				await testConnectionFailingSyncLogin()
			})

			async function testSuccessfulSyncLogin() {
				when(restClientMock.request(anything(), HttpMethod.GET, anything())).thenDo(async () => {
					calls.push("sessionService")
					return JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) })
				})

				await facade
					.resumeSession(credentials, user.salt == null ? null : { salt: user.salt, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)
					.finally(() => {
						calls.push("return")
					})
				o(calls).deepEquals(["sessionService", "setUser", "return"])
			}

			async function testConnectionFailingSyncLogin() {
				when(restClientMock.request(anything(), HttpMethod.GET, anything())).thenDo(async () => {
					calls.push("sessionService")
					throw new ConnectionError("Oopsie 3")
				})

				await o(() => facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)).asyncThrows(
					ConnectionError,
				)
				o(calls).deepEquals(["sessionService"])
			}
		})

		o.spec("async login", async function () {
			let credentials: Credentials
			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"
			const accessKey = [3229306880, 2716953871, 4072167920, 3901332677]
			const accessToken = "accessToken"
			const user = await makeUser(
				{
					id: userId,
					passphrase,
					salt: SALT,
				},
				facade,
			)
			let calls: string[]
			let fullLoginDeferred: DeferredObject<void>

			o.beforeEach(function () {
				usingOfflineStorage = true
				user.accountType = AccountType.PAID

				credentials = {
					/**
					 * Identifier which we use for logging in.
					 * Email address used to log in for internal users, userId for external users.
					 * */
					login: "born.slippy@tuta.io",

					/** Session#accessKey encrypted password. Is set when session is persisted. */
					encryptedPassword: uint8ArrayToBase64(encryptString(accessKey, passphrase)), // We can't call encryptString in the top level of spec because `random` isn't initialized yet
					accessToken,
					userId,
					type: "internal",
				} as Credentials

				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)

				// // The call to /sys/session/...
				// when(restClientMock.request(anything(), HttpMethod.GET, anything()))
				// 	.thenResolve(JSON.stringify({user: userId, accessKey: keyToBase64(accessKey)}))

				calls = []
				// .thenReturn(sessionServiceDefer)
				when(userFacade.setUser(anything())).thenDo(() => {
					calls.push("setUser")
				})
				when(userFacade.isPartiallyLoggedIn()).thenDo(() => calls.includes("setUser"))

				fullLoginDeferred = defer()
				when(loginListener.onFullLoginSuccess(matchers.anything(), matchers.anything())).thenDo(() => fullLoginDeferred.resolve())
			})

			o("When successfully logged in, userFacade is initialised", async function () {
				const groupInfo = createGroupInfo()
				when(entityClientMock.load(GroupInfoTypeRef, user.userGroup.groupInfo)).thenResolve(groupInfo)
				when(restClientMock.request(matchers.contains("sys/session"), HttpMethod.GET, anything())).thenResolve(
					JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) }),
				)

				await facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)

				await fullLoginDeferred.promise

				verify(userFacade.setAccessToken("accessToken"))
				verify(userFacade.unlockUserGroupKey(matchers.anything()))
				verify(eventBusClientMock.connect(ConnectMode.Initial))
			})

			o("when retrying failed login, userFacade is initialized", async function () {
				const deferred = defer()
				when(loginListener.onLoginFailure(matchers.anything())).thenDo(() => deferred.resolve(null))

				const groupInfo = createGroupInfo()
				when(entityClientMock.load(GroupInfoTypeRef, user.userGroup.groupInfo)).thenResolve(groupInfo)
				const connectionError = new ConnectionError("test")
				when(userFacade.isFullyLoggedIn()).thenReturn(false)

				when(restClientMock.request(matchers.contains("sys/session"), HttpMethod.GET, anything()))
					// @ts-ignore
					// the type definitions for testdouble are lacking, but we can do this
					.thenReturn(Promise.reject(connectionError), Promise.resolve(JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) })))

				await facade.resumeSession(credentials, { salt: user.salt!, kdfType: KdfType.Bcrypt }, dbKey, timeRangeDays)

				verify(userFacade.setAccessToken("accessToken"))
				verify(userFacade.unlockUserGroupKey(anything()), { times: 0 })
				verify(userFacade.unlockUserGroupKey(matchers.anything()), { times: 0 })
				verify(eventBusClientMock.connect(ConnectMode.Initial), { times: 0 })

				await deferred.promise

				await facade.retryAsyncLogin()

				await fullLoginDeferred.promise

				verify(userFacade.setAccessToken("accessToken"))
				verify(userFacade.unlockUserGroupKey(matchers.anything()))
				verify(eventBusClientMock.connect(ConnectMode.Initial))
			})
		})

		o.spec("external sessions", function () {
			const passphrase = "hunter2"
			const userId = "userId"
			const accessKey = [3229306880, 2716953871, 4072167920, 3901332677]
			const accessToken = "accessToken"
			let user: User

			let credentials: Credentials

			o.beforeEach(async function () {
				credentials = {
					/**
					 * Identifier which we use for logging in.
					 * Email address used to log in for internal users, userId for external users.
					 * */
					login: userId,

					/** Session#accessKey encrypted password. Is set when session is persisted. */
					encryptedPassword: uint8ArrayToBase64(encryptString(accessKey, passphrase)), // We can't call encryptString in the top level of spec because `random` isn't initialized yet
					accessToken,
					userId,
					type: "internal",
				} as Credentials

				user = await makeUser(
					{
						id: userId,
						passphrase,
						salt: SALT,
					},
					facade,
				)
				user.externalAuthInfo = createUserExternalAuthInfo({
					latestSaltHash: sha256Hash(SALT),
				})

				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)

				when(restClientMock.request(matchers.contains("sys/session"), HttpMethod.GET, anything())).thenResolve(
					JSON.stringify({ user: userId, accessKey: keyToBase64(accessKey) }),
				)
			})

			o("when the salt is not outdated, login works", async function () {
				const result = await facade.resumeSession(credentials, { salt: SALT, kdfType: KdfType.Bcrypt }, null, timeRangeDays)

				o(result.type).equals("success")
			})

			o("when the salt is outdated, AccessExpiredError is thrown", async function () {
				user.externalAuthInfo!.latestSaltHash = new Uint8Array([1, 2, 3])

				await o(() => facade.resumeSession(credentials, { salt: SALT, kdfType: KdfType.Bcrypt }, null, timeRangeDays)).asyncThrows(AccessExpiredError)
				verify(restClientMock.request(matchers.contains("sys/session"), HttpMethod.DELETE, anything()), { times: 0 })
			})

			o("when the password is outdated, NotAuthenticatedError is thrown", async function () {
				user.verifier = new Uint8Array([1, 2, 3])
				when(restClientMock.request(matchers.contains("sys/session"), HttpMethod.DELETE, anything())).thenResolve(null)

				await o(() =>
					facade.resumeSession(
						credentials,
						{
							salt: SALT,
							kdfType: KdfType.Bcrypt,
						},
						null,
						timeRangeDays,
					),
				).asyncThrows(NotAuthenticatedError)
				verify(restClientMock.request(matchers.contains("sys/session"), HttpMethod.DELETE, anything()))
			})
		})
	})
})
