import o from "@tutao/otest"
import {
	dummyResolver,
	TestAggregate,
	testAggregateModel,
	TestAggregateOnAggregate,
	testAggregateOnAggregateModel,
	TestAggregateOnAggregateRef,
	TestAggregateRef,
	TestEntity,
	testTypeModel,
	TestTypeRef,
} from "../crypto/InstancePipelineTestUtils"
import { ClientTypeReferenceResolver, PatchOperationType, ServerTypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { InstancePipeline } from "../../../../../src/common/api/worker/crypto/InstancePipeline"
import { aes256RandomKey } from "@tutao/tutanota-crypto"
import { assertNotNull, base64ToUint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { GENERATED_MAX_ID, GENERATED_MIN_ID } from "../../../../../src/common/api/common/utils/EntityUtils"
import { createPatch } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { createTestEntityWithDummyResolver } from "../../../TestUtils"
import { ClientModelEncryptedParsedInstance, ClientTypeModel } from "../../../../../src/common/api/common/EntityTypes"
import { AttributeModel } from "../../../../../src/common/api/common/AttributeModel"
import { ValueType } from "../../../../../src/common/api/common/EntityConstants"
import { areValuesDifferent, computePatches } from "../../../../../src/common/api/common/utils/PatchGenerator"

o.spec("computePatches", function () {
	const dummyTypeReferenceResolver = dummyResolver as ClientTypeReferenceResolver
	const dummyInstancePipeline = new InstancePipeline(dummyResolver as ClientTypeReferenceResolver, dummyResolver as ServerTypeReferenceResolver)

	o("computePatches returns empty list for equal objects", async function () {
		const testEntity = await createFilledTestEntity()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([])
	})

	o("computePatches works on values in the root level", async function () {
		const testEntity = await createFilledTestEntity()
		const date = new Date()
		testEntity.testDate = date

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)

		const objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "4",
				value: '["elementId"]',
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on ZeroOrOne non-aggregation list element associations and replace operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testZeroOrOneListElementAssociation = ["listId", "elementId"]

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "14",
				value: '[["listId","elementId"]]',
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on ZeroOrOne non-aggregation associations and replace operation setting to null", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testElementAssociation = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId",
				testNumber: "1",
			}),
		)
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId2",
				testNumber: "2",
			}),
		)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
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
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: JSON.stringify([testAssociationFirstEncryptedInstance, testAssociationSecondEncryptedInstance]),
				patchOperation: PatchOperationType.ADD_ITEM,
			}),
		])
	})

	o("computePatches works on aggregations and replace operation when aggregates are identical but have different order", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId",
				testNumber: "1",
			}),
		)
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId2",
				testNumber: "2",
			}),
		)
		testEntity._original = structuredClone(testEntity)

		const elementToMove = testEntity.testAssociation[0]
		testEntity.testAssociation.splice(0, 1)
		testEntity.testAssociation.push(elementToMove)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
			testTypeModel as ClientTypeModel,
			currentParsedInstance,
			sk,
		)
		const currentUntypedInstance = await dummyInstancePipeline.typeMapper.applyDbTypes(testTypeModel as ClientTypeModel, currentEncryptedParsedInstance)
		const encryptedAssociationArray = AttributeModel.getAttribute(
			currentEncryptedParsedInstance,
			"testAssociation",
			testTypeModel,
		) as Array<ClientModelEncryptedParsedInstance>
		const testAssociationFirstEncryptedInstance = encryptedAssociationArray[0]
		const testAssociationSecondEncryptedInstance = encryptedAssociationArray[1]
		const testAssociationOriginalEncryptedInstance = encryptedAssociationArray[2]
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: JSON.stringify([
					testAssociationFirstEncryptedInstance,
					testAssociationSecondEncryptedInstance,
					testAssociationOriginalEncryptedInstance,
				]),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations and removeitem operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation.pop()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/9/aggOnAggId/10",
				value: uint8ArrayToBase64(newValue),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone entity -> null", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation[0].testZeroOrOneAggregation = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: "[]",
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone null -> entity", async function () {
		const testEntity = await createFilledTestEntity()
		const testZeroOrOneAggregation = testEntity.testAssociation[0].testZeroOrOneAggregation
		testEntity.testAssociation[0].testZeroOrOneAggregation = null
		testEntity._original = structuredClone(testEntity)
		testEntity.testAssociation[0].testZeroOrOneAggregation = testZeroOrOneAggregation

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
			testTypeModel as ClientTypeModel,
			currentParsedInstance,
			sk,
		)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const testAssociationEncrypted = AttributeModel.getAttribute(
			currentEncryptedParsedInstance,
			"testAssociation",
			testTypeModel,
		) as Array<ClientModelEncryptedParsedInstance>
		const addedTestAggregateOnAggregateEncrypted = (
			AttributeModel.getAttribute(
				testAssociationEncrypted[0],
				"testZeroOrOneAggregation",
				testAggregateModel,
			) as Array<ClientModelEncryptedParsedInstance>
		)[0]
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone entity -> entity but the ids don't match", async function () {
		const testEntity = await createFilledTestEntity()
		assertNotNull(testEntity.testAssociation[0].testZeroOrOneAggregation)._id = "newAggOnAggId"

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, testEntity)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(
			testTypeModel as ClientTypeModel,
			currentParsedInstance,
			sk,
		)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncrypt(TestTypeRef, testEntity, sk)
		const testAssociationEncrypted = AttributeModel.getAttribute(
			currentEncryptedParsedInstance,
			"testAssociation",
			testTypeModel,
		) as Array<ClientModelEncryptedParsedInstance>
		const addedTestAggregateOnAggregateEncrypted = (
			AttributeModel.getAttribute(
				testAssociationEncrypted[0],
				"testZeroOrOneAggregation",
				testAggregateModel,
			) as Array<ClientModelEncryptedParsedInstance>
		)[0]
		let objectDiff = await computePatches(
			originalParsedInstance,
			currentParsedInstance,
			currentUntypedInstance,
			testTypeModel,
			dummyTypeReferenceResolver,
			false,
		)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregates on aggregations and additem operation", async function () {
		const testEntity = await createFilledTestEntity()

		const testAggregateOnAggregateEntity = await createTestEntityWithDummyResolver(TestAggregateOnAggregateRef)
		testEntity.testAssociation[0].testSecondLevelAssociation.push(testAggregateOnAggregateEntity)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
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
			false,
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
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToClientModelParsedInstance(TestTypeRef, assertNotNull(testEntity._original))
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
			false,
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
					testZeroOrOneAggregation: {
						_type: TestAggregateOnAggregateRef,
						_finalIvs: {},
						_id: "aggOnAggId",
						testBytes: null,
					} as TestAggregateOnAggregate,
				} as TestAggregate,
			],
			testBoolean: false,
			testDate: new Date("2025-01-01T13:00:00.000Z"),
			testElementAssociation: "associatedElementId",
			testListElementAssociation: [["listId", "listElementId"]],
			testZeroOrOneListElementAssociation: null,
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
