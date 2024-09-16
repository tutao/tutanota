import o from "@tutao/otest"
import {
	arrayEquals,
	assertNotNull,
	hexToUint8Array,
	neverNull,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
	Versioned,
} from "@tutao/tutanota-utils"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade.js"
import {
	asCryptoProtoocolVersion,
	BucketPermissionType,
	CryptoProtocolVersion,
	EncryptionAuthStatus,
	GroupType,
	PermissionType,
	PublicKeyIdentifierType,
} from "../../../../../src/common/api/common/TutanotaConstants.js"
import {
	BirthdayTypeRef,
	ContactTypeRef,
	FileTypeRef,
	InternalRecipientKeyData,
	Mail,
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
	createPublicKeyGetIn,
	createPublicKeyGetOut,
	createTypeInfo,
	CustomerAccountTerminationRequestTypeRef,
	Group,
	GroupMembershipTypeRef,
	GroupTypeRef,
	InstanceSessionKey,
	InstanceSessionKeyTypeRef,
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
	EccKeyPair,
	EccPublicKey,
	ENABLE_MAC,
	encryptKey,
	encryptRsaKey,
	generateEccKeyPair,
	IV_BYTE_LENGTH,
	kyberPrivateKeyToBytes,
	kyberPublicKeyToBytes,
	pqKeyPairsToPublicKeys,
	random,
	rsaPrivateKeyToHex,
	rsaPublicKeyToHex,
} from "@tutao/tutanota-crypto"
import { InstanceMapper } from "../../../../../src/common/api/worker/crypto/InstanceMapper.js"
import type { TypeModel } from "../../../../../src/common/api/common/EntityTypes.js"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { matchers, object, verify, when } from "testdouble"
import { PublicKeyService, UpdatePermissionKeyService } from "../../../../../src/common/api/entities/sys/Services.js"
import { getListId, isSameId } from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { HttpMethod, resolveTypeReference, typeModels } from "../../../../../src/common/api/common/EntityFunctions.js"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { SessionKeyNotFoundError } from "../../../../../src/common/api/common/error/SessionKeyNotFoundError.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { encodePQMessage, PQBucketKeyEncapsulation } from "../../../../../src/common/api/worker/facades/PQMessage.js"
import { createTestEntity } from "../../../TestUtils.js"
import { RSA_TEST_KEYPAIR } from "../facades/RsaPqPerformanceTest.js"
import { DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache.js"
import { loadLibOQSWASM } from "../WASMTestUtils.js"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade.js"
import { AsymmetricCryptoFacade, convertToVersionedPublicKeys } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade.js"

const { captor, anything, argThat } = matchers

const kyberFacade = new WASMKyberFacade(await loadLibOQSWASM())
const pqFacade: PQFacade = new PQFacade(kyberFacade)
let asymmetricCryptoFacade: AsymmetricCryptoFacade

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

async function prepareBucketKeyInstance(
	bucketEncMailSessionKey: Uint8Array,
	fileSessionKeys: Array<AesKey>,
	bk: number[],
	pubEncBucketKey: Uint8Array,
	recipientUser: TestUser,
	instanceMapper: InstanceMapper,
	mailLiteral: Record<string, any>,
	senderPubEccKey?: Versioned<EccPublicKey>,
	recipientKeyVersion: NumberString = "0",
	protocolVersion: CryptoProtocolVersion = CryptoProtocolVersion.TUTA_CRYPT,
) {
	const MailTypeModel = await resolveTypeReference(MailTypeRef)

	const mailInstanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
		typeInfo: createTestEntity(TypeInfoTypeRef, {
			application: MailTypeModel.app,
			typeId: String(MailTypeModel.id),
		}),
		symEncSessionKey: bucketEncMailSessionKey,
		instanceList: "mailListId",
		instanceId: "mailId",
	})
	const FileTypeModel = await resolveTypeReference(FileTypeRef)
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
			Number(bucketKey.recipientKeyVersion),
			asCryptoProtoocolVersion(bucketKey.protocolVersion),
			pubEncBucketKey,
		),
	).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderPubEccKey?.object ?? null })

	const BucketKeyModel = await resolveTypeReference(BucketKeyTypeRef)
	const bucketKeyLiteral = await instanceMapper.encryptAndMapToLiteral(BucketKeyModel, bucketKey, null)
	Object.assign(mailLiteral, { bucketKey: bucketKeyLiteral })
	return { MailTypeModel, bucketKey }
}

o.spec("CryptoFacadeTest", function () {
	let restClient: RestClient

	let instanceMapper = new InstanceMapper()
	let serviceExecutor: IServiceExecutor
	let entityClient: EntityClient
	let ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue
	let crypto: CryptoFacade
	let userFacade: UserFacade
	let keyLoaderFacade: KeyLoaderFacade
	let cache: DefaultEntityRestCache

	o.before(function () {
		restClient = object()
		when(restClient.request(anything(), anything(), anything())).thenResolve(undefined)
		userFacade = object()
		keyLoaderFacade = object()
		cache = object()
	})

	o.beforeEach(function () {
		serviceExecutor = object()
		entityClient = object()
		asymmetricCryptoFacade = object()
		ownerEncSessionKeysUpdateQueue = object()
		crypto = new CryptoFacade(
			userFacade,
			entityClient,
			restClient,
			serviceExecutor,
			instanceMapper,
			ownerEncSessionKeysUpdateQueue,
			cache,
			keyLoaderFacade,
			asymmetricCryptoFacade,
		)
	})

	o("resolve session key: unencrypted instance", async function () {
		const dummyDate = new Date().getTime().toString()
		const customerAccountTerminationRequestLiteral = {
			_format: 0,
			terminationDate: dummyDate,
			terminationRequestDate: dummyDate,
			customer: "customerId",
		}
		const CustomerAccountTerminationTypeModel = await resolveTypeReference(CustomerAccountTerminationRequestTypeRef)
		o(await crypto.resolveSessionKey(CustomerAccountTerminationTypeModel, customerAccountTerminationRequestLiteral)).equals(null)
	})

	o("resolve session key: _ownerEncSessionKey instance.", async function () {
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		const sk = aes256RandomKey()

		const mail = createMailLiteral(recipientUser.mailGroupKey, sk, subject, confidential, senderName, recipientUser.name, recipientUser.mailGroup._id)

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: _ownerEncSessionKey instance, fetches correct version.", async function () {
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		const sk = aes256RandomKey()

		const groupKey_v1 = aes256RandomKey()
		when(keyLoaderFacade.loadSymGroupKey(recipientUser.mailGroup._id, 1)).thenResolve(groupKey_v1)
		const mail = createMailLiteral(groupKey_v1, sk, subject, confidential, senderName, recipientUser.name, recipientUser.mailGroup._id)
		mail._ownerKeyVersion = "1"

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey: AesKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	const protocolVersion = CryptoProtocolVersion.TUTA_CRYPT
	o("resolve session key: rsa public key decryption of session key.", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
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

		const mail = createMailLiteral(null, sk, subject, confidential, senderName, recipientUser.name, recipientUser.mailGroup._id)

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
				Number(bucketPermission.pubKeyVersion),
				protocolVersion,
				pubEncBucketKey,
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

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key.", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		let pqKeyPairs = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateEccKeyPair()

		// configure test mail
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mail = createMailLiteral(null, sk, subject, confidential, senderName, recipientTestUser.name, recipientTestUser.mailGroup._id)
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
			generateEccKeyPair(),
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
				Number(bucketPermission.pubKeyVersion),
				protocolVersion,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PUT, anything())).thenResolve(undefined)
		when(entityClient.loadAll(BucketPermissionTypeRef, getListId(bucketPermission))).thenResolve([bucketPermission])
		when(entityClient.loadAll(PermissionTypeRef, getListId(permission))).thenResolve([permission])

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key, fetches correct recipient key version", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		const pqKeyPairs_v1 = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateEccKeyPair()

		// configure test mail
		const sk = aes256RandomKey()
		const bk = aes256RandomKey()

		const mail = createMailLiteral(null, sk, subject, confidential, senderName, recipientTestUser.name, recipientTestUser.mailGroup._id)
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
			generateEccKeyPair(),
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
				Number(bucketPermission.pubKeyVersion),
				protocolVersion,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })
		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PUT, anything())).thenResolve(undefined)
		when(entityClient.loadAll(BucketPermissionTypeRef, getListId(bucketPermission))).thenResolve([bucketPermission])
		when(entityClient.loadAll(PermissionTypeRef, getListId(permission))).thenResolve([permission])

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	o("resolve session key: pq public key decryption of session key using bucketKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while

		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"

		const recipientTestUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientTestUser, userFacade, keyLoaderFacade)

		const pqKeyPairs_v1 = await pqFacade.generateKeyPairs()

		const senderIdentityKeyPair = generateEccKeyPair()

		// configure test mail
		const sk = aes256RandomKey()
		const bk = aes256RandomKey()

		const mail = createMailLiteral(null, sk, subject, confidential, senderName, recipientTestUser.name, recipientTestUser.mailGroup._id)
		const bucketEncMailSessionKey = encryptKey(bk, sk)
		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateEccKeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs_v1),
			bitArrayToUint8Array(bk),
		)

		Object.assign(mail, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

		const senderKeyVersion = 1
		await prepareBucketKeyInstance(
			bucketEncMailSessionKey,
			[],
			bk,
			pubEncBucketKey,
			recipientTestUser,
			instanceMapper,
			mail,
			{
				object: senderIdentityKeyPair.publicKey,
				version: senderKeyVersion,
			},
			"1",
			protocolVersion,
		)

		when(
			asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
				{
					keyPairType: pqKeyPairs_v1.keyPairType,
					eccKeyPair: pqKeyPairs_v1.eccKeyPair,
					kyberKeyPair: pqKeyPairs_v1.kyberKeyPair,
				},
				protocolVersion,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })
		when(userFacade.createAuthHeaders()).thenReturn({})
		when(restClient.request(anything(), HttpMethod.PUT, anything())).thenResolve(undefined)
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				senderIdentityKeyPair.publicKey,
				senderKeyVersion,
			),
		).thenResolve(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		const sessionKey = neverNull(await crypto.resolveSessionKey(MailTypeModel, mail))

		o(sessionKey).deepEquals(sk)
	})

	o("enforceSessionKeyUpdateIfNeeded: _ownerEncSessionKey already defined", async function () {
		const files = [createTestEntity(FileTypeRef, { _ownerEncSessionKey: new Uint8Array() })]
		await crypto.enforceSessionKeyUpdateIfNeeded({}, files)
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
		Object.assign(testData.mailLiteral, { body: "bodyId" })
		const mail = createTestEntity(MailTypeRef, testData.mailLiteral)

		when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
			createPublicKeyGetOut({
				pubEccKey: testData.senderIdentityKeyPair.publicKey,
				pubKeyVersion: "0",
				pubKyberKey: null,
				pubRsaKey: null,
			}),
		)

		// const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
		const updatedFiles = await crypto.enforceSessionKeyUpdateIfNeeded(mail, files)
		verify(ownerEncSessionKeysUpdateQueue.postUpdateSessionKeysService(anything()), { times: 1 })
		verify(cache.deleteFromCacheIfExists(FileTypeRef, "listId", "2"))
	})

	o("encryptBucketKeyForInternalRecipient with existing PQKeys for sender and recipient", async () => {
		const cryptoFacadeTmp = new CryptoFacade(
			userFacade,
			entityClient,
			restClient,
			serviceExecutor,
			instanceMapper,
			ownerEncSessionKeysUpdateQueue,
			cache,
			keyLoaderFacade,
			asymmetricCryptoFacade,
		)
		let senderMailAddress = "alice@tutanota.com"
		let recipientMailAddress = "bob@tutanota.com"
		let senderGroupKey = aes256RandomKey()
		let bk = aes256RandomKey()

		const recipientKeyPairs = await pqFacade.generateKeyPairs()

		const recipientKeyPair = createKeyPair({
			_id: "recipientKeyPairId",
			pubEccKey: recipientKeyPairs.eccKeyPair.publicKey,
			symEncPrivEccKey: null,
			pubKyberKey: kyberPublicKeyToBytes(recipientKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: null,
			pubRsaKey: null,
			symEncPrivRsaKey: null,
		})

		const senderKeyPairs = await pqFacade.generateKeyPairs()

		const senderKeyPair = createKeyPair({
			_id: "senderKeyPairId",
			pubRsaKey: null,
			symEncPrivRsaKey: null,
			pubEccKey: senderKeyPairs.eccKeyPair.publicKey,
			symEncPrivEccKey: aesEncrypt(senderGroupKey, senderKeyPairs.eccKeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(senderKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(senderGroupKey, kyberPrivateKeyToBytes(senderKeyPairs.kyberKeyPair.privateKey)),
		})

		const senderUserGroup = createGroup({
			_format: "",
			_ownerGroup: "",
			_permissions: "",
			admin: "admin1",
			adminGroupEncGKey: null,
			adminGroupKeyVersion: null,
			administratedGroups: null,
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
			formerGroupKeys: null,
			pubAdminGroupEncGKey: null,
		})
		when(keyLoaderFacade.loadCurrentKeyPair(senderUserGroup._id)).thenResolve({ version: 0, object: senderKeyPairs })

		const notFoundRecipients = []
		const pqEncapsulation: PQBucketKeyEncapsulation = {
			kyberCipherText: new Uint8Array([1]),
			kekEncBucketKey: new Uint8Array([2]),
		}

		const encodedPqMessage: Uint8Array = encodePQMessage({
			senderIdentityPubKey: senderKeyPair.pubEccKey!,
			ephemeralPubKey: senderKeyPair.pubEccKey!,
			encapsulation: pqEncapsulation,
		})

		const recipientPublicKeyGetOut = createPublicKeyGetOut({
			pubKeyVersion: "0",
			pubEccKey: recipientKeyPair.pubEccKey,
			pubKyberKey: recipientKeyPair.pubKyberKey,
			pubRsaKey: null,
		})
		when(
			serviceExecutor.get(
				PublicKeyService,
				createPublicKeyGetIn({ identifierType: PublicKeyIdentifierType.MAIL_ADDRESS, identifier: recipientMailAddress, version: null }),
			),
		).thenResolve(recipientPublicKeyGetOut)
		when(
			serviceExecutor.get(
				PublicKeyService,
				createPublicKeyGetIn({ identifierType: PublicKeyIdentifierType.MAIL_ADDRESS, identifier: senderMailAddress, version: "0" }),
			),
		).thenResolve(
			createPublicKeyGetOut({
				pubKeyVersion: "0",
				pubEccKey: senderKeyPair.pubEccKey,
				pubKyberKey: senderKeyPair.pubKyberKey,
				pubRsaKey: null,
			}),
		)
		when(entityClient.load(GroupTypeRef, senderUserGroup._id)).thenResolve(senderUserGroup)
		when(keyLoaderFacade.getCurrentSymGroupKey(senderUserGroup._id)).thenResolve({ object: senderGroupKey, version: 0 })
		when(asymmetricCryptoFacade.asymEncryptSymKey(bk, convertToVersionedPublicKeys(recipientPublicKeyGetOut), senderUserGroup._id)).thenResolve({
			recipientKeyVersion: Number(recipientPublicKeyGetOut.pubKeyVersion),
			senderKeyVersion: Number(senderUserGroup.groupKeyVersion),
			pubEncSymKeyBytes: encodedPqMessage,
			cryptoProtocolVersion: CryptoProtocolVersion.TUTA_CRYPT,
		})

		const internalRecipientKeyData = (await cryptoFacadeTmp.encryptBucketKeyForInternalRecipient(
			senderUserGroup._id,
			bk,
			recipientMailAddress,
			notFoundRecipients,
		)) as InternalRecipientKeyData

		o(internalRecipientKeyData!.recipientKeyVersion).equals("0")
		o(internalRecipientKeyData.protocolVersion).equals(CryptoProtocolVersion.TUTA_CRYPT)
		o(internalRecipientKeyData!.mailAddress).equals(recipientMailAddress)
		o(internalRecipientKeyData!.pubEncBucketKey).deepEquals(encodedPqMessage)
		verify(serviceExecutor.put(PublicKeyService, anything()), { times: 0 })
	})

	o("encryptBucketKeyForInternalRecipient with existing PQKeys for sender", async () => {
		const cryptoFacadeTmp = new CryptoFacade(
			userFacade,
			entityClient,
			restClient,
			serviceExecutor,
			instanceMapper,
			ownerEncSessionKeysUpdateQueue,
			cache,
			keyLoaderFacade,
			asymmetricCryptoFacade,
		)
		let senderMailAddress = "alice@tutanota.com"
		let recipientMailAddress = "bob@tutanota.com"
		let senderGroupKey = aes256RandomKey()
		let bk = aes256RandomKey()

		const recipientKeyPairs = RSA_TEST_KEYPAIR

		const recipientKeyPair = createKeyPair({
			_id: "recipientKeyPairId",
			pubRsaKey: hexToUint8Array(rsaPublicKeyToHex(recipientKeyPairs.publicKey)),
			symEncPrivRsaKey: aesEncrypt(senderGroupKey, hexToUint8Array(rsaPrivateKeyToHex(recipientKeyPairs.privateKey))),
			pubEccKey: null,
			pubKyberKey: null,
			symEncPrivEccKey: null,
			symEncPrivKyberKey: null,
		})

		const senderKeyPairs = await pqFacade.generateKeyPairs()

		const senderKeyPair = createKeyPair({
			_id: "senderKeyPairId",
			pubEccKey: senderKeyPairs.eccKeyPair.publicKey,
			symEncPrivEccKey: aesEncrypt(senderGroupKey, senderKeyPairs.eccKeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(senderKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(senderGroupKey, kyberPrivateKeyToBytes(senderKeyPairs.kyberKeyPair.privateKey)),
			pubRsaKey: null,
			symEncPrivRsaKey: null,
		})

		const senderUserGroup = createGroup({
			_id: "userGroupId",
			currentKeys: senderKeyPair,
			groupKeyVersion: "0",
			_permissions: "",
			admin: null,
			adminGroupEncGKey: null,
			adminGroupKeyVersion: null,
			administratedGroups: null,
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
			formerGroupKeys: null,
			pubAdminGroupEncGKey: null,
		})
		when(keyLoaderFacade.loadCurrentKeyPair(senderUserGroup._id)).thenResolve({ version: 0, object: senderKeyPairs })
		const notFoundRecipients = []

		const recipientPublicKeyGetOut = createPublicKeyGetOut({
			pubKeyVersion: "0",
			pubRsaKey: recipientKeyPair.pubRsaKey,
			pubEccKey: null,
			pubKyberKey: null,
		})
		when(
			serviceExecutor.get(
				PublicKeyService,
				createPublicKeyGetIn({ identifierType: PublicKeyIdentifierType.MAIL_ADDRESS, identifier: recipientMailAddress, version: null }),
			),
		).thenResolve(recipientPublicKeyGetOut)
		when(
			serviceExecutor.get(
				PublicKeyService,
				createPublicKeyGetIn({ identifierType: PublicKeyIdentifierType.MAIL_ADDRESS, identifier: senderMailAddress, version: null }),
			),
		).thenResolve(
			createPublicKeyGetOut({
				pubKeyVersion: "0",
				pubEccKey: senderKeyPair.pubEccKey,
				pubKyberKey: senderKeyPair.pubKyberKey,
				_ownerGroup: "",
				pubRsaKey: null,
			}),
		)
		when(entityClient.load(GroupTypeRef, senderUserGroup._id)).thenResolve(senderUserGroup)
		when(keyLoaderFacade.getCurrentSymGroupKey(senderUserGroup._id)).thenResolve({ object: senderGroupKey, version: 0 })
		const pubEncBucketKey = object<Uint8Array>()
		when(asymmetricCryptoFacade.asymEncryptSymKey(bk, convertToVersionedPublicKeys(recipientPublicKeyGetOut), senderUserGroup._id)).thenResolve({
			recipientKeyVersion: Number(recipientPublicKeyGetOut.pubKeyVersion),
			senderKeyVersion: Number(senderUserGroup.groupKeyVersion),
			pubEncSymKeyBytes: pubEncBucketKey,
			cryptoProtocolVersion: CryptoProtocolVersion.RSA,
		})

		const internalRecipientKeyData = (await cryptoFacadeTmp.encryptBucketKeyForInternalRecipient(
			senderUserGroup._id,
			bk,
			recipientMailAddress,
			notFoundRecipients,
		)) as InternalRecipientKeyData

		o(internalRecipientKeyData!.recipientKeyVersion).equals("0")
		o(internalRecipientKeyData!.mailAddress).equals(recipientMailAddress)
		o(internalRecipientKeyData.protocolVersion).equals(CryptoProtocolVersion.RSA)
		o(internalRecipientKeyData.pubEncBucketKey).deepEquals(pubEncBucketKey)
		verify(serviceExecutor.put(PublicKeyService, anything()), { times: 0 })
	})

	o("authenticateSender | sender is authenticated for correct SenderIdentityKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		const senderKeyVersion = "0"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				Number(senderKeyVersion),
			),
		).thenResolve(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
	})

	o("authenticateSender | sender is authenticated for correct SenderIdentityKey from system@tutanota.de", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest([], false)
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		const senderKeyVersion = "0"
		const senderIdentifier = "system@tutanota.de"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderIdentifier,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				Number(senderKeyVersion),
			),
		).thenResolve(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
	})

	o("authenticateSender | sender is not authenticated for incorrect SenderIdentityKey", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		const senderKeyVersion = "0"
		when(
			asymmetricCryptoFacade.authenticateSender(
				{
					identifier: senderAddress,
					identifierType: PublicKeyIdentifierType.MAIL_ADDRESS,
				},
				testData.senderIdentityKeyPair.publicKey,
				Number(senderKeyVersion),
			),
		).thenResolve(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED)
	})

	o("authenticateSender | no authentication needed for sender with RSAKeypair", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
		o(sessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.RSA_NO_AUTHENTICATION)
	})

	o("authenticateSender | no authentication needed for secure external recipient", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const file1SessionKey = aes256RandomKey()
		const file2SessionKey = aes256RandomKey()
		const testData = await prepareConfidentialMailToExternalRecipient([file1SessionKey, file2SessionKey])
		Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

		const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
		o(mailSessionKey).deepEquals(testData.sk)

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.AES_NO_AUTHENTICATION)
	})

	o("authenticateSender | no authentication needed for secure external sender", async function () {
		//o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareConfidentialReplyFromExternalUser()
		const externalUser = testData.externalUser

		const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
		o(mailSessionKey).deepEquals(testData.sk)

		const mailCaptor = matchers.captor()
		const userCaptor = matchers.captor()
		verify(keyLoaderFacade.loadSymGroupKey(externalUser.userGroup._id, Number(externalUser.mailGroup.adminGroupKeyVersion), userCaptor.capture()))
		verify(keyLoaderFacade.loadSymGroupKey(externalUser.mailGroup._id, testData.recipientKeyVersion, mailCaptor.capture()))
		o(userCaptor.value.version).equals(Number(externalUser.userGroup.groupKeyVersion))
		o(mailCaptor.value.version).equals(Number(externalUser.mailGroup.groupKeyVersion))

		const updatedInstanceSessionKeysCaptor = captor()
		verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()), { times: 1 })
		const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value as Array<InstanceSessionKey>
		o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
		const mailInstanceSessionKey = updatedInstanceSessionKeys.find((instanceSessionKey) =>
			isSameId([instanceSessionKey.instanceList, instanceSessionKey.instanceId], testData.mailLiteral._id),
		)

		const actualAutStatus = utf8Uint8ArrayToString(aesDecrypt(testData.sk, neverNull(mailInstanceSessionKey).encryptionAuthStatus!))
		o(actualAutStatus).deepEquals(EncryptionAuthStatus.AES_NO_AUTHENTICATION)
	})

	o.spec("instance migrations", function () {
		o.beforeEach(function () {
			when(entityClient.update(anything())).thenResolve(undefined)
		})
		o("contact migration without birthday", async function () {
			const contact = createTestEntity(ContactTypeRef)

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals(null)
			verify(entityClient.update(anything()), { times: 0 })
		})

		o("contact migration without existing birthday", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				birthdayIso: "2019-05-01",
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals("2019-05-01")
			verify(entityClient.update(anything()), { times: 0 })
		})

		o("contact migration without existing birthday and oldBirthdayDate", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				_id: ["listid", "id"],
				birthdayIso: "2019-05-01",
				oldBirthdayDate: new Date(2000, 4, 1),
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)
			o(migratedContact.birthdayIso).equals("2019-05-01")
			o(migratedContact.oldBirthdayAggregate).equals(null)
			o(migratedContact.oldBirthdayDate).equals(null)
			verify(entityClient.update(anything()), { times: 1 })
		})

		o("contact migration with existing birthday and oldBirthdayAggregate", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				_id: ["listid", "id"],
				birthdayIso: "2019-05-01",
				oldBirthdayAggregate: createTestEntity(BirthdayTypeRef, {
					day: "01",
					month: "05",
					year: "2000",
				}),
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals("2019-05-01")
			o(migratedContact.oldBirthdayAggregate).equals(null)
			o(migratedContact.oldBirthdayDate).equals(null)
			verify(entityClient.update(anything()), { times: 1 })
		})

		o("contact migration from oldBirthdayAggregate", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				_id: ["listid", "id"],
				oldBirthdayDate: new Date(1800, 4, 1),
				oldBirthdayAggregate: createTestEntity(BirthdayTypeRef, {
					day: "01",
					month: "05",
					year: "2000",
				}),
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals("2000-05-01")
			o(migratedContact.oldBirthdayAggregate).equals(null)
			o(migratedContact.oldBirthdayDate).equals(null)
			verify(entityClient.update(anything()), { times: 1 })
		})

		o("contact migration from oldBirthdayDate", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				_id: ["listid", "id"],
				birthdayIso: null,
				oldBirthdayDate: new Date(1800, 4, 1),
				oldBirthdayAggregate: null,
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals("1800-05-01")
			o(migratedContact.oldBirthdayAggregate).equals(null)
			o(migratedContact.oldBirthdayDate).equals(null)
			verify(entityClient.update(anything()), { times: 1 })
		})

		o("contact migration from oldBirthdayAggregate without year", async function () {
			const contact = createTestEntity(ContactTypeRef, {
				_id: ["listid", "id"],
				birthdayIso: null,
				oldBirthdayDate: null,
				oldBirthdayAggregate: createTestEntity(BirthdayTypeRef, {
					day: "01",
					month: "05",
					year: null,
				}),
			})

			const migratedContact = await crypto.applyMigrationsForInstance(contact)

			o(migratedContact.birthdayIso).equals("--05-01")
			o(migratedContact.oldBirthdayAggregate).equals(null)
			o(migratedContact.oldBirthdayDate).equals(null)
			verify(entityClient.update(anything()), { times: 1 })
		})
	})

	o("resolve session key: rsa public key decryption of mail session key using BucketKey aggregated type - Mail referencing MailBody", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o("resolve session key: rsa public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsDraft", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { mailDetailsDraft: ["draftDetailsListId", "draftDetailsId"] })

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: rsa public key decryption of mail session key using BucketKey aggregated type - already decoded/decrypted Mail referencing MailDetailsDraft",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
			Object.assign(testData.mailLiteral, {
				mailDetailsDraft: ["draftDetailsListId", "draftDetailsId"],
			})

			const mailInstance = await instanceMapper.decryptAndMapToInstance<Mail>(testData.MailTypeModel, testData.mailLiteral, testData.sk)

			// do not use testdouble here because it's hard to not break the function itself and then verify invocations
			const decryptAndMapToInstance = (instanceMapper.decryptAndMapToInstance = spy(instanceMapper.decryptAndMapToInstance))
			const convertBucketKeyToInstanceIfNecessary = (crypto.convertBucketKeyToInstanceIfNecessary = spy(crypto.convertBucketKeyToInstanceIfNecessary))

			const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, mailInstance))
			o(decryptAndMapToInstance.invocations.length).equals(0)
			o(convertBucketKeyToInstanceIfNecessary.invocations.length).equals(1)

			o(sessionKey).deepEquals(testData.sk)
		},
	)

	o("resolve session key: rsa public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: rsa public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await prepareRsaPubEncBucketKeyResolveSessionKeyTest([file1SessionKey, file2SessionKey])
			Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
			o(mailSessionKey).deepEquals(testData.sk)

			o(testData.bucketKey.bucketEncSessionKeys.length).equals(3) //mail, file1, file2
			const updatedInstanceSessionKeysCaptor = captor()
			verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
			const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value
			o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
			for (const isk of testData.bucketKey.bucketEncSessionKeys) {
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

	o("resolve session key: pq public key decryption of mail session key using BucketKey aggregated type - Mail referencing MailBody", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { body: "bodyId" })

		when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
			createPublicKeyGetOut({
				pubEccKey: testData.senderIdentityKeyPair.publicKey,
				pubKeyVersion: "0",
				pubKyberKey: null,
				pubRsaKey: null,
			}),
		)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o("resolve session key: pq public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsDraft", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { mailDetailsDraft: ["draftDetailsListId", "draftDetailsId"] })

		when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
			createPublicKeyGetOut({
				pubEccKey: testData.senderIdentityKeyPair.publicKey,
				pubKeyVersion: "0",
				pubKyberKey: null,
				pubRsaKey: null,
			}),
		)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: pq public key decryption of mail session key using BucketKey aggregated type - already decoded/decrypted Mail referencing MailDetailsDraft",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
			Object.assign(testData.mailLiteral, {
				mailDetailsDraft: ["draftDetailsListId", "draftDetailsId"],
			})

			when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
				createPublicKeyGetOut({
					pubEccKey: testData.senderIdentityKeyPair.publicKey,
					pubKeyVersion: "0",
					pubKyberKey: null,
					pubRsaKey: null,
				}),
			)

			const mailInstance = await instanceMapper.decryptAndMapToInstance<Mail>(testData.MailTypeModel, testData.mailLiteral, testData.sk)

			// do not use testdouble here because it's hard to not break the function itself and then verify invocations
			const decryptAndMapToInstance = (instanceMapper.decryptAndMapToInstance = spy(instanceMapper.decryptAndMapToInstance))
			const convertBucketKeyToInstanceIfNecessary = (crypto.convertBucketKeyToInstanceIfNecessary = spy(crypto.convertBucketKeyToInstanceIfNecessary))

			const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, mailInstance))
			// TODO is it ok to remove this: decryptAndMapToInstance is now called when resolving the session key
			// o(decryptAndMapToInstance.invocations.length).equals(0)
			o(convertBucketKeyToInstanceIfNecessary.invocations.length).equals(1)

			o(sessionKey).deepEquals(testData.sk)
		},
	)

	o("resolve session key: pq public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob", async function () {
		o.timeout(500) // in CI or with debugging it can take a while
		const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest()
		Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

		when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
			createPublicKeyGetOut({
				pubEccKey: testData.senderIdentityKeyPair.publicKey,
				pubKeyVersion: "0",
				pubKyberKey: null,
				pubRsaKey: null,
			}),
		)

		const sessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

		o(sessionKey).deepEquals(testData.sk)
	})

	o(
		"resolve session key: pq public key decryption of session key using BucketKey aggregated type - Mail referencing MailDetailsBlob with attachments",
		async function () {
			o.timeout(500) // in CI or with debugging it can take a while
			const file1SessionKey = aes256RandomKey()
			const file2SessionKey = aes256RandomKey()
			const testData = await preparePqPubEncBucketKeyResolveSessionKeyTest([file1SessionKey, file2SessionKey])
			Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

			when(serviceExecutor.get(PublicKeyService, anything())).thenResolve(
				createPublicKeyGetOut({
					pubEccKey: testData.senderIdentityKeyPair.publicKey,
					pubKeyVersion: "0",
					pubKyberKey: null,
					pubRsaKey: null,
				}),
			)

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
			o(mailSessionKey).deepEquals(testData.sk)

			o(testData.bucketKey.bucketEncSessionKeys.length).equals(3) //mail, file1, file2
			const updatedInstanceSessionKeysCaptor = captor()
			verify(ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatedInstanceSessionKeysCaptor.capture(), anything()))
			const updatedInstanceSessionKeys = updatedInstanceSessionKeysCaptor.value
			o(updatedInstanceSessionKeys.length).equals(testData.bucketKey.bucketEncSessionKeys.length)
			for (const isk of testData.bucketKey.bucketEncSessionKeys) {
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
			Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))
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
			Object.assign(testData.mailLiteral, { mailDetails: ["mailDetailsArchiveId", "mailDetailsId"] })

			const mailSessionKey = neverNull(await crypto.resolveSessionKey(testData.MailTypeModel, testData.mailLiteral))

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

		const MailDetailsBlobTypeModel = await resolveTypeReference(MailDetailsBlobTypeRef)
		const mailDetailsBlobLiteral = {
			_id: ["mailDetailsArchiveId", "mailDetailsId"],
			_ownerGroup: ownerGroup,
			_ownerEncSessionKey: encryptKey(gk, sk),
		}
		when(keyLoaderFacade.loadSymGroupKey(ownerGroup, 0)).thenResolve(gk)

		const mailDetailsBlobSessionKey = neverNull(await crypto.resolveSessionKey(MailDetailsBlobTypeModel, mailDetailsBlobLiteral))
		o(mailDetailsBlobSessionKey).deepEquals(sk)
	})

	o("resolve session key: MailDetailsBlob - session key not found", async function () {
		const MailDetailsBlobTypeModel = await resolveTypeReference(MailDetailsBlobTypeRef)
		const mailDetailsBlobLiteral = {
			_id: ["mailDetailsArchiveId", "mailDetailsId"],
			_permissions: "permissionListId",
		}
		when(entityClient.loadAll(PermissionTypeRef, "permissionListId")).thenResolve([])

		try {
			await crypto.resolveSessionKey(MailDetailsBlobTypeModel, mailDetailsBlobLiteral)
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
		mailLiteral: Record<string, any>
		bucketKey: BucketKey
		sk: Aes256Key
		bk: Aes256Key
		mailGroupKey: Aes256Key
		MailTypeModel: TypeModel
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

		// configure mail
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"

		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mailLiteral = createMailLiteral(null, sk, subject, confidential, senderName, recipientUser.name, recipientUser.mailGroup._id)

		const pubEncBucketKey = new Uint8Array([1, 2, 3, 4])
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const MailTypeModel = await resolveTypeReference(MailTypeRef)

		const mailInstanceSessionKey = createInstanceSessionKey({
			typeInfo: createTypeInfo({
				application: MailTypeModel.app,
				typeId: String(MailTypeModel.id),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: "mailListId",
			instanceId: "mailId",
			encryptionAuthStatus: null,
			symKeyVersion: "0",
		})
		const FileTypeModel = await resolveTypeReference(FileTypeRef)
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

		const BucketKeyModel = await resolveTypeReference(BucketKeyTypeRef)
		const bucketKeyLiteral = await instanceMapper.encryptAndMapToLiteral(BucketKeyModel, bucketKey, null)
		Object.assign(mailLiteral, { bucketKey: bucketKeyLiteral })

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketKey.keyGroup),
				Number(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: null })

		return {
			mailLiteral,
			bucketKey,
			sk,
			bk,
			mailGroupKey: recipientUser.mailGroupKey,
			MailTypeModel,
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
		mailLiteral: Record<string, any>
		bucketKey: BucketKey
		sk: AesKey
		bk: AesKey
		mailGroupKey: AesKey
		MailTypeModel: TypeModel
		senderIdentityKeyPair: EccKeyPair
	}> {
		// create test user
		const recipientUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(recipientUser, userFacade, keyLoaderFacade)

		let pqKeyPairs = await pqFacade.generateKeyPairs()

		const recipientKeyPair = createKeyPair({
			_id: "keyPairId",
			pubEccKey: pqKeyPairs.eccKeyPair.publicKey,
			symEncPrivEccKey: aesEncrypt(recipientUser.userGroupKey, pqKeyPairs.eccKeyPair.privateKey),
			pubKyberKey: kyberPublicKeyToBytes(pqKeyPairs.kyberKeyPair.publicKey),
			symEncPrivKyberKey: aesEncrypt(recipientUser.userGroupKey, kyberPrivateKeyToBytes(pqKeyPairs.kyberKeyPair.privateKey)),
			pubRsaKey: null,
			symEncPrivRsaKey: null,
		})

		recipientUser.userGroup.currentKeys = recipientKeyPair

		const senderIdentityKeyPair = generateEccKeyPair()

		// create test mail
		let subject = "this is our subject"
		let senderName = "TutanotaTeam"

		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mailLiteral = createMailLiteral(
			recipientUser.mailGroupKey,
			sk,
			subject,
			confidential,
			senderName,
			recipientUser.name,
			recipientUser.mailGroup._id,
		)
		// @ts-ignore
		mailLiteral._ownerEncSessionKey = null

		const pubEncBucketKey = await pqFacade.encapsulateAndEncode(
			senderIdentityKeyPair,
			generateEccKeyPair(),
			pqKeyPairsToPublicKeys(pqKeyPairs),
			bitArrayToUint8Array(bk),
		)
		const bucketEncMailSessionKey = encryptKey(bk, sk)
		const { MailTypeModel, bucketKey } = await prepareBucketKeyInstance(
			bucketEncMailSessionKey,
			fileSessionKeys,
			bk,
			pubEncBucketKey,
			recipientUser,
			instanceMapper,
			mailLiteral,
		)

		when(
			asymmetricCryptoFacade.decryptSymKeyWithKeyPair(
				{
					keyPairType: pqKeyPairs.keyPairType,
					eccKeyPair: pqKeyPairs.eccKeyPair,
					kyberKeyPair: pqKeyPairs.kyberKeyPair,
				},
				CryptoProtocolVersion.TUTA_CRYPT,
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		when(
			asymmetricCryptoFacade.loadKeyPairAndDecryptSymKey(
				assertNotNull(bucketKey.keyGroup),
				Number(bucketKey.recipientKeyVersion),
				asCryptoProtoocolVersion(bucketKey.protocolVersion),
				pubEncBucketKey,
			),
		).thenResolve({ decryptedAesKey: bk, senderIdentityPubKey: senderIdentityKeyPair.publicKey })

		return {
			mailLiteral,
			bucketKey,
			sk,
			bk,
			mailGroupKey: recipientUser.mailGroupKey,
			MailTypeModel,
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
		mailLiteral: Record<string, any>
		bucketKey: BucketKey
		sk: AesKey
		bk: AesKey
		MailTypeModel: TypeModel
	}> {
		// create user
		const externalUser = createTestUser("Bob", entityClient)
		configureLoggedInUser(externalUser, userFacade, keyLoaderFacade)

		// create test mail
		let subject = "this is our subject"
		let confidential = true
		let senderName = "TutanotaTeam"
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()

		const mailLiteral = createMailLiteral(null, sk, subject, confidential, senderName, externalUser.name, externalUser.mailGroup._id)

		const groupKeyToEncryptBucketKey = externalUserGroupEncBucketKey ? externalUser.userGroupKey : externalUser.mailGroupKey
		const groupEncBucketKey = encryptKey(groupKeyToEncryptBucketKey, bk)
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const MailTypeModel = await resolveTypeReference(MailTypeRef)

		typeModels.tutanota
		const mailInstanceSessionKey = createTestEntity(InstanceSessionKeyTypeRef, {
			typeInfo: createTestEntity(TypeInfoTypeRef, {
				application: MailTypeModel.app,
				typeId: String(MailTypeModel.id),
			}),
			symEncSessionKey: bucketEncMailSessionKey,
			instanceList: "mailListId",
			instanceId: "mailId",
		})
		const FileTypeModel = await resolveTypeReference(FileTypeRef)
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

		const BucketKeyModel = await resolveTypeReference(BucketKeyTypeRef)
		const bucketKeyLiteral = await instanceMapper.encryptAndMapToLiteral(BucketKeyModel, bucketKey, null)
		Object.assign(mailLiteral, { bucketKey: bucketKeyLiteral })

		return {
			mailLiteral,
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
		mailLiteral: Record<string, any>
		bucketKey: BucketKey
		sk: AesKey
		bk: AesKey
		MailTypeModel: TypeModel
		internalUser: TestUser
		externalUser: TestUser
		recipientKeyVersion: number
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

		when(keyLoaderFacade.loadSymGroupKey(externalUser.mailGroup._id, Number(recipientKeyVersion), anything())).thenResolve(externalUser.mailGroupKey)
		when(keyLoaderFacade.loadSymGroupKey(externalUser.userGroup._id, Number(externalUser.mailGroup.adminGroupKeyVersion), anything())).thenResolve(
			externalUser.userGroupKey,
		)

		// setup test mail (confidential reply from external)

		let subject = "this is our subject"
		let confidential = true
		let sk = aes256RandomKey()
		let bk = aes256RandomKey()
		const mailLiteral = createMailLiteral(null, sk, subject, confidential, externalUser.name, internalUser.name, internalUser.mailGroup._id)

		const keyGroup = externalUser.mailGroup._id
		const groupEncBucketKey = encryptKey(externalUser.mailGroupKey, bk)
		const bucketEncMailSessionKey = encryptKey(bk, sk)

		const MailTypeModel = await resolveTypeReference(MailTypeRef)
		typeModels.tutanota
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

		const BucketKeyModel = await resolveTypeReference(BucketKeyTypeRef)
		const bucketKeyLiteral = await instanceMapper.encryptAndMapToLiteral(BucketKeyModel, bucketKey, null)
		Object.assign(mailLiteral, { bucketKey: bucketKeyLiteral })

		return {
			mailLiteral,
			bucketKey,
			sk,
			bk,
			MailTypeModel,
			internalUser,
			externalUser,
			recipientKeyVersion: Number(recipientKeyVersion),
		}
	}
})

export function createMailLiteral(
	ownerGroupKey: AesKey | null,
	sessionKey,
	subject,
	confidential,
	senderName,
	recipientName,
	ownerGroupId: string,
): Record<string, any> {
	return {
		_format: "0",
		_area: "0",
		_owner: "ownerId",
		_ownerGroup: ownerGroupId,
		_ownerEncSessionKey: ownerGroupKey ? encryptKey(ownerGroupKey, sessionKey) : null,
		_id: ["mailListId", "mailId"],
		_permissions: "permissionListId",
		receivedDate: new Date(1470039025474).getTime().toString(),
		sentDate: new Date(1470039021474).getTime().toString(),
		state: "",
		trashed: false,
		unread: true,
		subject: uint8ArrayToBase64(aesEncrypt(sessionKey, stringToUtf8Uint8Array(subject), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
		replyType: "",
		confidential: uint8ArrayToBase64(
			aesEncrypt(sessionKey, stringToUtf8Uint8Array(confidential ? "1" : "0"), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC),
		),
		sender: {
			_id: "senderId",
			address: senderAddress,
			name: uint8ArrayToBase64(aesEncrypt(sessionKey, stringToUtf8Uint8Array(senderName), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
		},
		bccRecipients: [],
		ccRecipients: [],
		toRecipients: [
			{
				_id: "recipientId",
				address: "support@yahoo.com",
				name: uint8ArrayToBase64(
					aesEncrypt(sessionKey, stringToUtf8Uint8Array(recipientName), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC),
				),
			},
		],
		replyTos: [],
		bucketKey: null,
		attachmentCount: "0",
		authStatus: "0",
		listUnsubscribe: uint8ArrayToBase64(aesEncrypt(sessionKey, stringToUtf8Uint8Array(""), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
		method: uint8ArrayToBase64(aesEncrypt(sessionKey, stringToUtf8Uint8Array(""), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)),
		phishingStatus: "0",
		recipientCount: "0",
	}
}

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
	when(keyLoaderFacade.getCurrentSymGroupKey(testUser.mailGroup._id)).thenResolve({ object: testUser.mailGroupKey, version: 0 })
	when(keyLoaderFacade.getCurrentSymGroupKey(testUser.userGroup._id)).thenResolve({ object: testUser.userGroupKey, version: 0 })
	when(userFacade.hasGroup(testUser.userGroup._id)).thenReturn(true)
	when(userFacade.hasGroup(testUser.mailGroup._id)).thenReturn(true)
	when(userFacade.getCurrentUserGroupKey()).thenReturn({ object: testUser.userGroupKey, version: 0 })
	when(userFacade.isLeader()).thenReturn(true)
	when(userFacade.isFullyLoggedIn()).thenReturn(true)
	when(keyLoaderFacade.loadSymGroupKey(testUser.mailGroup._id, 0)).thenResolve(testUser.mailGroupKey)
	when(keyLoaderFacade.loadSymGroupKey(testUser.userGroup._id, 0)).thenResolve(testUser.userGroupKey)
}
