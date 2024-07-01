import o from "@tutao/otest"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest.js"
import { matchers, object, verify, when } from "testdouble"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/common/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { GroupKeyUpdateTypeRef, InstanceSessionKeyTypeRef, TypeInfoTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { UpdateSessionKeysService } from "../../../../../src/common/api/entities/sys/Services.js"
import { delay } from "@tutao/tutanota-utils"
import { LockedError } from "../../../../../src/common/api/common/error/RestError.js"
import { createTestEntity } from "../../../TestUtils.js"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { TypeModel } from "../../../../../src/common/api/common/EntityTypes.js"

const { anything, captor } = matchers

o.spec("OwnerEncSessionKeysUpdateQueueTest", function () {
	let serviceExecutor: IServiceExecutor
	let ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue
	let userFacade: UserFacade
	let mailTypeModel: TypeModel

	o.beforeEach(async function () {
		mailTypeModel = await resolveTypeReference(MailTypeRef)
		userFacade = object()
		when(userFacade.isLeader()).thenReturn(true)
		serviceExecutor = object()
		ownerEncSessionKeysUpdateQueue = new OwnerEncSessionKeysUpdateQueue(userFacade, serviceExecutor, 0)
	})

	o.spec("updateInstanceSessionKeys", function () {
		o("send updates from queue", async function () {
			const updatableInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			await await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys, mailTypeModel)
			await delay(0)
			const updatedPostCaptor = captor()
			verify(serviceExecutor.post(UpdateSessionKeysService, updatedPostCaptor.capture()))
			o(updatedPostCaptor.value.ownerEncSessionKeys).deepEquals(updatableInstanceSessionKeys)
		})

		o("no updates sent if not leader", async function () {
			when(userFacade.isLeader()).thenReturn(false)
			const updatableInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef)]
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys, mailTypeModel)
			await delay(0)
			verify(serviceExecutor.post(anything(), anything()), { times: 0 })
		})

		o("no updates sent for GroupKeyUpdate type", async function () {
			const groupKeyUpdateTypeModel = await resolveTypeReference(GroupKeyUpdateTypeRef)
			const updatableInstanceSessionKeys = [createTestEntity(InstanceSessionKeyTypeRef)]
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys, groupKeyUpdateTypeModel)
			await delay(0)
			verify(serviceExecutor.post(anything(), anything()), { times: 0 })
		})

		o("retry after LockedError", async function () {
			let throwError = true
			when(serviceExecutor.post(UpdateSessionKeysService, anything())).thenDo(() => {
				if (throwError) {
					return Promise.reject(new LockedError("test lock"))
				} else {
					return undefined
				}
			})
			const updatableInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys, mailTypeModel)
			await delay(0)
			throwError = false
			when(serviceExecutor.post(UpdateSessionKeysService, anything())).thenResolve(undefined)
			await delay(0)
			const updatedPostCaptor = captor()
			verify(serviceExecutor.post(UpdateSessionKeysService, updatedPostCaptor.capture()), { times: 2 })
			o(updatedPostCaptor.value.ownerEncSessionKeys).deepEquals(updatableInstanceSessionKeys)
			if (!updatedPostCaptor.values) {
				throw new Error("should have been invoked twice")
			}
			o(updatedPostCaptor.values[0]).deepEquals(updatedPostCaptor.values[1])
		})

		o("debounced request sends entire queue", async function () {
			const updatableInstanceSessionKeys = [
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createTestEntity(InstanceSessionKeyTypeRef, {
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTestEntity(TypeInfoTypeRef),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([updatableInstanceSessionKeys[0]], mailTypeModel)
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([updatableInstanceSessionKeys[1]], mailTypeModel)
			await delay(0)
			const updatedPostCaptor = captor()
			verify(serviceExecutor.post(UpdateSessionKeysService, updatedPostCaptor.capture()))
			o(updatedPostCaptor.value.ownerEncSessionKeys).deepEquals(updatableInstanceSessionKeys)
		})

		o("empty inputs do not trigger a call to the service", async function () {
			await ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([], mailTypeModel)
			await delay(0)
			verify(serviceExecutor.post(UpdateSessionKeysService, anything()), { times: 0 })
		})
	})
})
