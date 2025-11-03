import o from "@tutao/otest"
import { arrayEquals, assertNotNull, hexToUint8Array, KeyVersion, neverNull, utf8Uint8ArrayToString, Versioned } from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import {
	asCryptoProtoocolVersion,
	BucketPermissionType,
	CryptoProtocolVersion,
	EncryptionAuthStatus,
	EncryptionKeyVerificationState,
	GroupType,
	PermissionType,
	PresentableKeyVerificationState,
	ProcessingState,
	PublicKeyIdentifierType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import {
	createMail,
	createMailAddress,
	FileTypeRef,
	InternalRecipientKeyData,
	Mail,
	MailAddressTypeRef,
	MailDetailsBlobTypeRef,
	MailTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import {
	BucketKey,
	BucketKeyTypeRef,
	BucketPermissionTypeRef,
	BucketTypeRef,
	createBucket,
	createBucketKey,
	createBucketPermission,
	createGroup,
	createInstanceSessionKey,
	createKeyPair,
	createPermission,
	createTypeInfo,
	CustomerAccountTerminationRequestTypeRef,
	Group,
	GroupKeysRefTypeRef,
	GroupMembershipTypeRef,
	GroupTypeRef,
	InstanceSessionKey,
	InstanceSessionKeyTypeRef,
	KeyPair,
	KeyPairTypeRef,
	PermissionTypeRef,
	TypeInfoTypeRef,
	UpdatePermissionKeyData,
	User,
	UserTypeRef,
} from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { spy } from "@tutao/tutanota-test-utils"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import {
	Aes256Key,
	aes256RandomKey,
	aesDecrypt,
	aesEncrypt,
	AesKey,
	bitArrayToUint8Array,
	decryptKey,
	encryptKey,
	encryptRsaKey,
	generateX25519KeyPair,
	KeyPairType,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	pqKeyPairsToPublicKeys,
	PQPublicKeys,
	RsaPublicKey,
	rsaPublicKeyToHex,
	X25519KeyPair,
	X25519PublicKey,
} from "@tutao/tutanota-crypto"
import { ServerModelUntypedInstance, TypeModel, UntypedInstance } from "../../../../../src/common/api/common/EntityTypes.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { matchers, object, verify, when } from "testdouble"
import { UpdatePermissionKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import { elementIdPart, getListId, isSameId, listIdPart } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { HttpMethod, TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { SessionKeyNotFoundError } from "../../../../../src/common/api/common/error/SessionKeyNotFoundError.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { encodePQMessage, PQBucketKeyEncapsulation } from "../../../../../src/common/api/worker/facades/PQMessage.js"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver } from "../../../TestUtils.js"
import { RSA_TEST_KEYPAIR } from "../facades/RsaPqPerformanceTest.js"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { loadLibOQSWASM } from "../WASMTestUtils.js"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"
import { VerifiedPublicEncryptionKey } from "../../../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { KeyLoaderFacade, parseKeyVersion } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { PublicEncryptionKeyProvider } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider.js"
import { KeyRotationFacade } from "../../../../../src/common/api/worker/facades/KeyRotationFacade.js"
import { NotFoundError } from "../../../../../src/common/api/common/error/RestError"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"
import { EntityAdapter } from "../../../../../src/common/api/worker/crypto/EntityAdapter"
import { KeyVerificationMismatchError } from "../../../../../src/common/api/common/error/KeyVerificationMismatchError"

const { captor, anything, argThat } = matchers

const kyberFacade = new WASMKyberFacade(await loadLibOQSWASM())
const pqFacade: PQFacade = new PQFacade(kyberFacade)
let publicEncryptionKeyProvider: PublicEncryptionKeyProvider

/**
 * Helper to have all the mocked items available in the test case.
 */
type TestUser = {
	user: User
	name: string
	userGroup: Group
	mailGroup: Group
	userGroupKey: AesKey
	mailGroupKey: AesKey
}

const senderAddress = "hello@tutao.de"

o.spec("CryptoFacadeTest", function () {
	let restClient: RestClient

	let instancePipeline

	let serviceExecutor: IServiceExecutor
	let entityClient: EntityClient
	let ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue
	let crypto: CryptoFacade
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cache: DefaultEntityRestCache
	let asymmetricCryptoFacade: AsymmetricCryptoFacade
	let keyRotationFacade: KeyRotationFacade
	let typeModelResolver: TypeModelResolver

	async function prepareBucketKeyInstance(
		bucketEncMailSessionKey: Uint8Array,
		fileSessionKeys: Array<AesKey>,
		bk: AesKey,
		pubEncBucketKey: Uint8Array,
		recipientUser: TestUser,
		mail: Mail,
		senderPubEccKey: Versioned<X25519PublicKey> | undefined,
		recipientKeyVersion: NumberString,
		protocolVersion: CryptoProtocolVersion,
		asymmetricCryptoFacade: AsymmetricCryptoFacade,
	) {
		const MailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

		const mailInstanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
			typeInfo: createTestEntity(TypeInfoTypeRef, {
				application: MailTypeModel.app,
				typeId: String(MailTypeModel.id),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: "mailListId",
			instanceId: "mailId",
		})
		const FileTypeModel = await typeModelResolver.resolveClientTypeReference(FileTypeRef)
		const bucketEncSessionKeys = fileSessionKeys.map((fileSessionKey, index) => {
			return createTestEntity(InstanceSessionKeyTypeRef, {
				typeInfo: createTestEntity(TypeInfoTypeRef, {
					application: FileTypeModel.app,
					typeId: String(FileTypeModel.id),
				}),
				symEncSessionKey: encryptKey(bk, fileSessionKey),
				instanceList: "fileListId",
				instanceId: "fileId" + (index + 1),
			})
		})
		bucketEncSessionKeys.push(mailInstanceSessionKey)

		const bucketKey = createTestEntity(BucketKeyTypeRef, {
			pubEncBucketKey,
			keyGroup: recipientUser.userGroup._id,
			bucketEncSessionKeys: bucketEncSessionKeys,
			recipientKeyVersion,
			senderKeyVersion: senderPubEccKey != null ? senderPubEccKey.version.toString() : "0",
			protocolVersion,
		})

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketKey.keyGroup),
				parseKeyVersion(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderPubEccKey?.object ?? null })

		mail.bucketKey = bucketKey
	}

	o.before(function () {
		restClient = object()
		when(restClient.request(anything(), anything(), anything())).thenResolve(undefined)
		userFacade = object()
		cache = object()
	})

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		asymmetricCryptoFacade = object()
		ownerEncSessionKeysUpdateQueue = object()
		publicEncryptionKeyProvider = object()
		keyLoaderFacade = object()
		keyRotationFacade = object()
		typeModelResolver = clientInitializedTypeModelResolver()
		instancePipeline = instancePipelineFromTypeModelResolver(typeModelResolver)

		crypto = new CryptoFacade(
			userFacade,
			entityClient,
			restClient,
			serviceExecutor,
			instancePipeline,
			ownerEncSessionKeysUpdateQueue,
			cache,
			keyLoaderFacade,
			asymmetricCryptoFacade,
			publicEncryptionKeyProvider,
			() => keyRotationFacade,
			typeModelResolver,
		)
	})

	o("resolve session key: unencrypted instance", async function () {
		const customerAccountTerminationRequest = createTestEntity(CustomerAccountTerminationRequestTypeRef)

		o(await crypto.resolveSessionKey(customerAccountTerminationRequest)).equals(null)
	})

	o("resolve session key: _ownerEncSessionKey instance.", async function () {
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)
		const sk = aes256RandomKey()
		const mail = createTestEntity(MailTypeRef, {
			_ownerEncSessionKey: recipientUser.mailGroupKey ? encryptKey(recipientUser.mailGroupKey, sk) : null,
			_ownerGroup: recipientUser.mailGroup._id,
			_ownerKeyVersion: recipientUser.mailGroup.groupKeyVersion,
		})
		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(mail))
		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: _ownerEncSessionKey instance, fetches correct version.", async function () {
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		const sk = aes256RandomKey()
		const groupKey_v1 = aes256RandomKey()
		when(keyLoaderFacade.loadSymGroupKey(recipientUser.mailGroup._id, 1)).thenResolve(groupKey_v1)

		const mail = createTestEntity(MailTypeRef, {
			_ownerGroup: recipientUser.mailGroup._id,
			_ownerEncSessionKey: encryptKey(groupKey_v1, sk),
			_ownerKeyVersion: "1",
		})
		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(mail))
		o(sessionKey).deepEquals(sk)
	})

	const protocolVersion = CryptoProtocolVersion.TUTA_CRYPT
	o("resolve session key: rsa public key decryption of session key.", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		let confidential = true
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()
		let privateKey = RSA_TEST_KEYPAIR.privateKey
		let publicKey = RSA_TEST_KEYPAIR.publicKey
		const keyPair = createTestEntity(KeyPairTypeRef, {
			_id: "keyPairId",
			symEncPrivRsaKey: encryptRsaKey(recipientUser.userGroupKey, privateKey),
			pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(RSA_TEST_KEYPAIR.publicKey)),
		})
		recipientUser.userGroup.currentKeys = keyPair

		const mail = createTestEntity(MailTypeRef, {
			confidential,
			_ownerGroup: recipientUser.mailGroup._id,
			_permissions: "permissionListId",
		})

		const bucket = createTestEntity(BucketTypeRef, {
			bucketPermissions: "bucketPermissionListId",
		})
		const permission = createTestEntity(PermissionTypeRef, {
			_id: ["permissionListId", "permissionId"],
			_ownerGroup: recipientUser.userGroup._id,
			bucketEncSessionKey: encryptKey(bk, sk),
			bucket,
			type: PermissionType.Public,
		})
		const pubEncBucketKey = object<Uint8Array>()
		const bucketPermission = createTestEntity(BucketPermissionTypeRef, {
			_id: ["bucketPermissionListId", "bucketPermissionId"],
			_ownerGroup: recipientUser.userGroup._id,
			type: BucketPermissionType.Public,
			group: recipientUser.userGroup._id,
			pubEncBucketKey,
			protocolVersion: protocolVersion,
			pubKeyVersion: "0",
		})

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketPermission.group),
				parseKeyVersion(bucketPermission.pubKeyVersion!),
				protocolVersion,
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: null })
		when(entityClient.loadAll(BucketPermissionTypeRef, getListId(bucketPermission))).thenResolve([bucketPermission])
		when(entityClient.loadAll(PermissionTypeRef, getListId(permission))).thenResolve([permission])
		when(
			serviceExecutor.post(
				UpdatePermissionKeyService,
				argThat((p: UpdatePermissionKeyData) => {
					return isSameId(p.permission, permission._id) && isSameId(p.bucketPermission, bucketPermission._id)
				}),
			),
		).thenResolve(undefined)

		const sessionKey = neverNull(await crypto.resolveSessionKey(mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key.", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		let pqKeyPairs = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateX25519KeyPair()

		// configure test mail
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mail = createTestEntity(MailTypeRef, {
			_permissions: "permissionListId",
			_ownerGroup: recipientTestUser.mailGroup._id,
			confidential: true,
		})
		const bucket = createBucket({
			bucketPermissions: "bucketPermissionListId",
		})
		const permission = createPermission({
			_format: "",
			listElementApplication: null,
			listElementTypeId: null,
			ops: null,
			symEncSessionKey: null,
			symKeyVersion: null,
			_id: ["permissionListId", "permissionId"],
			_ownerGroup: recipientTestUser.mailGroup._id,
			bucketEncSessionKey: encryptKey(bk, sk),
			bucket,
			type: PermissionType.Public,
			_ownerEncSessionKey: null,
			_ownerKeyVersion: null,
			_permissions: "p_id",
			group: null,
		})
		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateX25519KeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs),
			bitArrayToUint8Array(bk),
		)
		const protocolVersion = CryptoProtocolVersion.RSA
		const bucketPermission = createBucketPermission({
			_id: ["bucketPermissionListId", "bucketPermissionId"],
			_format: "",
			_permissions: "",
			_ownerGroup: recipientTestUser.mailGroup._id,
			type: BucketPermissionType.Public,
			group: recipientTestUser.userGroup._id,
			pubEncBucketKey,
			senderKeyVersion: "0",
			ownerEncBucketKey: null,
			ownerKeyVersion: null,
			protocolVersion,
			pubKeyVersion: "0",
			symEncBucketKey: null,
			symKeyVersion: null,
		})

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketPermission.group),
				parseKeyVersion(bucketPermission.pubKeyVersion!),
				protocolVersion,
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PATCH, anything())).thenResolve(undefined)
		when(entityClient.loadAll(BucketPermissionTypeRef, getListId(bucketPermission))).thenResolve([bucketPermission])
		when(entityClient.loadAll(PermissionTypeRef, getListId(permission))).thenResolve([permission])

		const sessionKey = neverNull(await crypto.resolveSessionKey(mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key, fetches correct recipient key version", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		const pqKeyPairs_v1 = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateX25519KeyPair()

		// configure test mail
		const sk = aes256RandomKey()
		const bk = aes256RandomKey()

		const mail = createTestEntity(MailTypeRef, {
			_ownerGroup: recipientTestUser.mailGroup._id,
			confidential: true,
			_permissions: "permissionListId",
		})
		const bucket = createBucket({
			bucketPermissions: "bucketPermissionListId",
		})
		const permission = createPermission({
			_format: "",
			listElementApplication: null,
			listElementTypeId: null,
			ops: null,
			symEncSessionKey: null,
			symKeyVersion: null,
			_id: ["permissionListId", "permissionId"],
			_ownerGroup: recipientTestUser.mailGroup._id,
			bucketEncSessionKey: encryptKey(bk, sk),
			bucket,
			type: PermissionType.Public,
			_ownerEncSessionKey: null,
			_ownerKeyVersion: null,
			_permissions: "p_id",
			group: null,
		})
		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateX25519KeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs_v1),
			bitArrayToUint8Array(bk),
		)
		const protocolVersion = CryptoProtocolVersion.RSA
		const bucketPermission = createBucketPermission({
			_id: ["bucketPermissionListId", "bucketPermissionId"],
			_format: "",
			_permissions: "",
			_ownerGroup: recipientTestUser.mailGroup._id,
			type: BucketPermissionType.Public,
			group: recipientTestUser.userGroup._id,
			pubEncBucketKey,
			senderKeyVersion: "0",
			ownerEncBucketKey: null,
			ownerKeyVersion: null,
			protocolVersion: "0",
			pubKeyVersion: "1",
			symEncBucketKey: null,
			symKeyVersion: null,
		})

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketPermission.group),
				parseKeyVersion(bucketPermission.pubKeyVersion!),
				protocolVersion,
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })
		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PATCH, anything())).thenResolve(undefined)
		when(entityClient.loadAll(BucketPermissionTypeRef, getListId(bucketPermission))).thenResolve([bucketPermission])
		when(entityClient.loadAll(PermissionTypeRef, getListId(permission))).thenResolve([permission])

		const sessionKey = neverNull(await crypto.resolveSessionKey(mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key using bucketKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		let confidential = true

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		const pqKeyPairs_v1 = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateX25519KeyPair()

		// configure test mail
		const sk = aes256RandomKey()
		const bk = aes256RandomKey()

		let mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			_ownerGroup: recipientTestUser.mailGroup._id,
			confidential,
			mailDetails: ["mailDetailsArchiveId", "mailDetailsId"],
			sender: createTestEntity(MailAddressTypeRef, {
				address: senderAddress,
				name: "sender name",
			}),
		})

		const bucketEncMailSessionKey = encryptKey(bk, sk)
		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateX25519KeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs_v1),
			bitArrayToUint8Array(bk),
		)

		const senderKeyVersion = 1
		await prepareBucketKeyInstance(
			bucketEncMailSessionKey,
			[],
			bk,
			pubEncBucketKey,
			recipientTestUser,
			mail,
			{
				object: senderIdentityKeyPair.publicKey,
				version: senderKeyVersion,
			},
			"1",
			protocolVersion,
			asymmetricCryptoFacade,
		)

		when(
			asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
				{
					keyPairType: pqKeyPairs_v1.keyPairType,
					x25519KeyPair: pqKeyPairs_v1.x25519KeyPair,
					kyberKeyPair: pqKeyPairs_v1.kyberKeyPair,
				},
				protocolVersion,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })
		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PATCH, anything())).thenResolve(undefined)
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				senderIdentityKeyPair.publicKey,
				senderKeyVersion,
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			verificationState: PresentableKeyVerificationState.SECURE,
		})

		const sessionKey = neverNull(await crypto.resolveSessionKey(mail))

		o(sessionKey).deepEquals(sk)
	})

	o("enforceSessionKeyUpdateIfNeeded: _ownerEncSessionKey already defined", async function () {
		const files = [createTestEntity(FileTypeRef, { _ownerEncSessionKey: new Uint8Array() })]
		const mail = createTestEntity(MailTypeRef, { bucketKey: null })

		await crypto.enforceSessionKeyUpdateIfNeeded(mail, files)

		verify(ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(anything()), { times: 0 })
		verify(cache.deleteFromCacheIfExists(anything(), anything(), anything()), { times: 0 })
	})

	o("enforceSessionKeyUpdateIfNeeded: _ownerEncSessionKey missing", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const files = [
			createTestEntity(FileTypeRef, { _id: ["listId", "1"], _ownerEncSessionKey: new Uint8Array() }),
			createTestEntity(FileTypeRef, { _id: ["listId", "2"], _ownerEncSessionKey: null }),
		]

		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		const bucketKey = assertNotNull(testData.mail.bucketKey)

		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				anything(),
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			verificationState: PresentableKeyVerificationState.SECURE,
		})

		await crypto.enforceSessionKeyUpdateIfNeeded(testData.mail, files)
		verify(ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(anything()), { times: 1 })
		verify(cache.deleteFromCacheIfExists(FileTypeRef, "listId", "2"))
	})

	o("encryptBucketKeyForInternalRecipient with existing PQKeys for sender and recipient", async function () {
		let recipientMailAddress = "bob@tutanota.com"
		let senderGroupKey = aes256RandomKey()
		let bk = aes256RandomKey()

		const recipientKeyPairs = await pqFacade.generateKeyPairs()

		const recipientKeyPair = createKeyPair({
			_id: "recipientKeyPairId",
			pubEccKey: recipientKeyPairs.x25519KeyPair.publicKey,
			symEncPrivEccKey: null,
			pubKyberKey: kyberPublicKeyToBytes(recipientKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: null,
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			signature: null,
		})

		const senderKeyPairs = await pqFacade.generateKeyPairs()

		const senderKeyPair = createKeyPair({
			_id: "senderKeyPairId",
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			pubEccKey: senderKeyPairs.x25519KeyPair.publicKey,
			symEncPrivEccKey: aesEncrypt(senderGroupKey, senderKeyPairs.x25519KeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(senderKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(senderGroupKey, kyberPrivateKeyToBytes(senderKeyPairs.kyberKeyPair.privateKey)),
			signature: null,
		})

		const senderUserGroup = createGroup({
			_format: "",
			_ownerGroup: "",
			_permissions: "",
			admin: "admin1",
			adminGroupEncGKey: null,
			adminGroupKeyVersion: null,
			archives: [],
			customer: "customer1",
			enabled: false,
			external: false,
			groupInfo: ["", ""],
			invitations: "",
			members: "",
			storageCounter: "counter1",
			type: "",
			user: "user1",
			_id: "userGroupId",
			currentKeys: senderKeyPair,
			groupKeyVersion: "0",
			formerGroupKeys: createTestEntity(GroupKeysRefTypeRef),
			pubAdminGroupEncGKey: null,
			identityKeyPair: null,
		})

		const notFoundRecipients = []
		const keyVerificationMismatchRecipients = []
		const pqEncapsulation: PQBucketKeyEncapsulation = {
			kyberCipherText: new Uint8Array([1]),
			kekEncBucketKey: new Uint8Array([2]),
		}

		const encodedPqMessage: Uint8Array = encodePQMessage({
			senderIdentityPubKey: senderKeyPair.pubEccKey!,
			ephemeralPubKey: senderKeyPair.pubEccKey!,
			encapsulation: pqEncapsulation,
		})

		const recipientPublicKeys: Versioned<PQPublicKeys> = {
			version: 0,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				x25519PublicKey: recipientKeyPair.pubEccKey!,
				kyberPublicKey: {
					raw: recipientKeyPair.pubKyberKey!,
				},
			},
		}
		const loadedPublicKey: VerifiedPublicEncryptionKey = {
			publicEncryptionKey: recipientPublicKeys,
			verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		}
		when(publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(anything())).thenResolve(loadedPublicKey)
		when(asymmetricCryptoFacade.asymEncryptSymKey(bk, recipientPublicKeys, senderUserGroup._id)).thenResolve({
			recipientKeyVersion: recipientPublicKeys.version,
			senderKeyVersion: parseKeyVersion(senderUserGroup.groupKeyVersion),
			pubEncSymKeyBytes: encodedPqMessage,
			cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
		})

		const internalRecipientKeyData = (await crypto.encryptBucketKeyForInternalRecipient(
			senderUserGroup._id,
			bk,
			recipientMailAddress,
			notFoundRecipients,
			keyVerificationMismatchRecipients,
		)) as InternalRecipientKeyData

		o(internalRecipientKeyData!.recipientKeyVersion).equals("0")
		o(internalRecipientKeyData.protocolVersion).equals(CryptoProtocolVersion.TUTA_CRYPT)
		o(internalRecipientKeyData!.mailAddress).equals(recipientMailAddress)
		o(internalRecipientKeyData!.pubEncBucketKey).deepEquals(encodedPqMessage)
		verify(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: recipientMailAddress,
			}),
			{ times: 1 },
		)
	})

	o("encryptBucketKeyForInternalRecipient with existing PQKeys for sender", async () => {
		let recipientMailAddress = "bob@tutanota.com"
		let bk = aes256RandomKey()

		let senderMailAddress = "alice@tutanota.com"

		const senderKeyPair: KeyPair = object()

		const senderUserGroup = createGroup({
			_id: "userGroupId",
			currentKeys: senderKeyPair,
			groupKeyVersion: "0",
			_permissions: "",
			admin: null,
			adminGroupEncGKey: null,
			adminGroupKeyVersion: null,
			archives: [],
			customer: null,
			enabled: false,
			external: false,
			groupInfo: ["", ""],
			invitations: "",
			members: "",
			storageCounter: null,
			type: "",
			user: null,
			formerGroupKeys: createTestEntity(GroupKeysRefTypeRef),
			pubAdminGroupEncGKey: null,
			identityKeyPair: null,
		})

		const notFoundRecipients = []
		const keyVerificationMismatchRecipients = []

		const recipientPublicKeys: Versioned<RsaPublicKey> = {
			version: 0,
			object: object(),
		}
		const loadedRecipientPublicKey: VerifiedPublicEncryptionKey = {
			publicEncryptionKey: recipientPublicKeys,
			verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		}
		when(publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey(anything())).thenResolve(loadedRecipientPublicKey)

		const senderPublicKeys: Versioned<PQPublicKeys> = {
			version: 0,
			object: object(),
		}
		const loadedSenderPublicKey: VerifiedPublicEncryptionKey = {
			publicEncryptionKey: senderPublicKeys,
			verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		}

		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: senderMailAddress,
			}),
		).thenResolve(loadedSenderPublicKey)

		const pubEncBucketKey = object<Uint8Array>()
		when(asymmetricCryptoFacade.asymEncryptSymKey(bk, recipientPublicKeys, senderUserGroup._id)).thenResolve({
			recipientKeyVersion: recipientPublicKeys.version,
			senderKeyVersion: parseKeyVersion(senderUserGroup.groupKeyVersion),
			pubEncSymKeyBytes: pubEncBucketKey,
			cryptoProtocolVersion: CryptoProtocolVersion.RSA,
		})

		const internalRecipientKeyData = (await crypto.encryptBucketKeyForInternalRecipient(
			senderUserGroup._id,
			bk,
			recipientMailAddress,
			notFoundRecipients,
			keyVerificationMismatchRecipients,
		)) as InternalRecipientKeyData

		o(internalRecipientKeyData!.recipientKeyVersion).equals("0")
		o(internalRecipientKeyData!.mailAddress).equals(recipientMailAddress)
		o(internalRecipientKeyData.protocolVersion).equals(CryptoProtocolVersion.RSA)
		o(internalRecipientKeyData.pubEncBucketKey).deepEquals(pubEncBucketKey)
		verify(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: recipientMailAddress,
			}),
			{ times: 1 },
		)
	})

	o("encryptBucketKeyForInternalRecipient for non-existing recipients", async function () {
		let notFoundRecipientMailAddress = "notfound@tutanota.com"
		let bk = aes256RandomKey()

		const notFoundRecipients: string[] = []
		const keyVerificationMismatchRecipients: string[] = []

		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: notFoundRecipientMailAddress,
			}),
		).thenReject(new NotFoundError(""))

		await crypto.encryptBucketKeyForInternalRecipient(
			"senderGroupId",
			bk,
			notFoundRecipientMailAddress,
			notFoundRecipients,
			keyVerificationMismatchRecipients,
		)

		o(notFoundRecipients).deepEquals(["notfound@tutanota.com"])
		o(keyVerificationMismatchRecipients).deepEquals([])
		verify(userFacade.getUser(), { times: 0 })
	})

	o("encryptBucketKeyForInternalRecipient with non-existing recipients", async function () {
		let notFoundRecipient1MailAddress = "notfound1@tutanota.com"
		let notFoundRecipient2MailAddress = "notfound2@tutanota.com"
		const validRecipientMailAddress = "alice@tuta.com"

		let bk = aes256RandomKey()

		const notFoundRecipients: string[] = []
		const mismatchRecipients: string[] = []

		const recipientPublicKey: Versioned<PQPublicKeys> = {
			version: 0,
			object: object(),
		}
		recipientPublicKey.object.keyPairType = KeyPairType.TUTA_CRYPT
		const loadedRecipientPublicKey: VerifiedPublicEncryptionKey = {
			publicEncryptionKey: recipientPublicKey,
			verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		}
		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: validRecipientMailAddress,
			}),
		).thenResolve(loadedRecipientPublicKey)

		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: notFoundRecipient1MailAddress,
			}),
		).thenReject(new NotFoundError(""))
		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: notFoundRecipient2MailAddress,
			}),
		).thenReject(new NotFoundError(""))

		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, notFoundRecipient1MailAddress, notFoundRecipients, mismatchRecipients)

		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, validRecipientMailAddress, notFoundRecipients, mismatchRecipients)

		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, notFoundRecipient2MailAddress, notFoundRecipients, mismatchRecipients)

		o(notFoundRecipients).deepEquals([notFoundRecipient1MailAddress, notFoundRecipient2MailAddress])
		o(mismatchRecipients).deepEquals([])

		verify(userFacade.getUser(), { times: 0 })
	})

	o("encryptBucketKeyForInternalRecipient for verification-failing recipients", async function () {
		let mismatchRecipient1MailAddress = "mismatch1@tutanota.com"
		let mismatchRecipient2MailAddress = "mismatch2@tutanota.com"
		const validRecipientMailAddress = "alice@tuta.com"

		let bk = aes256RandomKey()

		const notFoundRecipients: string[] = []
		const mismatchRecipients: string[] = []

		const recipientPublicKey: Versioned<PQPublicKeys> = {
			version: 0,
			object: object(),
		}
		recipientPublicKey.object.keyPairType = KeyPairType.TUTA_CRYPT
		const loadedRecipientPublicKey: VerifiedPublicEncryptionKey = {
			publicEncryptionKey: recipientPublicKey,
			verificationState: EncryptionKeyVerificationState.NO_ENTRY,
		}
		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: validRecipientMailAddress,
			}),
		).thenResolve(loadedRecipientPublicKey)

		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: mismatchRecipient1MailAddress,
			}),
		).thenReject(new KeyVerificationMismatchError(""))
		when(
			publicEncryptionKeyProvider.loadCurrentPublicEncryptionKey({
				identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				identifier: mismatchRecipient2MailAddress,
			}),
		).thenReject(new KeyVerificationMismatchError(""))

		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, mismatchRecipient1MailAddress, notFoundRecipients, mismatchRecipients)
		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, validRecipientMailAddress, notFoundRecipients, mismatchRecipients)
		await crypto.encryptBucketKeyForInternalRecipient("senderGroupId", bk, mismatchRecipient2MailAddress, notFoundRecipients, mismatchRecipients)

		o(notFoundRecipients).deepEquals([])
		o(mismatchRecipients).deepEquals([mismatchRecipient1MailAddress, mismatchRecipient2MailAddress])
		verify(userFacade.getUser(), { times: 0 })
	})

	o("authenticateSender | sender is authenticated for correct SenderIdentityKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()

		const senderKeyVersion = "0"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				parseKeyVersion(senderKeyVersion),
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			verificationState: PresentableKeyVerificationState.SECURE,
		})

		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.mail.bucketKey!.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
	})

	o("authenticateSender | sender is authenticated for correct SenderIdentityKey from system@tutanota.de", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest([], false)

		const senderKeyVersion = "0"
		const senderIdentifier = "system@tutanota.de"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderIdentifier,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				parseKeyVersion(senderKeyVersion),
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			verificationState: PresentableKeyVerificationState.SECURE,
		})

		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.mail.bucketKey!.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = assertNotNull(
			updatedInstanceSessionKeys.find((instanceSessionKey) =>
				isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
			),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, mailInstanceSessionKey.encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
	})

	o("authenticateSender | sender is not authenticated for incorrect SenderIdentityKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()

		const senderKeyVersion = "0"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				parseKeyVersion(senderKeyVersion),
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED,
			verificationState: PresentableKeyVerificationState.ALERT,
		})

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.mail.bucketKey!.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
	})

	o("authenticateSender | no authentication needed for sender with RSAKeypair", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()

		const sessionKey = assertNotNull(await crypto.resolveSessionKey(testData.mail))
		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.mail.bucketKey!.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
		)

		const actualAuthStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, assertNotNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAuthStatus).deepEquals(EncryptionAuthStatus.RSA_NO_AUTHENTICATION)
	})

	o("authenticateSender | RSA was used despite recipient having tutacrypt", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()

		when(keyLoaderFacade.loadCurrentKeyPair(anything())).thenResolve({
			version: 1,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				kyberKeyPair: object(),
				x25519KeyPair: object(),
			},
		})

		when(keyRotationFacade.getGroupIdsThatPerformedKeyRotations()).thenResolve([])

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))
		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.mail.bucketKey!.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.RSA_DESPITE_TUTACRYPT)
	})

	o("authenticateSender | RSA was used right after a key rotation", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()

		when(keyLoaderFacade.loadCurrentKeyPair(anything())).thenResolve({
			version: 1,
			object: {
				keyPairType: KeyPairType.TUTA_CRYPT,
				kyberKeyPair: object(),
				x25519KeyPair: object(),
			},
		})

		when(keyRotationFacade.getGroupIdsThatPerformedKeyRotations()).thenResolve([testData.userGroupId])

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))
		const bucketKey = assertNotNull(testData.mail.bucketKey)
		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mail._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.RSA_NO_AUTHENTICATION)
	})

	o("authenticateSender | no authentication needed for secure external recipient", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const file1SessionKey = aes256RandomKey()
		const file2SessionKey = aes256RandomKey()
		const testData = await prepareConfidentialMailToExternalRecipient([file1SessionKey, file2SessionKey])

		const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.entityAdapter))
		o(mailSessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.entityAdapter._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.AES_NO_AUTHENTICATION)
	})

	o("authenticateSender | no authentication needed for secure external sender", async function () {
		//o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareConfidentialReplyFromExternalUser()
		const externalUser = testData.externalUser

		const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.entityAdapter))
		o(mailSessionKey).deepEquals(testData.sk)

		const mailCaptor = matchers.captor()
		const userCaptor = matchers.captor()
		verify(keyLoaderFacade.loadSymGroupKey(externalUser.userGroup._id, parseKeyVersion(externalUser.mailGroup.adminGroupKeyVersion!), userCaptor.capture()))
		verify(keyLoaderFacade.loadSymGroupKey(externalUser.mailGroup._id, testData.recipientKeyVersion, mailCaptor.capture()))
		o(userCaptor.value.version).equals(parseKeyVersion(externalUser.userGroup.groupKeyVersion))
		o(mailCaptor.value.version).equals(parseKeyVersion(externalUser.mailGroup.groupKeyVersion))

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.entityAdapter._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.AES_NO_AUTHENTICATION)
	})
	o("resolve session key: rsa public key decryption of session key using BucketKey aggregated type", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: rsa public key decryption of mail session key using BucketKey aggregated type - already decoded/decrypted Mail referencing MailDetailsDraft",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()

			// do not use testdouble here because it's hard to not break the function itself and then verify invocations
			const decryptAndMapToInstance = (instancePipeline.cryptoMapper.decryptParsedInstance = spy(instancePipeline.cryptoMapper.decryptParsedInstance))

			const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))
			o(decryptAndMapToInstance.invocations.length).equals(0)

			o(sessionKey).deepEquals(testData.sk)
		},
	)

	o("resolve session key: rsa public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: rsa public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest([file1SessionKey, file2SessionKey])

			const mailSessionKey = assertNotNull(await crypto.resolveSessionKey(testData.mail))
			o(mailSessionKey).deepEquals(testData.sk)

			const bucketKey = assertNotNull(testData.mail.bucketKey)

			o(bucketKey.bucketEncSessionKeys.length).equals(3) //mail, file1, file2
			const updatedInstanceSessionKeysCaptor = captor()
			verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
			const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value
			o(updatedInstanceSessionKeys.length).equals(bucketKey.bucketEncSessionKeys.length)
			for (const isk of bucketKey.bucketEncSessionKeys) {
				const expectedSessionKey = decryptKey(testData.bk, isk.symEncSessionKey)
				o(
					updatedInstanceSessionKeys.some((updatedKey) => {
						let updatedSessionKey = decryptKey(testData.mailGroupKey, updatedKey.symEncSessionKey)
						return (
							updatedKey.instanceId === isk.instanceId &&
							updatedKey.instanceList === isk.instanceList &&
							updatedKey.typeInfo.application === isk.typeInfo.application &&
							updatedKey.typeInfo.typeId === isk.typeInfo.typeId &&
							arrayEquals(updatedSessionKey, expectedSessionKey)
						)
					}),
				).equals(true)
			}
		},
	)

	// ------------

	o("resolve session key: pq public key decryption of mail session key using BucketKey aggregated type - Mail", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()

		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				anything(),
				anything(),
			),
		).thenResolve({
			authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			verificationState: PresentableKeyVerificationState.SECURE,
		})

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: pq public key decryption of mail session key using BucketKey aggregated type - already decoded/decrypted Mail referencing MailDetailsDraft",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while

			const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()

			when(
				asymmetricCryptoFacade.authenticateSender(
					{
						identifier: senderAddress,
						identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
					},
					anything(),
					anything(),
				),
			).thenResolve({
				authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
				verificationState: PresentableKeyVerificationState.SECURE,
			})

			// do not use testdouble here because it's hard to not break the function itself and then verify invocations
			const decryptAndMapToInstance = (instancePipeline.cryptoMapper.decryptParsedInstance = spy(instancePipeline.cryptoMapper.decryptParsedInstance))

			const sessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))
			o(decryptAndMapToInstance.invocations.length).equals(0)

			o(sessionKey).deepEquals(testData.sk)
		},
	)

	o(
		"resolve session key: pq public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest([file1SessionKey, file2SessionKey])

			when(
				asymmetricCryptoFacade.authenticateSender(
					{
						identifier: senderAddress,
						identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
					},
					anything(),
					anything(),
				),
			).thenResolve({
				authStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
				verificationState: PresentableKeyVerificationState.SECURE,
			})

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.mail))
			const bucketKey = assertNotNull(testData.mail.bucketKey)
			o(mailSessionKey).deepEquals(testData.sk)

			o(bucketKey.bucketEncSessionKeys.length).equals(3) //mail, file1, file2
			const updatedInstanceSessionKeysCaptor = captor()
			verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
			const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value
			o(updatedInstanceSessionKeys.length).equals(bucketKey.bucketEncSessionKeys.length)
			for (const isk of bucketKey.bucketEncSessionKeys) {
				const expectedSessionKey = decryptKey(testData.bk, isk.symEncSessionKey)
				if (
					!updatedInstanceSessionKeys.some((updatedKey) => {
						const updatedSessionKey = decryptKey(testData.mailGroupKey, updatedKey.symEncSessionKey)
						return (
							updatedKey.instanceId === isk.instanceId &&
							updatedKey.instanceList === isk.instanceList &&
							updatedKey.typeInfo.application === isk.typeInfo.application &&
							updatedKey.typeInfo.typeId === isk.typeInfo.typeId &&
							arrayEquals(updatedSessionKey, expectedSessionKey)
						)
					})
				) {
					console.log("===============================")
					updatedInstanceSessionKeys.some((updatedKey) => {
						const updatedSessionKey = decryptKey(testData.mailGroupKey, updatedKey.symEncSessionKey)
						console.log(">>>>>>>>>>>>>>>>>>>>>>>")
						console.log("1 ", updatedKey.instanceId, isk.instanceId)
						console.log("2 ", updatedKey.instanceList, isk.instanceList)
						console.log("3 ", updatedKey.typeInfo.application, isk.typeInfo.application)
						console.log("4 ", updatedKey.typeInfo.typeId, isk.typeInfo.typeId)
						console.log("5 ", updatedSessionKey, expectedSessionKey)
					})
				}

				o(
					updatedInstanceSessionKeys.some((updatedKey) => {
						const updatedSessionKey = decryptKey(testData.mailGroupKey, updatedKey.symEncSessionKey)
						return (
							updatedKey.instanceId === isk.instanceId &&
							updatedKey.instanceList === isk.instanceList &&
							updatedKey.typeInfo.application === isk.typeInfo.application &&
							updatedKey.typeInfo.typeId === isk.typeInfo.typeId &&
							arrayEquals(updatedSessionKey, expectedSessionKey)
						)
					}),
				).equals(true)
			}
		},
	)

	o(
		"resolve session key: external user key decryption of session key using BucketKey aggregated type encrypted with MailGroupKey - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await prepareConfidentialMailToExternalRecipient([file1SessionKey, file2SessionKey])

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.entityAdapter))
			o(mailSessionKey).deepEquals(testData.sk)
		},
	)

	o(
		"resolve session key: external user key decryption of session key using BucketKey aggregated type encrypted with UserGroupKey - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await prepareConfidentialMailToExternalRecipient([file1SessionKey, file2SessionKey], true)

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.entityAdapter))

			o(mailSessionKey).deepEquals(testData.sk)
		},
	)

	o("resolve session key: MailDetailsBlob", async function () {
		const gk = aes256RandomKey()
		const sk = aes256RandomKey()
		const ownerGroup = "mailGroupId"
		when(keyLoaderFacade.getCurrentSymGroupKey(ownerGroup)).thenResolve({ object: gk, version: 0 })
		when(userFacade.hasGroup(ownerGroup)).thenReturn(true)
		when(userFacade.isFullyLoggedIn()).thenReturn(true)

		const mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
			_id: ["mailDetailsArchiveId", "mailDetailsId"],
			_ownerGroup: ownerGroup,
			_ownerEncSessionKey: encryptKey(gk, sk),
		})
		when(keyLoaderFacade.loadSymGroupKey(ownerGroup, 0)).thenResolve(gk)

		const mailDetailsBlobSessionKey = neverNull(await crypto.resolveSessionKey(mailDetailsBlob))
		o(mailDetailsBlobSessionKey).deepEquals(sk)
	})

	o("resolve session key: MailDetailsBlob - session key not found", async function () {
		const mailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
			_id: ["mailDetailsArchiveId", "mailDetailsId"],
			_permissions: "permissionListId",
		})
		when(entityClient.loadAll(PermissionTypeRef, "permissionListId")).thenResolve([])

		try {
			await crypto.resolveSessionKey(mailDetailsBlob)
			o(true).equals(false) // let the test fails if there is no exception
		} catch (error) {
			o(error.constructor).equals(SessionKeyNotFoundError)
		}
	})

	/**
	 * Prepares the environment to test receiving rsa asymmetric encrypted emails that have been sent with the simplified permission system.
	 *  - Creates key pair for the recipient user
	 *  - Creates group, bucket and session keys
	 *  - Creates mail literal and encrypts all encrypted attributes of the mail
	 *  - Create BucketKey object on the mail
	 *
	 * @param fileSessionKeys List of session keys for the attachments. When the list is empty there are no attachments
	 */
	async function prepareRsaPubEncBucketKeyResolveSessionKeyTest(fileSessionKeys: Array<Aes256Key> = []): Promise<{
		mail: Mail
		sk: Aes256Key
		bk: Aes256Key
		mailGroupKey: Aes256Key
		userGroupId: Id
	}> {
		// configure test user
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		let privateKey = RSA_TEST_KEYPAIR.privateKey
		let publicKey = RSA_TEST_KEYPAIR.publicKey
		const keyPair = createTestEntity(KeyPairTypeRef, {
			_id: "keyPairId",
			symEncPrivRsaKey: encryptRsaKey(recipientUser.userGroupKey, privateKey),
			pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(publicKey)),
		})
		recipientUser.userGroup.currentKeys = keyPair

		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mail = createTestEntity(MailTypeRef, {
			_id: ["mailListId", "mailId"],
			_permissions: "permissionListId",
			_ownerGroup: recipientUser.mailGroup._id,
			confidential: true,
			subject: "oh no is this a subject",
		})

		const pubEncBucketKey = new Uint8Array([1, 2, 3, 4])
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const mailInstanceSessionKey = createInstanceSessionKey({
			typeInfo: createTypeInfo({
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId.toString(),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: listIdPart(mail._id),
			instanceId: elementIdPart(mail._id),
			encryptionAuthStatus: null,
			symKeyVersion: "0",
			keyVerificationState: null,
		})
		const FileTypeModel = await typeModelResolver.resolveClientTypeReference(FileTypeRef)
		const bucketEncSessionKeys = fileSessionKeys.map((fileSessionKey, index) => {
			return createInstanceSessionKey({
				typeInfo: createTypeInfo({
					application: FileTypeModel.app,
					typeId: String(FileTypeModel.id),
				}),
				symEncSessionKey: encryptKey(bk, fileSessionKey),
				symKeyVersion: "0",
				instanceList: "fileListId",
				instanceId: "fileId" + (index + 1),
				encryptionAuthStatus: null,
				keyVerificationState: null,
			})
		})
		bucketEncSessionKeys.push(mailInstanceSessionKey)

		const protocolVersion = CryptoProtocolVersion.RSA
		const bucketKey = createBucketKey({
			pubEncBucketKey,
			keyGroup: recipientUser.userGroup._id,
			bucketEncSessionKeys: bucketEncSessionKeys,
			groupEncBucketKey: null,
			protocolVersion,
			senderKeyVersion: null,
			recipientKeyVersion: "0",
		})
		when(keyLoaderFacade.loadCurrentKeyPair(recipientUser.userGroup._id)).thenResolve({
			object: {
				keyPairType: KeyPairType.RSA,
				publicKey: RSA_TEST_KEYPAIR.publicKey,
				privateKey: RSA_TEST_KEYPAIR.privateKey,
			},
			version: 0,
		})

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketKey.keyGroup),
				parseKeyVersion(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: null })

		mail.bucketKey = bucketKey
		return {
			mail,
			sk,
			bk,
			mailGroupKey: recipientUser.mailGroupKey,
			userGroupId: recipientUser.userGroup._id,
		}
	}

	/**
	 * Prepares the environment to test receiving pq asymmetric encrypted emails that have been sent with the simplified permission system.
	 *  - Creates key pair for the recipient user
	 *  - Creates group, bucket and session keys
	 *  - Creates mail literal and encrypts all encrypted attributes of the mail
	 *  - Create BucketKey object on the mail
	 *
	 * @param fileSessionKeys List of session keys for the attachments. When the list is empty there are no attachments
	 */
	async function preparePqPubEncBucketKeyResolveSessionKeyTest(
		fileSessionKeys: Array<AesKey> = [],
		confidential: boolean = true,
	): Promise<{
		mail: Mail
		sk: AesKey
		bk: AesKey
		mailGroupKey: AesKey
		senderIdentityKeyPair: X25519KeyPair
	}> {
		// create test user
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		let pqKeyPairs = await pqFacade.generateKeyPairs()

		const recipientKeyPair = createKeyPair({
			_id: "keyPairId",
			pubEccKey: pqKeyPairs.x25519KeyPair.publicKey,
			symEncPrivEccKey: aesEncrypt(recipientUser.userGroupKey, pqKeyPairs.x25519KeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(pqKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(recipientUser.userGroupKey, kyberPrivateKeyToBytes(pqKeyPairs.kyberKeyPair.privateKey)),
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			signature: null,
		})

		recipientUser.userGroup.currentKeys = recipientKeyPair

		const senderIdentityKeyPair = generateX25519KeyPair()

		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mail = createTestEntity(MailTypeRef, {
			confidential,
			_ownerGroup: recipientUser.mailGroup._id,
			_ownerEncSessionKey: null, // enforce asymmetric crypto to resolve session key
			_id: ["mailListId", "mailId"],
			_permissions: "permissionListId",
			sender: createTestEntity(MailAddressTypeRef, {
				address: senderAddress,
				name: "sender name",
			}),
		})

		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateX25519KeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs),
			bitArrayToUint8Array(bk),
		)

		const bucketEncMailSessionKey = encryptKey(bk, sk)
		await prepareBucketKeyInstance(
			bucketEncMailSessionKey,
			fileSessionKeys,
			bk,
			pubEncBucketKey,
			recipientUser,
			mail,
			undefined,
			"0",
			CryptoProtocolVersion.TUTA_CRYPT,
			asymmetricCryptoFacade,
		)

		when(
			asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
				{
					keyPairType: pqKeyPairs.keyPairType,
					x25519KeyPair: pqKeyPairs.x25519KeyPair,
					kyberKeyPair: pqKeyPairs.kyberKeyPair,
				},
				CryptoProtocolVersion.TUTA_CRYPT,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(mail.bucketKey?.keyGroup),
				parseKeyVersion(assertNotNull(mail.bucketKey?.recipientKeyVersion)),
				asCryptoProtoocolVersion(assertNotNull(mail.bucketKey?.protocolVersion)),
				pubEncBucketKey,
				anything(),
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		return {
			mail,
			sk,
			bk,
			mailGroupKey: recipientUser.mailGroupKey,
			senderIdentityKeyPair,
		}
	}

	/**
	 * Prepares the environment to test receiving symmetric encrypted emails (mails sent from internal to external user) that have been sent with the simplified permission system.
	 *  - Creates group, bucket and session keys
	 *  - Creates mail literal and encrypts all encrypted attributes of the mail
	 *  - Create BucketKey object on the mail
	 *
	 * @param fileSessionKeys List of session keys for the attachments. When the list is empty there are no attachments
	 * @param externalUserGroupEncBucketKey for legacy external user group to encrypt bucket key
	 */
	async function prepareConfidentialMailToExternalRecipient(
		fileSessionKeys: Array<AesKey> = [],
		externalUserGroupEncBucketKey = false,
	): Promise<{
		entityAdapter: EntityAdapter
		bucketKey: BucketKey
		sk: AesKey
		bk: AesKey
		MailTypeModel: TypeModel
	}> {
		// create user
		const externalUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(externalUser, userFacade, keyLoaderFacade)

		// create test mail
		let confidential = true
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mailUntypedInstance = await createUntypedMailInstance(null, sk, confidential, externalUser.mailGroup._id)

		const groupKeyToEncryptBucketKey = externalUserGroupEncBucketKey ? externalUser.userGroupKey : externalUser.mailGroupKey
		const groupEncBucketKey = encryptKey(groupKeyToEncryptBucketKey, bk)
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const MailTypeModel = await typeModelResolver.resolveServerTypeReference(MailTypeRef)

		const mailInstanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
			typeInfo: createTestEntity(TypeInfoTypeRef, {
				application: MailTypeModel.app,
				typeId: String(MailTypeModel.id),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: "mailListId",
			instanceId: "mailId",
		})
		const FileTypeModel = await typeModelResolver.resolveServerTypeReference(FileTypeRef)
		const bucketEncSessionKeys = fileSessionKeys.map((fileSessionKey, index) => {
			return createTestEntity(InstanceSessionKeyTypeRef, {
				typeInfo: createTestEntity(TypeInfoTypeRef, {
					application: FileTypeModel.app,
					typeId: String(FileTypeModel.id),
				}),
				symEncSessionKey: encryptKey(bk, fileSessionKey),
				instanceList: "fileListId",
				instanceId: "fileId" + (index + 1),
			})
		})
		bucketEncSessionKeys.push(mailInstanceSessionKey)

		const bucketKey = createTestEntity(BucketKeyTypeRef, {
			pubEncBucketKey: null,
			keyGroup: externalUserGroupEncBucketKey ? externalUser.userGroup._id : null,
			groupEncBucketKey: groupEncBucketKey,
			bucketEncSessionKeys: bucketEncSessionKeys,
		})

		const bucketKeyUntypedInstance: UntypedInstance = await instancePipeline.mapAndEncrypt(BucketKeyTypeRef, bucketKey, null)

		mailUntypedInstance[assertNotNull(AttributeModel.getAttributeId(MailTypeModel, "bucketKey"))] = [bucketKeyUntypedInstance]
		const mailEncryptedParsedInstance = await instancePipeline.typeMapper.applyJsTypes(MailTypeModel, mailUntypedInstance)

		return {
			entityAdapter: await EntityAdapter.from(MailTypeModel, mailEncryptedParsedInstance, instancePipeline),
			bucketKey,
			sk,
			bk,
			MailTypeModel,
		}
	}

	/**
	 * Prepares the environment to test receiving symmetric encrypted emails from an external sender(mails sent from external to internal user) that have been sent with the simplified permission system.
	 *  - Creates group, bucket and session keys
	 *  - Creates mail literal and encrypts all encrypted attributes of the mail
	 *  - Create BucketKey object on the mail
	 *
	 * @param fileSessionKeys List of session keys for the attachments. When the list is empty there are no attachments
	 */
	async function prepareConfidentialReplyFromExternalUser(): Promise<{
		entityAdapter: EntityAdapter
		bucketKey: BucketKey
		sk: AesKey
		bk: AesKey
		MailTypeModel: TypeModel
		internalUser: TestUser
		externalUser: TestUser
		recipientKeyVersion: KeyVersion
	}> {
		// Setup test users and groups
		const internalUser = createTestUser("Alice", entityClient)
		const externalUser = createTestUser("Bob", entityClient)

		// Setup relationship between internal and external user
		externalUser.userGroup.admin = internalUser.userGroup._id
		externalUser.userGroup.adminGroupEncGKey = encryptKey(internalUser.userGroupKey, externalUser.userGroupKey)
		externalUser.userGroup.adminGroupKeyVersion = "0"
		externalUser.mailGroup.admin = externalUser.userGroup._id
		externalUser.mailGroup.adminGroupEncGKey = encryptKey(externalUser.userGroupKey, externalUser.mailGroupKey)
		externalUser.mailGroup.adminGroupKeyVersion = "4"
		const recipientKeyVersion = "5"
		externalUser.userGroup.groupKeyVersion = "7"
		externalUser.mailGroup.groupKeyVersion = "8"

		configureLoggedInUser(internalUser, userFacade, keyLoaderFacade)

		when(keyLoaderFacade.loadSymGroupKey(externalUser.mailGroup._id, parseKeyVersion(recipientKeyVersion), anything())).thenResolve(
			externalUser.mailGroupKey,
		)
		when(keyLoaderFacade.loadSymGroupKey(externalUser.userGroup._id, parseKeyVersion(externalUser.mailGroup.adminGroupKeyVersion), anything())).thenResolve(
			externalUser.userGroupKey,
		)

		// setup test mail (confidential reply from external)
		let confidential = true
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()
		const untypedMailInstance = await createUntypedMailInstance(null, sk, confidential, internalUser.mailGroup._id)

		const keyGroup = externalUser.mailGroup._id
		const groupEncBucketKey = encryptKey(externalUser.mailGroupKey, bk)
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const MailTypeModel = await typeModelResolver.resolveServerTypeReference(MailTypeRef)
		const mailInstanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
			typeInfo: createTestEntity(TypeInfoTypeRef, {
				application: MailTypeModel.app,
				typeId: String(MailTypeModel.id),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: "mailListId",
			instanceId: "mailId",
		})

		const bucketEncSessionKeys = new Array<InstanceSessionKey>()
		bucketEncSessionKeys.push(mailInstanceSessionKey)

		const bucketKey = createTestEntity(BucketKeyTypeRef, {
			pubEncBucketKey: null,
			keyGroup: keyGroup,
			groupEncBucketKey: groupEncBucketKey,
			recipientKeyVersion,
			bucketEncSessionKeys: bucketEncSessionKeys,
			protocolVersion: CryptoProtocolVersion.SYMMETRIC_ENCRYPTION,
			senderKeyVersion: null,
		})

		const bucketKeyUntypedInstance: UntypedInstance = await instancePipeline.mapAndEncrypt(BucketKeyTypeRef, bucketKey, null)

		untypedMailInstance[assertNotNull(AttributeModel.getAttributeId(MailTypeModel, "bucketKey"))] = [bucketKeyUntypedInstance]

		const encryptedMailParsedInstance = await instancePipeline.typeMapper.applyJsTypes(MailTypeModel, untypedMailInstance)
		const entityAdapter = await EntityAdapter.from(MailTypeModel, encryptedMailParsedInstance, instancePipeline)

		return {
			entityAdapter: entityAdapter,
			bucketKey,
			sk,
			bk,
			MailTypeModel,
			internalUser,
			externalUser,
			recipientKeyVersion: parseKeyVersion(recipientKeyVersion),
		}
	}

	async function createUntypedMailInstance(
		ownerGroupKey: AesKey | null,
		sessionKey: AesKey,
		confidential: boolean,
		ownerGroupId: string,
	): Promise<ServerModelUntypedInstance> {
		const mail = createMail({
			_format: "0",
			_ownerGroup: ownerGroupId,
			_ownerEncSessionKey: ownerGroupKey ? encryptKey(ownerGroupKey, sessionKey) : null,
			_permissions: "permissionListId",
			_id: ["mailListId", "mailId"],
			receivedDate: new Date(1470039025474),
			state: "",
			unread: true,
			subject: "any subject",
			replyType: "",
			confidential: confidential,
			sender: createMailAddress({
				address: senderAddress,
				name: "any sender",
				contact: null,
			}),
			bucketKey: null,
			authStatus: null,
			listUnsubscribe: false,
			method: "",
			phishingStatus: "0",
			recipientCount: "0",
			differentEnvelopeSender: null,
			movedTime: null,
			encryptionAuthStatus: null,
			_ownerKeyVersion: null,

			attachments: [],
			conversationEntry: ["entryListId", "entryId"],
			firstRecipient: null,
			mailDetails: null,
			mailDetailsDraft: null,
			sets: [],
			keyVerificationState: null,
			processingState: ProcessingState.INBOX_RULE_APPLIED,
			clientSpamClassifierResult: null,
			processNeeded: false,
		})

		// casting here is fine, since we just want to mimic server response data
		return (await instancePipeline.mapAndEncrypt(MailTypeRef, mail, sessionKey)) as unknown as ServerModelUntypedInstance
	}
})

export function createTestUser(name: string, entityClient: EntityClient): TestUser {
	const userGroupKey = aes256RandomKey()
	const mailGroupKey = aes256RandomKey()

	const userGroup = createTestEntity(GroupTypeRef, {
		_id: "userGroup" + name,
		type: GroupType.User,
		currentKeys: null,
		groupKeyVersion: "0",
	})

	const mailGroup = createTestEntity(GroupTypeRef, {
		_id: "mailGroup" + name,
		type: GroupType.Mail,
		currentKeys: null,
		groupKeyVersion: "0",
	})

	const userGroupMembership = createTestEntity(GroupMembershipTypeRef, {
		group: userGroup._id,
	})
	const mailGroupMembership = createTestEntity(GroupMembershipTypeRef, {
		group: mailGroup._id,
	})

	const user = createTestEntity(UserTypeRef, {
		userGroup: userGroupMembership,
		memberships: [mailGroupMembership],
	})

	when(entityClient.load(GroupTypeRef, userGroup._id)).thenResolve(userGroup)
	when(entityClient.load(GroupTypeRef, mailGroup._id)).thenResolve(mailGroup)
	return {
		user,
		userGroup,
		mailGroup,
		userGroupKey,
		mailGroupKey,
		name,
	}
}

/**
 * Helper function to mock the user facade so that the given test user is considered as logged in user.
 */
export function configureLoggedInUser(testUser: TestUser, userFacade: UserFacade, keyLoaderFacade: KeyLoaderFacade) {
	when(userFacade.getLoggedInUser()).thenReturn(testUser.user)
	when(keyLoaderFacade.getCurrentSymGroupKey(testUser.mailGroup._id)).thenResolve({
		object: testUser.mailGroupKey,
		version: 0,
	})
	when(keyLoaderFacade.getCurrentSymGroupKey(testUser.userGroup._id)).thenResolve({
		object: testUser.userGroupKey,
		version: 0,
	})
	when(userFacade.hasGroup(testUser.userGroup._id)).thenReturn(true)
	when(userFacade.hasGroup(testUser.mailGroup._id)).thenReturn(true)
	when(userFacade.getCurrentUserGroupKey()).thenReturn({ object: testUser.userGroupKey, version: 0 })
	when(userFacade.isLeader()).thenReturn(true)
	when(userFacade.isFullyLoggedIn()).thenReturn(true)
	when(keyLoaderFacade.loadSymGroupKey(testUser.mailGroup._id, 0)).thenResolve(testUser.mailGroupKey)
	when(keyLoaderFacade.loadSymGroupKey(testUser.userGroup._id, 0)).thenResolve(testUser.userGroupKey)
}
