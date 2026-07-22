import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity, instancePipelineFromTypeModelResolver, measureAction } from "../TestUtils"
import { ClientSpamTrainingDatumTypeRef, InboxRuleTypeRef, MailTypeRef, SendDraftDataTypeRef, UnreadMailStatePostInTypeRef } from "@tutao/entities/tutanota"
import { CalendarEventRefTypeRef, NotificationInfoTypeRef } from "@tutao/entities/sys"
import { InstancePipeline } from "../../../src/platform-kit/instance-pipeline"
import { aes256RandomKey } from "@tutao/crypto/symmetric-cipher-utils"
import { Aes256Key } from "../../../src/platform-kit/crypto"
import { DriveFileTypeRef } from "@tutao/entities/drive"
import { IncomingServerJson } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { Entity, TypeRef } from "../../../src/platform-kit/meta"

o.spec("InstancePipelineTest", () => {
	let instancePipeline: InstancePipeline
	let testEntities: Array<Entity>
	let sessionKey: Aes256Key

	o.beforeEach(async () => {
		sessionKey = aes256RandomKey()
		instancePipeline = instancePipelineFromTypeModelResolver(clientInitializedTypeModelResolver())
		testEntities = [
			createTestEntity(MailTypeRef, {}, { populateAggregates: true }),
			createTestEntity(CalendarEventRefTypeRef, {}, { populateAggregates: true }),
			createTestEntity(ClientSpamTrainingDatumTypeRef, {}, { populateAggregates: true }),
			createTestEntity(UnreadMailStatePostInTypeRef, {}, { populateAggregates: true }),
			createTestEntity(SendDraftDataTypeRef, {}, { populateAggregates: true }),
			createTestEntity(InboxRuleTypeRef, {}, { populateAggregates: true }),
			createTestEntity(NotificationInfoTypeRef, {}, { populateAggregates: true }),
			createTestEntity(DriveFileTypeRef, {}, { populateAggregates: true }),
		].flatMap((item) => new Array(50000).fill(structuredClone(item)))
	})

	// commit 57c3c52888f31f3c4907493dfdfa6c763afac1af: Time taken to encrypt 400000 entities: 10486ms
	//
	// commit eed8c81ef212d3c8eca39f396105bd80b986db04: Time taken to encrypt 400000 entities: 10163ms
	// - This commit introduced seperate input and output types, which is resulting in more object allocation and freeing up
	o.test("encrypt performance", async () => {
		if (alwaysTrue()) {
			return
		}

		const { time } = await measureAction(async () => {
			for (const entity of testEntities) {
				const _no_use = (await instancePipeline.mapAndEncrypt(entity._type, entity, sessionKey)).getJsonRepresentation()
			}
		})
		console.log(`Time taken to encrypt ${testEntities.length} entities: ${time}ms`)
	})

	// commit 57c3c52888f31f3c4907493dfdfa6c763afac1af: Time taken to decrypt 400000 entities: 12034ms
	//
	// commit eed8c81ef212d3c8eca39f396105bd80b986db04: Time taken to decrypt 400000 entities: 17848ms
	// - This commit introduced seperate input and output types, which is resulting in more object allocation and freeing up
	o.test("decrypt performance", async () => {
		if (alwaysTrue()) {
			return
		}

		const testJsons: Array<[string, TypeRef<Entity>]> = await Promise.all(
			testEntities.map(async (entity) => {
				const encryptedInstance = await instancePipeline.mapAndEncrypt(entity._type, entity, sessionKey)
				return [encryptedInstance.getJsonRepresentation(), entity._type]
			}),
		)
		const { time } = await measureAction(async () => {
			for (const [entityJson, typeRef] of testJsons) {
				const typeModel = await instancePipeline.typeModelResolver.resolveServerTypeReference(typeRef)
				const incomingServerJson = IncomingServerJson.expectSingleInstance(entityJson, typeModel)
				const _no_use = await instancePipeline.decryptAndMap(incomingServerJson, sessionKey)
			}
		})
		console.log(`Time taken to decrypt ${testEntities.length} entities: ${time}ms`)
	})
})

function alwaysTrue(): boolean {
	return true
}
