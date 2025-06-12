import o from "@tutao/otest"
import { aes256RandomKey, AesKey } from "@tutao/tutanota-crypto"
import { _encryptKeyWithVersionedKey, VersionedEncryptedKey, VersionedKey } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { instance, object, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue"
import { CacheStorage, DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade"
import { KeyRotationFacade } from "../../../../../src/common/api/worker/facades/KeyRotationFacade"
import { Entity, ModelValue, ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { assertNotNull, downcast, Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { RestClient } from "../../../../../src/common/api/worker/rest/RestClient"
import {
	clientInitializedTypeModelResolver,
	createTestEntity,
	instancePipelineFromTypeModelResolver,
	modelMapperFromTypeModelResolver,
	removeFinalIvs,
} from "../../../TestUtils"
import {
	createOutOfOfficeNotificationRecipientList,
	Mail,
	MailAddress,
	MailAddressTypeRef,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailFolderRefTypeRef,
	MailTypeRef,
	OutOfOfficeNotificationRecipientListTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { PatchMerger } from "../../../../../src/common/api/worker/offline/PatchMerger"
import { createPatch, Customer, CustomerTypeRef, Patch } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"
import { PatchOperationType } from "../../../../../src/common/api/common/EntityFunctions"
import { CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage"
import { createSystemMail } from "../../common/mail/CommonMailUtilsTest"
import { convertJsToDbType } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { encryptValue } from "../../../../../src/common/api/worker/crypto/CryptoMapper"
import { PatchOperationError } from "../../../../../src/common/api/common/error/PatchOperationError"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { EncryptionAuthStatus } from "../../../../../src/common/api/common/TutanotaConstants"
import { PublicEncryptionKeyProvider } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider"

o.spec("PatchMergerTest", () => {
	let sk: AesKey
	let ownerGroupKey: VersionedKey
	let encryptedSessionKey: VersionedEncryptedKey
	const keyLoaderFacadeMock = instance(KeyLoaderFacade)
	const ownerGroupId = "ownerGroupId"
	const typeModelResolver = clientInitializedTypeModelResolver()
	const instancePipeline = instancePipelineFromTypeModelResolver(clientInitializedTypeModelResolver())
	let cryptoFacadePartialStub: CryptoFacade
	let patchMerger: PatchMerger
	let storage: CacheStorage
	let customCacheHandlerMap: CustomCacheHandlerMap
	let userId: Id | null

	o.beforeEach(async () => {
		cryptoFacadePartialStub = new CryptoFacade(
			instance(UserFacade),
			instance(EntityClient),
			instance(RestClient),
			instance(ServiceExecutor),
			instancePipeline,
			instance(OwnerEncSessionKeysUpdateQueue),
			instance(DefaultEntityRestCache),
			keyLoaderFacadeMock,
			instance(AsymmetricCryptoFacade),
			instance(PublicEncryptionKeyProvider),
			() => instance(KeyRotationFacade),
			typeModelResolver,
		)
		cryptoFacadePartialStub.resolveSessionKey = async (instance: Entity): Promise<Nullable<AesKey>> => {
			return sk
		}

		userId = "userId"
		customCacheHandlerMap = object()
		const modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		storage = new EphemeralCacheStorage(modelMapper, typeModelResolver, customCacheHandlerMap)

		sk = aes256RandomKey()
		ownerGroupKey = { object: aes256RandomKey(), version: 0 }
		encryptedSessionKey = _encryptKeyWithVersionedKey(ownerGroupKey, sk)
		when(keyLoaderFacadeMock.loadSymGroupKey(ownerGroupId, ownerGroupKey.version)).thenResolve(ownerGroupKey.object)
		patchMerger = new PatchMerger(storage, instancePipeline, typeModelResolver, () => cryptoFacadePartialStub)
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await instancePipeline.modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

	o.spec("Path traverse", () => {
		o.test("when_incorrect_path_is_supplied_path_traversal_throws", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				unread: true,
			})
			await storage.put(MailTypeRef, await toStorableInstance(testMail))
			const wrongAttributeId = 42
			const patches: Array<Patch> = [
				createPatch({
					attributePath: wrongAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			await assertThrows(PatchOperationError, async () => await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
		})
	})

	o.spec("replace on values", () => {
		o.test("apply_replace_on_root_level_value", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				unread: true,
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const unreadAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "unread"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: unreadAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))

			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.unread).equals(false)
		})

		o.test("apply_replace_on_root_level_encrypted_value", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				subject: "old subject",
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

			const subjectAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "subject"))
			const valueType = mailTypeModel.values[subjectAttributeId] as ModelValue & { encrypted: true }
			const subjectUntypedValue = assertNotNull(
				convertJsToDbType(mailTypeModel.values[subjectAttributeId].type, encryptValue(valueType, "new subject", sk)),
			) as string
			const patches: Array<Patch> = [
				createPatch({
					attributePath: subjectAttributeId.toString(),
					value: subjectUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.subject).equals("new subject")
		})

		o.test("apply_replace_on_root_level_encrypted_value_populates_finalIvs", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				encryptionAuthStatus: null,
			}) as Mail

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

			const encryptionAuthStatusAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "encryptionAuthStatus"))
			const valueType = mailTypeModel.values[encryptionAuthStatusAttributeId] as ModelValue & { encrypted: true }
			const encryptionAuthStatusUntypedValue = assertNotNull(
				convertJsToDbType(
					mailTypeModel.values[encryptionAuthStatusAttributeId].type,
					encryptValue(valueType, EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED, sk),
				),
			) as string
			const patches: Array<Patch> = [
				createPatch({
					attributePath: encryptionAuthStatusAttributeId.toString(),
					value: encryptionAuthStatusUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.encryptionAuthStatus).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
			assertNotNull(testMailPatchedParsed._finalIvs[encryptionAuthStatusAttributeId])
		})

		o.test("apply_replace_on_root_level_encrypted_value_with_null_removes_finalIvs", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			})
			const finalIvEncryptionAuthStatus = new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233])
			testMail["_finalIvs"] = { encryptionAuthStatus: finalIvEncryptionAuthStatus }

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

			const encryptionAuthStatusAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "encryptionAuthStatus"))
			const valueType = mailTypeModel.values[encryptionAuthStatusAttributeId] as ModelValue & { encrypted: true }
			const encryptionAuthStatusUntypedValue = convertJsToDbType(
				mailTypeModel.values[encryptionAuthStatusAttributeId].type,
				encryptValue(valueType, null, sk),
			) as Nullable<string>
			const patches: Array<Patch> = [
				createPatch({
					attributePath: encryptionAuthStatusAttributeId.toString(),
					value: encryptionAuthStatusUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o.check(testMailPatched.encryptionAuthStatus).equals(null)
			o.check(testMailPatchedParsed._finalIvs[encryptionAuthStatusAttributeId]).equals(undefined)
		})

		o.test("apply_replace_on_root_level_encrypted_value_with_default_value_sets_finalIvs_to_null", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				listUnsubscribe: true,
			})
			const finalIvListUnsubscribe = new Uint8Array([93, 100, 153, 150, 95, 10, 107, 53, 164, 219, 212, 180, 106, 221, 132, 233])
			testMail["_finalIvs"] = { listUnsubscribe: finalIvListUnsubscribe }

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)

			const listUnsubscribeAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "listUnsubscribe"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: listUnsubscribeAttributeId.toString(),
					value: "", // "" indicates default value
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o.check(testMailPatched.listUnsubscribe).equals(false)
			o.check(testMailPatchedParsed._finalIvs[listUnsubscribeAttributeId]).equals(null)
		})

		o.test("apply_replace_on_value_on_aggregation", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sender: createTestEntity<MailAddress>(MailAddressTypeRef, {
					_id: "senderId",
					address: "example@tutao.de",
					name: "example name",
				}),
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const mailAddressTypeModel = await typeModelResolver.resolveClientTypeReference(MailAddressTypeRef)
			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const addressAttributeId = assertNotNull(AttributeModel.getAttributeId(mailAddressTypeModel, "address"))
			const pathString = `${senderAttributeId}/senderId/${addressAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: pathString,
					value: "newmail@tutao.de",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sender.address).equals("newmail@tutao.de")
		})

		o.test("apply_replace_on_encrypted_value_on_aggregation", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sender: createTestEntity<MailAddress>(MailAddressTypeRef, {
					_id: "senderId",
					address: "example@tutao.de",
					name: "example name",
				}),
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const mailAddressTypeModel = await typeModelResolver.resolveClientTypeReference(MailAddressTypeRef)

			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const nameAttributeId = assertNotNull(AttributeModel.getAttributeId(mailAddressTypeModel, "name"))
			const valueType = mailAddressTypeModel.values[nameAttributeId] as ModelValue & { encrypted: true }

			const pathString = `${senderAttributeId}/senderId/${nameAttributeId}`
			const nameUntypedValue = assertNotNull(
				convertJsToDbType(mailAddressTypeModel.values[nameAttributeId].type, encryptValue(valueType, "new name", sk)),
			) as string
			const patches: Array<Patch> = [
				createPatch({
					attributePath: pathString,
					value: nameUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sender.name).equals("new name")
		})
	})

	o.spec("replace on aggregations", () => {
		o.test("apply_replace_on_One_ET_on_aggregation", async () => {
			const mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
				_id: "elementId",
				mailbox: "mailboxId",
				serverProperties: "serverId",
				outOfOfficeNotificationRecipientList: createOutOfOfficeNotificationRecipientList({
					_id: "aggId",
					list: "oldListId",
				}),
			})

			await storage.put(MailboxGroupRootTypeRef, await toStorableInstance(mailboxGroupRoot))

			const mailboxGroupRootTypeModel = await typeModelResolver.resolveClientTypeReference(MailboxGroupRootTypeRef)
			const outOfOfficeNotificationRecipientListTypeModel = await typeModelResolver.resolveClientTypeReference(
				OutOfOfficeNotificationRecipientListTypeRef,
			)
			const outOfOfficeNotificationAttributeId = assertNotNull(
				AttributeModel.getAttributeId(mailboxGroupRootTypeModel, "outOfOfficeNotificationRecipientList"),
			)
			const listAttributeId = assertNotNull(AttributeModel.getAttributeId(outOfOfficeNotificationRecipientListTypeModel, "list"))
			const pathString = `${outOfOfficeNotificationAttributeId}/aggId/${listAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: pathString,
					value: JSON.stringify(["newListId"]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const mailboxGroupRootPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailboxGroupRootTypeRef, null, "elementId", patches))
			const mailboxGroupRootPatched = await instancePipeline.modelMapper.mapToInstance<MailboxGroupRoot>(
				MailboxGroupRootTypeRef,
				mailboxGroupRootPatchedParsed,
			)
			o(mailboxGroupRootPatched.outOfOfficeNotificationRecipientList?.list).equals("newListId")
		})

		o.test("apply_replace_on_entire_id_tuple_association", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [["listId", "elementId"]],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId2", "elementId1"],
						["listId2", "elementId2"],
					]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([
				["listId2", "elementId1"],
				["listId2", "elementId2"],
			])
		})

		o.test("apply_replace_on_One_aggregation_throws", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const senderToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedSender = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, senderToAdd, sk)
			const patches: Array<Patch> = [
				createPatch({
					attributePath: senderAttributeId.toString(),
					value: JSON.stringify([untypedSender]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const e = await assertThrows(
				PatchOperationError,
				async () => await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches),
			)
			o(e.message.toString().includes("attempted to replace aggregation sender on Mail")).equals(true)
		})

		o.test("apply_replace_on_ZeroOrOne_aggregation_throws", async () => {
			const mailbox = createTestEntity(MailBoxTypeRef, {
				_id: "elementId",
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				folders: createTestEntity(MailFolderRefTypeRef),
			})

			await storage.put(MailBoxTypeRef, await toStorableInstance(mailbox))

			const mailBoxTypeModel = await typeModelResolver.resolveClientTypeReference(MailBoxTypeRef)
			const mailFolderRefAttributeId = assertNotNull(AttributeModel.getAttributeId(mailBoxTypeModel, "folders"))
			const mailFolderRefToAdd = createTestEntity(MailFolderRefTypeRef)
			const untypedMailFolderRef = await instancePipeline.mapAndEncrypt(MailFolderRefTypeRef, mailFolderRefToAdd, sk)

			const patches: Array<Patch> = [
				createPatch({
					attributePath: mailFolderRefAttributeId.toString(),
					value: JSON.stringify([untypedMailFolderRef]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const e = await assertThrows(
				PatchOperationError,
				async () => await patchMerger.getPatchedInstanceParsed(MailBoxTypeRef, null, "elementId", patches),
			)
			o(e.message.toString().includes("attempted to replace aggregation folders on MailBox")).equals(true)
		})

		o.test("apply_replace_on_Any_aggregation_throws", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const toRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, toRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([untypedToRecipient]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const e = await assertThrows(
				PatchOperationError,
				async () => await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			o(e.message.toString().includes("attempted to replace aggregation toRecipients on Recipients")).equals(true)
		})
	})

	o.spec("Add item", () => {
		o.test("apply_additem_on_value_throws", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				unread: true,
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const unreadAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "unread"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: unreadAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const e = await assertThrows(
				PatchOperationError,
				async () => await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches),
			)
			o(
				e.message
					.toString()
					.includes(
						`AddItem operation is supported for associations only, but the operation was called on value with id ${unreadAttributeId.toString()}`,
					),
			).equals(true)
		})

		o.test("apply_additem_on_Any_id_tuple_association", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [["listId", "elementId"]],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([["listId", "elementId2"]]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([
				["listId", "elementId"],
				["listId", "elementId2"],
			])
		})

		o.test("apply_additem_on_Any_id_tuple_association_multiple", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [["listId", "elementId"]],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId2"],
						["listId", "elementId3"],
					]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([
				["listId", "elementId"],
				["listId", "elementId2"],
				["listId", "elementId3"],
			])
		})

		o.test("apply_additem_on_Any_id_tuple_association_duplicates_ignored", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [["listId", "elementId"]],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId"],
					]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([["listId", "elementId"]])
		})

		o.test("apply_additem_on_Any_aggregation", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const toRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, toRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([untypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			const addedToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeFinalIvs(addedToRecipient)).deepEquals(removeFinalIvs(toRecipientToAdd))
		})

		o.test("apply_additem_on_Any_aggregation_multiple", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				name: "first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			const addedSecondToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeFinalIvs(addedSecondToRecipient)).deepEquals(removeFinalIvs(secondToRecipientToAdd))
			const addedFirstToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeFinalIvs(addedFirstToRecipient)).deepEquals(removeFinalIvs(firstToRecipientToAdd))
		})

		o.test("apply_additem_on_Any_aggregation_multiple_existing_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<MailAddress>(MailAddressTypeRef, {
										_id: "existingToRecipientId",
										name: "first name",
										address: "address@tutao.de",
									}),
								],
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "newToRecipientId",
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(2) // only second toRecipient is added
		})

		o.test("apply_additem_on_Any_aggregation_multiple_duplicates_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<MailAddress>(MailAddressTypeRef, {
										_id: "existingToRecipientId",
										name: "first name",
										address: "address@tutao.de",
									}),
								],
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})

			const secondToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})

			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, secondToRecipientToAdd, sk)
			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(1) // nothing is added as both entities are identical to existing toRecipient
		})

		o.test("apply_additem_on_Any_aggregation_multiple_existing_but_DIFFERENT_attribute_values_throws", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<MailAddress>(MailAddressTypeRef, {
										_id: "existingToRecipientId",
										name: "first name",
										address: "address@tutao.de",
									}),
								],
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "NEW first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<MailAddress>(MailAddressTypeRef, {
				_id: "newToRecipientId",
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			await assertThrows(PatchOperationError, async () =>
				assertNotNull(await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches)),
			)
		})
	})

	o.spec("Remove Item", () => {
		o.test("apply_removeitem_on_ZeroOrOne_id_association", async () => {
			const customer = createTestEntity(CustomerTypeRef, {
				_id: "customerId",
				adminGroup: "adminGroupId",
				adminGroups: "adminGroupsId",
				customerGroup: "customerGroupId",
				customerGroups: "customerGroupsId",
				userGroups: "userGroupsId",
				teamGroups: "teamGroupsId",
				customerInfo: ["listId", "elementId"],
				properties: "propertiesId",
			})

			await storage.put(CustomerTypeRef, await toStorableInstance(customer))
			const customerTypeModel = await typeModelResolver.resolveClientTypeReference(CustomerTypeRef)
			const propertiesAttributeId = assertNotNull(AttributeModel.getAttributeId(customerTypeModel, "properties"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: propertiesAttributeId.toString(),
					value: '["propertiesId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const customerPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(CustomerTypeRef, null, "customerId", patches))
			const customerPatched = await instancePipeline.modelMapper.mapToInstance<Customer>(CustomerTypeRef, customerPatchedParsed)
			o(customerPatched.properties).equals(null)
		})

		o.test("apply_removeitem_on_Any_id_tuple_association", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [
					["listId", "elementId"],
					["listId", "elementId2"],
				],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId2"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([])
		})

		o.test("apply_removeitem_on_Any_id_tuple_association_duplicates_ignored", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [
					["listId", "elementId"],
					["listId", "elementId2"],
				],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([["listId", "elementId2"]])
		})

		o.test("apply_removeitem_on_Any_id_tuple_association_no_matching_ignored", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sets: [
					["listId", "elementId"],
					["listId", "elementId2"],
				],
			})

			await storage.put(MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<Patch> = [
				createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId2"],
						["listId", "elementId3"],
						["listId", "elementId4"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(MailTypeRef, "listId", "elementId", patches))
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<Mail>(MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([["listId", "elementId"]])
		})

		o.test("apply_removeitem_on_Any_aggregation", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity(MailAddressTypeRef, {
										_id: "addressId",
										name: "delete me",
										address: "delet@tutao.de",
									}),
								],
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: '["addressId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(0)
		})

		o.test("apply_removeitem_on_Any_aggregation_multiple_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity(MailAddressTypeRef, {
										_id: "addressId",
										name: "delete me",
										address: "delet@tutao.de",
									}),
								],
							}),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<Patch> = [
				createPatch({
					attributePath: attributePath,
					value: '["addressId", "addressId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<MailDetailsBlob>(
				MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(0)
		})
	})
})
