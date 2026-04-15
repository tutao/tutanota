import o, { assertThrows } from "@tutao/otest"
import { aes256RandomKey, AesKey } from "@tutao/crypto"
import {
	convertJsToDbType,
	CryptoWrapper,
	encryptValue,
	PatchMerger,
	PatchOperationError,
	SessionKeyResolver,
	VersionedEncryptedKey,
	VersionedKey,
} from "@tutao/instance-pipeline"
import { instance, object, when } from "testdouble"
import { KeyLoaderFacade } from "../../../../../src/common/api/worker/facades/KeyLoaderFacade"
import { CryptoFacade } from "../../../../../src/common/api/worker/crypto/CryptoFacade"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { ServiceExecutor } from "../../../../../src/common/api/worker/rest/ServiceExecutor"
import { CacheStorage, DefaultEntityRestCache } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { AsymmetricCryptoFacade } from "../../../../../src/common/api/worker/crypto/AsymmetricCryptoFacade"
import { KeyRotationFacade } from "../../../../../src/common/api/worker/facades/KeyRotationFacade"
import { AttributeModel, Entity, ModelValue, PatchOperationType, ServerModelParsedInstance, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { assertNotNull, downcast, noOp, Nullable, stringToBase64 } from "@tutao/utils"
import { RestClient } from "@tutao/rest-client"
import {
	clientInitializedTypeModelResolver,
	createTestEntity,
	instancePipelineFromTypeModelResolver,
	modelMapperFromTypeModelResolver,
	removeOriginals,
} from "../../../TestUtils"
import { CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage"
import { createSystemMail } from "../../common/mail/CommonMailUtilsTest"
import { EncryptionAuthStatus } from "../../../../../src/app-env"
import { PublicEncryptionKeyProvider } from "../../../../../src/common/api/worker/facades/PublicEncryptionKeyProvider"
import { InstanceSessionKeysCache } from "../../../../../src/common/api/worker/facades/InstanceSessionKeysCache"

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
	let cryptoWrapper: CryptoWrapper

	o.beforeEach(async () => {
		cryptoWrapper = new CryptoWrapper()
		cryptoFacadePartialStub = new CryptoFacade(
			instance(UserFacade),
			instance(EntityClient),
			instance(RestClient),
			instance(ServiceExecutor),
			instancePipeline,
			instance(DefaultEntityRestCache),
			keyLoaderFacadeMock,
			instance(AsymmetricCryptoFacade),
			instance(PublicEncryptionKeyProvider),
			new InstanceSessionKeysCache(),
			cryptoWrapper,
			() => instance(KeyRotationFacade),
			typeModelResolver,
			async () => {
				noOp()
			},
		)
		const fixedSessionKeyResolver: SessionKeyResolver = async (_: Entity): Promise<Nullable<AesKey>> => {
			return sk
		}
		cryptoFacadePartialStub.resolveSessionKey = fixedSessionKeyResolver

		userId = "userId"
		customCacheHandlerMap = object()
		const modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		storage = new EphemeralCacheStorage(modelMapper, typeModelResolver, customCacheHandlerMap)

		sk = aes256RandomKey()
		ownerGroupKey = { object: aes256RandomKey(), version: 0 }
		encryptedSessionKey = cryptoWrapper.encryptKeyWithVersionedKey(ownerGroupKey, sk)
		when(keyLoaderFacadeMock.loadSymGroupKey(ownerGroupId, ownerGroupKey.version)).thenResolve(ownerGroupKey.object)
		patchMerger = new PatchMerger(storage, instancePipeline, typeModelResolver, fixedSessionKeyResolver)
	})

	async function toStorableInstance(entity: Entity): Promise<ServerModelParsedInstance> {
		return downcast<ServerModelParsedInstance>(await instancePipeline.modelMapper.mapToClientModelParsedInstance(entity._type, entity))
	}

	o.spec("Path traverse", () => {
		o.test("when_incorrect_path_is_supplied_path_traversal_returns_null", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				unread: true,
			})
			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))
			const wrongAttributeId = 42
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: wrongAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			o(await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches)).equals(null)
		})

		o.test("when_attribute_not_existing_in_parsed_instance_but_in_server_model_is_supplied_path_patch_applies", async () => {
			const testMail: any = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
			}) as unknown

			// remove unread to make it a partial mail, leading to addition of the unread flag with the patch
			delete testMail.unread
			const partialMail = testMail as tutanotaTypeRefs.Mail

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(partialMail))
			const unreadAttributeId = 109
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: unreadAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const parsedInstance = assertNotNull(await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches))
			o(Object.keys(parsedInstance).find((attribute) => attribute === unreadAttributeId.toString())).equals("109")
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const unreadAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "unread"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: unreadAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)

			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)

			const subjectAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "subject"))
			const valueType = mailTypeModel.values[subjectAttributeId] as ModelValue & { encrypted: true }
			const subjectUntypedValue = assertNotNull(
				convertJsToDbType(mailTypeModel.values[subjectAttributeId].type, encryptValue(valueType, "new subject", sk)),
			) as string
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: subjectAttributeId.toString(),
					value: subjectUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.subject).equals("new subject")
		})

		o.test("apply_replace_on_root_level_encrypted_value", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				encryptionAuthStatus: null,
			}) as tutanotaTypeRefs.Mail

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)

			const encryptionAuthStatusAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "encryptionAuthStatus"))
			const valueType = mailTypeModel.values[encryptionAuthStatusAttributeId] as ModelValue & { encrypted: true }
			const encryptionAuthStatusUntypedValue = assertNotNull(
				convertJsToDbType(
					mailTypeModel.values[encryptionAuthStatusAttributeId].type,
					encryptValue(valueType, EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED, sk),
				),
			) as string
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: encryptionAuthStatusAttributeId.toString(),
					value: encryptionAuthStatusUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.encryptionAuthStatus).equals(EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED)
		})

		o.test("apply_replace_on_root_level_encrypted_value", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				encryptionAuthStatus: EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED,
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)

			const encryptionAuthStatusAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "encryptionAuthStatus"))
			const valueType = mailTypeModel.values[encryptionAuthStatusAttributeId] as ModelValue & { encrypted: true }
			const encryptionAuthStatusUntypedValue = convertJsToDbType(
				mailTypeModel.values[encryptionAuthStatusAttributeId].type,
				encryptValue(valueType, null, sk),
			) as Nullable<string>
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: encryptionAuthStatusAttributeId.toString(),
					value: encryptionAuthStatusUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o.check(testMailPatched.encryptionAuthStatus).equals(null)
		})

		o.test("apply_replace_on_root_level_encrypted_value_with_default_value", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				listUnsubscribe: true,
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)

			const listUnsubscribeAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "listUnsubscribe"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: listUnsubscribeAttributeId.toString(),
					value: "", // "" indicates default value
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o.check(testMailPatched.listUnsubscribe).equals(false)
		})

		o.test("apply_replace_on_value_on_aggregation", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sender: createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
					_id: "senderId",
					address: "example@tutao.de",
					name: "example name",
				}),
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const mailAddressTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailAddressTypeRef)
			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const addressAttributeId = assertNotNull(AttributeModel.getAttributeId(mailAddressTypeModel, "address"))
			const pathString = `${senderAttributeId}/senderId/${addressAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: pathString,
					value: "newmail@tutao.de",
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sender.address).equals("newmail@tutao.de")
		})

		o.test("apply_replace_on_encrypted_value_on_aggregation", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
				sender: createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
					_id: "senderId",
					address: "example@tutao.de",
					name: "example name",
				}),
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const mailAddressTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailAddressTypeRef)

			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const nameAttributeId = assertNotNull(AttributeModel.getAttributeId(mailAddressTypeModel, "name"))
			const valueType = mailAddressTypeModel.values[nameAttributeId] as ModelValue & { encrypted: true }

			const pathString = `${senderAttributeId}/senderId/${nameAttributeId}`
			const nameUntypedValue = assertNotNull(
				convertJsToDbType(mailAddressTypeModel.values[nameAttributeId].type, encryptValue(valueType, "new name", sk)),
			) as string
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: pathString,
					value: nameUntypedValue,
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sender.name).equals("new name")
		})
	})

	o.spec("replace on aggregations", () => {
		o.test("apply_replace_on_One_ET_on_aggregation", async () => {
			const mailboxGroupRoot = createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef, {
				_id: "elementId",
				mailbox: "mailboxId",
				serverProperties: "serverId",
				outOfOfficeNotificationRecipientList: tutanotaTypeRefs.createOutOfOfficeNotificationRecipientList({
					_id: "aggId",
					list: "oldListId",
				}),
			})

			await storage.put(tutanotaTypeRefs.MailboxGroupRootTypeRef, await toStorableInstance(mailboxGroupRoot))

			const mailboxGroupRootTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailboxGroupRootTypeRef)
			const outOfOfficeNotificationRecipientListTypeModel = await typeModelResolver.resolveClientTypeReference(
				tutanotaTypeRefs.OutOfOfficeNotificationRecipientListTypeRef,
			)
			const outOfOfficeNotificationAttributeId = assertNotNull(
				AttributeModel.getAttributeId(mailboxGroupRootTypeModel, "outOfOfficeNotificationRecipientList"),
			)
			const listAttributeId = assertNotNull(AttributeModel.getAttributeId(outOfOfficeNotificationRecipientListTypeModel, "list"))
			const pathString = `${outOfOfficeNotificationAttributeId}/aggId/${listAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: pathString,
					value: JSON.stringify(["newListId"]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const mailboxGroupRootPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailboxGroupRootTypeRef, null, "elementId", patches),
			)
			const mailboxGroupRootPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailboxGroupRoot>(
				tutanotaTypeRefs.MailboxGroupRootTypeRef,
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId2", "elementId1"],
						["listId2", "elementId2"],
					]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([
				["listId2", "elementId1"],
				["listId2", "elementId2"],
			])
		})

		o.test("apply_replace_on_One_aggregation_works", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				_ownerEncSessionKey: encryptedSessionKey.key,
				_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
				_ownerGroup: ownerGroupId,
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const senderAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sender"))
			const senderToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedSender = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, senderToAdd, sk)
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: senderAttributeId.toString(),
					value: JSON.stringify([untypedSender]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sender.name).deepEquals("new name")
			o(testMailPatched.sender.address).deepEquals("address@tutao.de")
		})

		o.test("apply_replace_on_ZeroOrOne_aggregation_works", async () => {
			const eventElementId = stringToBase64("elementId")
			const calendarEvent = createTestEntity(tutanotaTypeRefs.CalendarEventTypeRef, {
				_id: ["listId", eventElementId],
				repeatRule: null,
			})

			await storage.put(tutanotaTypeRefs.CalendarEventTypeRef, await toStorableInstance(calendarEvent))

			const calendarEventTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.CalendarEventTypeRef)
			const repeatRuleAttributeId = assertNotNull(AttributeModel.getAttributeId(calendarEventTypeModel, "repeatRule"))
			const repeatRuleToAdd = createTestEntity(tutanotaTypeRefs.CalendarRepeatRuleTypeRef, { _id: "added-by-patch" })
			const untypedRepeatRule = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.CalendarRepeatRuleTypeRef, repeatRuleToAdd, sk)

			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: repeatRuleAttributeId.toString(),
					value: JSON.stringify([untypedRepeatRule]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]
			o(calendarEvent.repeatRule).equals(null)
			const patchedInstance = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.CalendarEvent>(
				tutanotaTypeRefs.CalendarEventTypeRef,
				assertNotNull(await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.CalendarEventTypeRef, "listId", eventElementId, patches)),
			)
			o(patchedInstance.repeatRule?._id).equals("added-by-patch")
		})

		o.test("apply_replace_on_Any_aggregation_works", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const toRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, toRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([untypedToRecipient]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			]

			const mailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const mailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				mailDetailsBlobPatchedParsed,
			)
			const addedToRecipient = assertNotNull(mailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(addedToRecipient.name).equals("new name")
			o(addedToRecipient.address).equals("address@tutao.de")
		})
	})

	o.spec("Add item", () => {
		o.test("apply_additem_on_value_throws", async () => {
			const testMail = createSystemMail({
				_id: ["listId", "elementId"],
				unread: true,
			})

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const unreadAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "unread"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: unreadAttributeId.toString(),
					value: "0",
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const e = await assertThrows(
				PatchOperationError,
				async () => await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([["listId", "elementId2"]]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId2"],
						["listId", "elementId3"],
					]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId"],
					]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([["listId", "elementId"]])
		})

		o.test("apply_additem_on_Any_aggregation", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const toRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				name: "new name",
				address: "address@tutao.de",
			})
			const untypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, toRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([untypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			const addedToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeOriginals(addedToRecipient)).deepEquals(removeOriginals(toRecipientToAdd))
		})

		o.test("apply_additem_on_Any_aggregation_multiple", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipientsId" }),
						},
						{ populateAggregates: true },
					),
				},
				{ populateAggregates: true },
			)

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				name: "first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			const addedSecondToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeOriginals(addedSecondToRecipient)).deepEquals(removeOriginals(secondToRecipientToAdd))
			const addedFirstToRecipient = assertNotNull(testMailDetailsBlobPatched.details.recipients.toRecipients.pop())
			o(removeOriginals(addedFirstToRecipient)).deepEquals(removeOriginals(firstToRecipientToAdd))
		})

		o.test("apply_additem_on_Any_aggregation_multiple_existing_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
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

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "newToRecipientId",
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(2) // only second toRecipient is added
		})

		o.test("apply_additem_on_Any_aggregation_multiple_duplicates_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
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

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})

			const secondToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "first name",
				address: "address@tutao.de",
			})

			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, secondToRecipientToAdd, sk)
			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(1) // nothing is added as both entities are identical to existing toRecipient
		})

		o.test("apply_additem_on_Any_aggregation_multiple_existing_but_DIFFERENT_attribute_values_throws", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
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

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const firstToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "existingToRecipientId",
				name: "NEW first name",
				address: "address@tutao.de",
			})
			const secondToRecipientToAdd = createTestEntity<tutanotaTypeRefs.MailAddress>(tutanotaTypeRefs.MailAddressTypeRef, {
				_id: "newToRecipientId",
				name: "second name",
				address: "address2@tutao.de",
			})
			const firstUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, firstToRecipientToAdd, sk)
			const secondUntypedToRecipient = await instancePipeline.mapAndEncrypt(tutanotaTypeRefs.MailAddressTypeRef, secondToRecipientToAdd, sk)

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: JSON.stringify([firstUntypedToRecipient, secondUntypedToRecipient]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			]

			await assertThrows(PatchOperationError, async () =>
				assertNotNull(await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches)),
			)
		})
	})

	o.spec("Remove Item", () => {
		o.test("apply_removeitem_on_ZeroOrOne_id_association", async () => {
			const customer = createTestEntity(sysTypeRefs.CustomerTypeRef, {
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

			await storage.put(sysTypeRefs.CustomerTypeRef, await toStorableInstance(customer))
			const customerTypeModel = await typeModelResolver.resolveClientTypeReference(sysTypeRefs.CustomerTypeRef)
			const propertiesAttributeId = assertNotNull(AttributeModel.getAttributeId(customerTypeModel, "properties"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: propertiesAttributeId.toString(),
					value: '["propertiesId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const customerPatchedParsed = assertNotNull(await patchMerger.getPatchedInstanceParsed(sysTypeRefs.CustomerTypeRef, null, "customerId", patches))
			const customerPatched = await instancePipeline.modelMapper.mapToInstance<sysTypeRefs.Customer>(sysTypeRefs.CustomerTypeRef, customerPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId2"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId"],
						["listId", "elementId"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
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

			await storage.put(tutanotaTypeRefs.MailTypeRef, await toStorableInstance(testMail))

			const mailTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			const setsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailTypeModel, "sets"))
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: setsAttributeId.toString(),
					value: JSON.stringify([
						["listId", "elementId2"],
						["listId", "elementId3"],
						["listId", "elementId4"],
					]),
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailTypeRef, "listId", "elementId", patches),
			)
			const testMailPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.Mail>(tutanotaTypeRefs.MailTypeRef, testMailPatchedParsed)
			o(testMailPatched.sets).deepEquals([["listId", "elementId"]])
		})

		o.test("apply_removeitem_on_Any_aggregation", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
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

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: '["addressId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(0)
		})

		o.test("apply_removeitem_on_Any_aggregation_multiple_ignored", async () => {
			const mailDetailsBlob = createTestEntity(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				{
					_id: ["listId", "elementId"],
					_ownerEncSessionKey: encryptedSessionKey.key,
					_ownerKeyVersion: encryptedSessionKey.encryptingKeyVersion.toString(),
					_ownerGroup: ownerGroupId,
					details: createTestEntity(
						tutanotaTypeRefs.MailDetailsTypeRef,
						{
							_id: "detailsId",
							recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
								_id: "recipientsId",
								toRecipients: [
									createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
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

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, await toStorableInstance(mailDetailsBlob))
			const mailDetailsBlobTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsBlobTypeRef)
			const mailDetailsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.MailDetailsTypeRef)
			const recipientsTypeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.RecipientsTypeRef)

			const detailsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsBlobTypeModel, "details"))
			const recipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(mailDetailsTypeModel, "recipients"))
			const toRecipientsAttributeId = assertNotNull(AttributeModel.getAttributeId(recipientsTypeModel, "toRecipients"))

			const attributePath = `${detailsAttributeId}/detailsId/${recipientsAttributeId}/recipientsId/${toRecipientsAttributeId}`
			const patches: Array<sysTypeRefs.Patch> = [
				sysTypeRefs.createPatch({
					attributePath: attributePath,
					value: '["addressId", "addressId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			]

			const testMailDetailsBlobPatchedParsed = assertNotNull(
				await patchMerger.getPatchedInstanceParsed(tutanotaTypeRefs.MailDetailsBlobTypeRef, "listId", "elementId", patches),
			)
			const testMailDetailsBlobPatched = await instancePipeline.modelMapper.mapToInstance<tutanotaTypeRefs.MailDetailsBlob>(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				testMailDetailsBlobPatchedParsed,
			)
			o(testMailDetailsBlobPatched.details.recipients.toRecipients.length).equals(0)
		})
	})
})
