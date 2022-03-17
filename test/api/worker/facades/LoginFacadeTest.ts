import o from "ospec"
import {LoginFacadeImpl} from "../../../../src/api/worker/facades/LoginFacade"
import {RestClient} from "../../../../src/api/worker/rest/RestClient"
import {WorkerImpl} from "../../../../src/api/worker/WorkerImpl"
import {InstanceMapper} from "../../../../src/api/worker/crypto/InstanceMapper"
import {EntityClient} from "../../../../src/api/common/EntityClient"
import {CryptoFacade, encryptString} from "../../../../src/api/worker/crypto/CryptoFacade"
import {LateInitializedCacheStorage} from "../../../../src/api/worker/rest/CacheStorageProxy"
import {func, instance, matchers, object, verify, when} from "testdouble"
import {SessionType} from "../../../../src/api/common/SessionType"
import {ServiceRestInterface} from "../../../../src/api/worker/rest/ServiceRestInterface"
import {HttpMethod} from "../../../../src/api/common/EntityFunctions"
import {SysService} from "../../../../src/api/entities/sys/Services"
import {createCreateSessionReturn} from "../../../../src/api/entities/sys/CreateSessionReturn"
import type {SecondFactorAuthHandler} from "../../../../src/misc/2fa/SecondFactorHandler.js"
import {createSaltReturn} from "../../../../src/api/entities/sys/SaltReturn"
import {createUser, UserTypeRef} from "../../../../src/api/entities/sys/User"
import {createAuthVerifier, encryptKey, generateKeyFromPassphrase, KeyLength, keyToBase64, sha256Hash} from "@tutao/tutanota-crypto"
import {createGroupMembership} from "../../../../src/api/entities/sys/GroupMembership"
import {createTutanotaProperties, TutanotaPropertiesTypeRef} from "../../../../src/api/entities/tutanota/TutanotaProperties"
import {Indexer} from "../../../../src/api/worker/search/Indexer"
import {EventBusClient} from "../../../../src/api/worker/EventBusClient"
import {Credentials} from "../../../../src/misc/credentials/Credentials"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"

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

	let facade: LoginFacadeImpl,
		workerMock: WorkerImpl,
		serviceMock: ServiceRestInterface,
		restClientMock: RestClient,
		entityClientMock: EntityClient,
		secondFactorAuthHandlerMock: SecondFactorAuthHandler,
		instanceMapperMock: InstanceMapper,
		cryptoFacadeMock: CryptoFacade,
		initializeCacheStorageMock: LateInitializedCacheStorage["initialize"],
		indexerMock: Indexer,
		eventBusClientMock: EventBusClient

	o.beforeEach(function () {

		workerMock = instance(WorkerImpl)
		serviceMock = object<ServiceRestInterface>()
		when(serviceMock.serviceRequest(SysService.SaltService, HttpMethod.GET, anything(), anything()))
			.thenResolve(createSaltReturn({salt: SALT}))

		restClientMock = instance(RestClient)
		entityClientMock = instance(EntityClient)
		when(entityClientMock.loadRoot(TutanotaPropertiesTypeRef, anything())).thenResolve(createTutanotaProperties())

		secondFactorAuthHandlerMock = object<SecondFactorAuthHandler>()
		instanceMapperMock = instance(InstanceMapper)
		cryptoFacadeMock = object<CryptoFacade>()
		initializeCacheStorageMock = func() as LateInitializedCacheStorage["initialize"]

		facade = new LoginFacadeImpl(
			workerMock,
			serviceMock,
			restClientMock,
			entityClientMock,
			secondFactorAuthHandlerMock,
			instanceMapperMock,
			() => cryptoFacadeMock,
			initializeCacheStorageMock
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
				when(serviceMock.serviceRequest(SysService.SessionService, HttpMethod.POST, anything(), anything()))
					.thenResolve(createCreateSessionReturn({user: userId, accessToken: "accessToken", challenges: []}))
				when(entityClientMock.load(UserTypeRef, userId)).thenResolve(makeUser({
					id: userId,
					passphrase,
					salt: SALT,
				}))
			})

			o("When a database key is provided, storage is initialized as persistent", async function () {
				await facade.createSession("born.slippy@tuta.io", passphrase, "client", SessionType.Persistent, dbKey)
				verify(initializeCacheStorageMock({persistent: true, databaseKey: dbKey, userId: userId}))
			})

			o("When no database key is provided, storage is initialized as ephemeral", async function () {
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

			o("When resuming a session and there is a database key, a persistent storage is created", async function () {
				await facade.resumeSession(credentials, SALT, dbKey)
				verify(initializeCacheStorageMock({persistent: true, databaseKey: dbKey, userId: userId}))
			})

			o("When resuming a session and there is no database key, a non-persistent storage created", async function () {
				await facade.resumeSession(credentials, SALT, null)
				verify(initializeCacheStorageMock({persistent: false}))
			})
		})
	})
})