import o from "@tutao/otest"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { RolloutFacade } from "../../../../../src/common/api/worker/facades/RolloutFacade"
import { object, verify, when } from "testdouble"
import { RolloutService } from "../../../../../src/common/api/entities/sys/Services"
import { createTestEntity } from "../../../TestUtils"
import { RolloutGetOutTypeRef, RolloutTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { RolloutType } from "../../../../../src/common/api/common/TutanotaConstants"

o.spec("RolloutFacadeTest", function () {
	let serviceExecutor: IServiceExecutor
	let rolloutFacade: RolloutFacade

	o.beforeEach(function () {
		serviceExecutor = object()
		rolloutFacade = new RolloutFacade(serviceExecutor)
	})

	o("initialize() gets the rollouts from the server", async function () {
		when(serviceExecutor.get(RolloutService, null)).thenResolve(createTestEntity(RolloutGetOutTypeRef, { rollouts: [] }))
		await rolloutFacade.initialize()
		verify(serviceExecutor.get(RolloutService, null))
	})

	o("processRollout() executes a scheduled rollout", async function () {
		when(serviceExecutor.get(RolloutService, null)).thenResolve(
			createTestEntity(RolloutGetOutTypeRef, { rollouts: [createTestEntity(RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })] }),
		)
		await rolloutFacade.initialize()

		const expectedReturnValue = 7
		const result = await rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation, () => {
			return Promise.resolve(expectedReturnValue)
		})
		o(result).equals(expectedReturnValue)
	})

	o("processRollout() does not execute a rollout not scheduled", async function () {
		when(serviceExecutor.get(RolloutService, null)).thenResolve(
			createTestEntity(RolloutGetOutTypeRef, { rollouts: [createTestEntity(RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })] }),
		)
		await rolloutFacade.initialize()

		const notExpectedReturnValue = 7
		const result = await rolloutFacade.processRollout(RolloutType.SharedMailboxIdentityKeyCreation, () => {
			// no scheduled rollout for this type, so this should not be run.
			return Promise.resolve(notExpectedReturnValue)
		})
		o(result).equals(null)
	})
})
