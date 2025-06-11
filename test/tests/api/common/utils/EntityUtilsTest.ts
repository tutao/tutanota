import o from "@tutao/otest"
import {
	areValuesDifferent,
	computePatches,
	constructMailSetEntryId,
	create,
	deconstructMailSetEntryId,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	removeTechnicalFields,
	timestampToGeneratedId,
	timestampToHexGeneratedId,
} from "../../../../../src/common/api/common/utils/EntityUtils.js"
import { MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { typeModels } from "../../../../../src/common/api/entities/tutanota/TypeModels.js"

import { ClientModelEncryptedParsedInstance, ClientTypeModel, ElementEntity } from "../../../../../src/common/api/common/EntityTypes.js"
import { assertNotNull, base64ToUint8Array, clone, TypeRef, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { hasError } from "../../../../../src/common/api/common/utils/ErrorUtils.js"
import {
	dummyResolver,
	TestAggregate,
	testAggregateModel,
	TestAggregateOnAggregate,
	TestAggregateOnAggregateRef,
	TestAggregateRef,
	TestEntity,
	testTypeModel,
	TestTypeRef,
} from "../../worker/crypto/InstancePipelineTestUtils"
import { ClientTypeReferenceResolver, PatchOperationType, ServerTypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { createTestEntityWithDummyResolver } from "../../../TestUtils"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel.js"
import { createPatch } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { ValueType } from "../../../../../src/common/api/common/EntityConstants.js"
import { compressString } from "../../../../../src/common/api/worker/crypto/ModelMapper"

o.spec("EntityUtils", function () {
	o("TimestampToHexGeneratedId ", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 0)).equals("4fc6fbb10000000000")
	})
	o("TimestampToHexGeneratedId server id 1", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 1)).equals("4fc6fbb10000000001")
	})
	o("generatedIdToTimestamp ", function () {
		let maxTimestamp = Math.pow(2, 42) - 1
		o(generatedIdToTimestamp(GENERATED_MIN_ID)).equals(0)
		o(generatedIdToTimestamp(timestampToGeneratedId(0))).equals(0)
		o(generatedIdToTimestamp("zzzzzzzzzzzz")).equals(maxTimestamp)
		o(generatedIdToTimestamp("IwQvgF------")).equals(1370563200000)
	})

	o.spec("MailSetEntry id", function () {
		o("constructMailSetEntryId", function () {
			const mailId: Id = "-----------0"

			const expected = "V7ifKQAAAAAAAAAAAQ"
			const receiveDate = new Date("2017-10-03T13:46:13Z")

			const calculatedId = constructMailSetEntryId(receiveDate, mailId)
			o(expected).equals(calculatedId)
		})

		o("deconstructMailSetEntryId", function () {
			const setEntryId = "V7ifKQAAAAAAAAAAAQ"
			const { receiveDate, mailId } = deconstructMailSetEntryId(setEntryId)
			const diff = Math.abs(receiveDate.getTime() - new Date("2017-10-03T13:46:12.864Z").getTime())
			o(diff < 10).equals(true)(`Expected a date near ${new Date("2017-10-03T13:46:12.864Z")}, got: ${receiveDate} with diff ${diff}`)
			o(mailId).equals("-----------0")
		})
	})

	o("create new entity without error object ", function () {
		const mailEntity = create(typeModels[MailTypeRef.typeId], MailTypeRef)
		o(mailEntity._errors).equals(undefined)
		o(hasError(mailEntity)).equals(false)

		o(mailEntity.subject).equals("") // value with default value
		o(mailEntity.attachments).deepEquals([]) // association with Any cardinality
		o(mailEntity.firstRecipient).equals(null) // association with ZeroOrOne cardinality
	})

	o.spec("removeTechnicalFields", function () {
		const typeRef = { app: "sys", typeId: 9999999 } as TypeRef<unknown>

		function makeEntity() {
			return {
				_id: "test",
				// so that we can compare it
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
			}
		}

		o("it doesn't do anything when there's nothing to remove", function () {
			const originalEntity = makeEntity()
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals(originalEntity)
		})

		o("it removes _finalEncrypted fields directly on the entity", function () {
			const originalEntity = { ...makeEntity(), _finalEncryptedThing: [1, 2, 3] }
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals({
				_id: "test",
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
			})
		})

		o("it removes _finalEncrypted fields deeper in the entity", function () {
			const originalEntity = {
				...makeEntity(),
				nested: {
					test: "yes",
					_finalEncryptedThing: [1, 2, 3],
				},
			}
			const entityCopy = clone(originalEntity)
			removeTechnicalFields(entityCopy as ElementEntity)
			o(entityCopy as unknown).deepEquals({
				_id: "test",
				_type: typeRef,
				_ownerGroup: null,
				_ownerEncSessionKey: null,
				nested: {
					test: "yes",
				},
			})
		})
	})

	o.spec("computePatches", function () {
		const dummyTypeReferenceResolver = dummyResolver as ClientTypeReferenceResolver
		const dummyInstancePipeline = new InstancePipeline(dummyResolver as ClientTypeReferenceResolver, dummyResolver as ServerTypeReferenceResolver)

		o("computePatches returns empty list for equal objects", async function () {
			const testEntity = await createFilledTestEntity()

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([])
		})

		o("computePatches works on values in the root level", async function () {
			const testEntity = await createFilledTestEntity()
			const date = new Date()
			testEntity.testDate = date

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "5",
					value: `${date.valueOf()}`,
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works when setting values to null", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testBoolean = null

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "7",
					value: null,
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works when modifying multiple values", async function () {
			const testEntity = await createFilledTestEntity()
			const date = new Date()
			testEntity.testDate = date
			testEntity.testBoolean = null

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "5",
					value: `${date.valueOf()}`,
					patchOperation: PatchOperationType.REPLACE,
				}),
				createPatch({
					attributePath: "7",
					value: null,
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works on values on the aggregates", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation[0].testNumber = "1234"

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3/aggId/2",
					value: "1234",
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works on Any non-aggregation associations and additem operation", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testListElementAssociation.push(["listId", "elementId"], ["list2Id", "element2Id"])

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "8",
					value: '[["listId","elementId"],["list2Id","element2Id"]]',
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			])
		})

		o("computePatches works on Any non-aggregation associations and removeitem operation", async function () {
			const testEntity = await createTestEntityWithOriginal({
				testListElementAssociation: [
					["listId", "elementId"],
					["listId2", "elementId2"],
					["listId3", "elementId3"],
				],
			})
			testEntity.testListElementAssociation.pop()
			testEntity.testListElementAssociation.pop()

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)

			const objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "8",
					value: '[["listId2","elementId2"],["listId3","elementId3"]]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			])
		})

		o("computePatches works on ZeroOrOne non-aggregation associations and replace operation", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testElementAssociation = "elementId"

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "4",
					value: '["elementId"]',
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works on ZeroOrOne non-aggregation associations and replace operation setting to null", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testElementAssociation = null

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "4",
					value: "[]",
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works on aggregations and additem operation", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation.push(await createTestEntityWithDummyResolver(TestAggregateRef, { _id: "newAgId" }))
			testEntity.testAssociation.push(await createTestEntityWithDummyResolver(TestAggregateRef, { _id: "newAgId2" }))

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
				testTypeModel as ClientTypeModel,
				currentParsedInstance,
				sk,
			)
			const currentUntypedInstance = await dummyInstancePipeline.typeMapper.applyDbTypes(testTypeModel as ClientTypeModel, currentEncryptedParsedInstance)
			const testAssociationFirstEncryptedInstance = (
				AttributeModel.getAttribute(currentEncryptedParsedInstance, "testAssociation", testTypeModel) as Array<ClientModelEncryptedParsedInstance>
			)[1]
			const testAssociationSecondEncryptedInstance = (
				AttributeModel.getAttribute(currentEncryptedParsedInstance, "testAssociation", testTypeModel) as Array<ClientModelEncryptedParsedInstance>
			)[2]
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3",
					value: JSON.stringify([testAssociationFirstEncryptedInstance, testAssociationSecondEncryptedInstance]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			])
		})

		o("computePatches works on aggregations and removeitem operation", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation.pop()

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3",
					value: '["aggId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			])
		})

		o("computePatches works on values on aggregations on aggregations and replace operation", async function () {
			const testEntity = await createFilledTestEntity()
			const newValue = new Uint8Array(8)
			testEntity.testAssociation[0].testSecondLevelAssociation[0].testBytes = newValue

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3/aggId/9/aggOnAggId/10",
					value: uint8ArrayToBase64(newValue),
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("computePatches works on aggregates on aggregations and additem operation", async function () {
			const testEntity = await createFilledTestEntity()

			const testAggregateOnAggregateEntity = await createTestEntityWithDummyResolver(TestAggregateOnAggregateRef)
			testEntity.testAssociation[0].testSecondLevelAssociation.push(testAggregateOnAggregateEntity)

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
				testTypeModel as ClientTypeModel,
				currentParsedInstance,
				sk,
			)
			const currentUntypedInstance = await dummyInstancePipeline.typeMapper.applyDbTypes(testTypeModel as ClientTypeModel, currentEncryptedParsedInstance)
			const testAssociationEncrypted = AttributeModel.getAttribute(
				currentEncryptedParsedInstance,
				"testAssociation",
				testTypeModel,
			) as Array<ClientModelEncryptedParsedInstance>
			const addedTestAggregateOnAggregateEncrypted = (
				AttributeModel.getAttribute(
					testAssociationEncrypted[0],
					"testSecondLevelAssociation",
					testAggregateModel,
				) as Array<ClientModelEncryptedParsedInstance>
			)[1]

			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3/aggId/9",
					value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			])
		})

		o("computePatches works on aggregates on aggregations and removeitem operation", async function () {
			const testEntity = await createFilledTestEntity()

			testEntity.testAssociation[0].testSecondLevelAssociation.pop()

			let sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(
				TestTypeRef,
				assertNotNull(testEntity._original),
			)
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
			const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
				testTypeModel as ClientTypeModel,
				currentParsedInstance,
				sk,
			)
			const currentUntypedInstance = await dummyInstancePipeline.typeMapper.applyDbTypes(testTypeModel as ClientTypeModel, currentEncryptedParsedInstance)
			let objectDiff = await computePatches(
				originalParsedInstance,
				currentParsedInstance,
				currentUntypedInstance,
				testTypeModel,
				dummyTypeReferenceResolver,
			)
			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3/aggId/9",
					value: '["aggOnAggId"]',
					patchOperation: PatchOperationType.REMOVE_ITEM,
				}),
			])
		})

		async function createTestEntityWithOriginal(overrides: Partial<TestEntity>): Promise<TestEntity> {
			const instance: TestEntity = await createTestEntityWithDummyResolver(TestTypeRef, overrides)
			instance._original = structuredClone(instance)
			return instance
		}

		async function createFilledTestEntity(): Promise<TestEntity> {
			return await createTestEntityWithOriginal({
				_type: TestTypeRef,
				_finalIvs: {},
				testAssociation: [
					{
						_type: TestAggregateRef,
						_finalIvs: {},
						_id: "aggId",
						testNumber: "123456",
						testSecondLevelAssociation: [
							{
								_type: TestAggregateOnAggregateRef,
								_finalIvs: {},
								_id: "aggOnAggId",
								testBytes: null,
							} as TestAggregateOnAggregate,
						],
					} as TestAggregate,
				],
				testBoolean: false,
				testDate: new Date("2025-01-01T13:00:00.000Z"),
				testElementAssociation: "associatedElementId",
				testListElementAssociation: [["listId", "listElementId"]],
				testValue: "some encrypted string",
				testGeneratedId: GENERATED_MIN_ID,
				_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
			})
		}
	})

	o("areValuesDifferent works as expected", function () {
		o(areValuesDifferent(ValueType.String, "example", "example")).equals(false)
		o(areValuesDifferent(ValueType.String, "example", "different")).equals(true)
		o(areValuesDifferent(ValueType.Number, 123, 123)).equals(false)
		o(areValuesDifferent(ValueType.Number, 123, 456)).equals(true)
		o(areValuesDifferent(ValueType.Bytes, base64ToUint8Array("byte"), base64ToUint8Array("byte"))).equals(false)
		o(areValuesDifferent(ValueType.Bytes, base64ToUint8Array("byte"), base64ToUint8Array("diffbyte"))).equals(true)
		o(areValuesDifferent(ValueType.Date, new Date(2025, 6, 6), new Date(2025, 6, 6))).equals(false)
		o(areValuesDifferent(ValueType.Date, new Date(2025, 6, 6), new Date(2025, 6, 5))).equals(true)
		o(areValuesDifferent(ValueType.Boolean, true, true)).equals(false)
		o(areValuesDifferent(ValueType.Boolean, true, false)).equals(true)
		o(areValuesDifferent(ValueType.GeneratedId, GENERATED_MIN_ID, GENERATED_MIN_ID)).equals(false)
		o(areValuesDifferent(ValueType.GeneratedId, GENERATED_MIN_ID, GENERATED_MAX_ID)).equals(true)
		o(areValuesDifferent(ValueType.GeneratedId, [GENERATED_MIN_ID, GENERATED_MIN_ID], [GENERATED_MIN_ID, GENERATED_MIN_ID])).equals(false)
		o(areValuesDifferent(ValueType.GeneratedId, [GENERATED_MIN_ID, GENERATED_MIN_ID], [GENERATED_MAX_ID, GENERATED_MAX_ID])).equals(true)
		o(areValuesDifferent(ValueType.CustomId, "customId", "customId")).equals(false)
		o(areValuesDifferent(ValueType.CustomId, "customId", "diffcustomId")).equals(true)
		o(areValuesDifferent(ValueType.CompressedString, "compress string", "compress string")).equals(false)
		o(areValuesDifferent(ValueType.CompressedString, "compress string", "compress different string")).equals(true)
	})
})
