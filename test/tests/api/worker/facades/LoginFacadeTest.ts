import o from "ospec"
import {LoginFacadeImpl} from "../../../../../src/api/worker/facades/LoginFacade.js"
import {RestClient} from "../../../../../src/api/worker/rest/RestClient.js"
import {WorkerImpl} from "../../../../../src/api/worker/WorkerImpl.js"
import {InstanceMapper} from "../../../../../src/api/worker/crypto/InstanceMapper.js"
import {EntityClient} from "../../../../../src/api/common/EntityClient.js"
import {CryptoFacade, encryptString} from "../../../../../src/api/worker/crypto/CryptoFacade.js"
import {LateInitializedCacheStorage} from "../../../../../src/api/worker/rest/CacheStorageProxy.js"
import {func, instance, matchers, object, verify, when} from "testdouble"
import {SessionType} from "../../../../../src/api/common/SessionType.js"
import {HttpMethod} from "../../../../../src/api/common/EntityFunctions.js"
import {createCreateSessionReturn} from "../../../../../src/api/entities/sys/TypeRefs.js"
import type {SecondFactorAuthHandler} from "../../../../../src/misc/2fa/SecondFactorHandler.js"
import {createSaltReturn} from "../../../../../src/api/entities/sys/TypeRefs.js"
import {createUser, UserTypeRef} from "../../../../../src/api/entities/sys/TypeRefs.js"
import {createAuthVerifier, encryptKey, generateKeyFromPassphrase, KeyLength, keyToBase64, sha256Hash} from "@tutao/tutanota-crypto"
import {createGroupMembership} from "../../../../../src/api/entities/sys/TypeRefs.js"
import {createTutanotaProperties, TutanotaPropertiesTypeRef} from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import {Indexer} from "../../../../../src/api/worker/search/Indexer.js"
import {EventBusClient} from "../../../../../src/api/worker/EventBusClient.js"
import {Credentials} from "../../../../../src/misc/credentials/Credentials.js"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {IServiceExecutor} from "../../../../../src/api/common/ServiceRequest.js"
import {SaltService, SessionService} from "../../../../../src/api/entities/sys/Services.js"

const {anything} = matchers

const SALT = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

function makeUser({id, passphrase, salt}) {

	const userPassphraseKey = generateKeyFromPassphrase(passphrase, salt, KeyLength.b128)

	const groupKey = encryptKey(userPassphraseKey, [3229306880, 2716953871, 4072167920, 3901332676])

	return createUser({
		_id: id,
		verifier: sha256Hash(createAuthVerifier(userPassphraseKey)),
		userGroup: createGroupMembership({
			group: "groupId",
			symEncGKey: groupKey
		})
	})
}

o.spec("LoginFacadeTest", function () {

	let facade: LoginFacadeImpl
	let workerMock: WorkerImpl
	let serviceExecutor: IServiceExecutor
	let restClientMock: RestClient
	let entityClientMock: EntityClient
	let secondFactorAuthHandlerMock: SecondFactorAuthHandler
	let instanceMapperMock: InstanceMapper
	let cryptoFacadeMock: CryptoFacade
	let initializeCacheStorageMock: LateInitializedCacheStorage["initialize"]
	let indexerMock: Indexer
	let eventBusClientMock: EventBusClient
	let usingOfflineStorage: boolean

	o.beforeEach(function () {

		workerMock = instance(WorkerImpl)
		serviceExecutor = object()
		when(serviceExecutor.get(SaltService, anything()), {ignoreExtraArgs: true})
			.thenResolve(createSaltReturn({salt: SALT}))

		restClientMock = instance(RestClient)
		entityClientMock = instance(EntityClient)
		when(entityClientMock.loadRoot(TutanotaPropertiesTypeRef, anything())).thenResolve(createTutanotaProperties())

		secondFactorAuthHandlerMock = object<SecondFactorAuthHandler>()
		instanceMapperMock = instance(InstanceMapper)
		cryptoFacadeMock = object<CryptoFacade>()
		initializeCacheStorageMock = func() as LateInitializedCacheStorage["initialize"]
		usingOfflineStorage = false

		facade = new LoginFacadeImpl(
			workerMock,
			restClientMock,
			entityClientMock,
			secondFactorAuthHandlerMock,
			instanceMapperMock,
			() => cryptoFacadeMock,
			initializeCacheStorageMock,
			serviceExecutor,
			async () => usingOfflineStorage,
		)

		indexerMock = instance(Indexer)
		eventBusClientMock = instance(EventBusClient)

		facade.init(indexerMock, eventBusClientMock)
	})

	o.spec("Creating new sessions", function () {
		o.spec("initializing cache storage", function () {
			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"

			o.beforeEach(function () {
				when(serviceExecutor.post(SessionService, anything()), {ignoreExtraArgs: true})
					.thenResolve(createCreateSessionReturn({user: userId, accessToken: "accessToken", challenges: []}))
				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(makeUser({
					id: userId,
					passphrase,
					salt: SALT,
				}))
			})

			o("When a database key is provided and offline is disabled, storage is initialized as ephemeral", async function () {
				usingOfflineStorage = false
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, dbKey)
				verify(initializeCacheStorageMock({persistent: false}))
			})
			o("When a database key is provided and offline is enabled, storage is initialized as persistent", async function () {
				usingOfflineStorage = true
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, dbKey)
				verify(initializeCacheStorageMock({persistent: true, databaseKey: dbKey, userId: userId}))
			})
			o("When no database key is provided and offline is enabled, storage is initialized as ephemeral", async function () {
				usingOfflineStorage = true
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, null)
				verify(initializeCacheStorageMock({persistent: false}))
			})
			o("When no database key is provided and offline is disabled, storage is initialized as ephemeral", async function () {
				usingOfflineStorage = false
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, null)
				verify(initializeCacheStorageMock({persistent: false}))
			})
		})
	})

	o.spec("Resuming existing sessions", function () {
		o.spec("initializing cache storage", function () {

			const dbKey = new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4])
			const passphrase = "hunter2"
			const userId = "userId"
			const accessKey = [3229306880, 2716953871, 4072167920, 3901332677]
			const accessToken = "accessToken"

			let credentials: Credentials

			const user = makeUser({
				id: userId,
				passphrase,
				salt: SALT,
			})

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
					type: "internal"
				} as Credentials

				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)

				// The call to /sys/session/...
				when(restClientMock.request(anything(), HttpMethod.GET, anything()))
					.thenResolve(JSON.stringify({user: userId, accessKey: keyToBase64(accessKey)}))
			})

			o("When resuming a session and there is a database key and offline storage is enabled, a persistent storage is created", async function () {
				usingOfflineStorage = true
				await facade.resumeSession(credentials, SALT, dbKey)
				verify(initializeCacheStorageMock({persistent: true, databaseKey: dbKey, userId: userId}))
			})
			o("When resuming a session and there is a database key and offline storage is disabled, a ephemeral storage is created", async function () {
				usingOfflineStorage = false
				await facade.resumeSession(credentials, SALT, dbKey)
				verify(initializeCacheStorageMock({persistent:false}))
			})
			o("When resuming a session and there is no database key and offline storage is enabled, a non-persistent storage is created", async function () {
				usingOfflineStorage = true
				await facade.resumeSession(credentials, SALT, null)
				verify(initializeCacheStorageMock({persistent: false}))
			})
			o("When resuming a session and there is no database key and offline storage is disabled, a non-persistent storage is created", async function () {
				usingOfflineStorage = false
				await facade.resumeSession(credentials, SALT, null)
				verify(initializeCacheStorageMock({persistent: false}))
			})
		})
	})
})