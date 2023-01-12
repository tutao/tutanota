import o from "ospec"
import { IServiceExecutor } from "../../../../../src/api/common/ServiceRequest.js"
import { matchers, object, verify, when } from "testdouble"
import { UserFacade } from "../../../../../src/api/worker/facades/UserFacade.js"
import { OwnerEncSessionKeysUpdateQueue } from "../../../../../src/api/worker/crypto/OwnerEncSessionKeysUpdateQueue.js"
import { createInstanceSessionKey, createTypeInfo } from "../../../../../src/api/entities/sys/TypeRefs.js"
import { UpdateSessionKeysService } from "../../../../../src/api/entities/sys/Services.js"
import { delay } from "@tutao/tutanota-utils"
import { LockedError } from "../../../../../src/api/common/error/RestError.js"

const { anything, captor } = matchers

o.spec("OwnerEncSessionKeysUpdateQueue", function () {
	let serviceExecutor: IServiceExecutor
	let ownerEncSessionKeysUpdateQueue: OwnerEncSessionKeysUpdateQueue
	let userFacade: UserFacade

	o.beforeEach(function () {
		userFacade = object()
		when(userFacade.isLeader()).thenReturn(true)
		serviceExecutor = object()
		ownerEncSessionKeysUpdateQueue = new OwnerEncSessionKeysUpdateQueue(userFacade, serviceExecutor, 0)
	})

	o.spec("updateInstanceSessionKeys", function () {
		o("send updates from queue", async function () {
			const updatableInstanceSessionKeys = [
				createInstanceSessionKey({
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createInstanceSessionKey({
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys)
			await delay(0)
			const updatedPostCaptor = captor()
			verify(serviceExecutor.post(UpdateSessionKeysService, updatedPostCaptor.capture()))
			o(updatedPostCaptor.value.ownerEncSessionKeys).deepEquals(updatableInstanceSessionKeys)
		})

		o("no updates sent if not leader", async function () {
			when(userFacade.isLeader()).thenReturn(false)
			const updatableInstanceSessionKeys = [createInstanceSessionKey()]
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys)
			await delay(0)
			verify(serviceExecutor.post(anything(), anything()), { times: 0 })
		})

		o("retry after LockedError", async function () {
			when(serviceExecutor.post(UpdateSessionKeysService, anything())).thenReject(new LockedError("test lock"))
			const updatableInstanceSessionKeys = [
				createInstanceSessionKey({
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createInstanceSessionKey({
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys(updatableInstanceSessionKeys)
			await delay(0)
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
				createInstanceSessionKey({
					instanceId: "mailInstanceId",
					instanceList: "mailInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([1, 2, 3]),
				}),
				createInstanceSessionKey({
					instanceId: "fileInstanceId",
					instanceList: "fileInstanceList",
					typeInfo: createTypeInfo(),
					symEncSessionKey: new Uint8Array([4, 5, 6]),
				}),
			]
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([updatableInstanceSessionKeys[0]])
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([updatableInstanceSessionKeys[1]])
			await delay(0)
			const updatedPostCaptor = captor()
			verify(serviceExecutor.post(UpdateSessionKeysService, updatedPostCaptor.capture()))
			o(updatedPostCaptor.value.ownerEncSessionKeys).deepEquals(updatableInstanceSessionKeys)
		})

		o("empty inputs do not trigger a call to the service", async function () {
			ownerEncSessionKeysUpdateQueue.updateInstanceSessionKeys([])
			await delay(0)
			verify(serviceExecutor.post(UpdateSessionKeysService, anything()), { times: 0 })
		})
	})
})
