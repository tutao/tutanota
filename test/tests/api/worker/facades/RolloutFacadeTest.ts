import o from "@tutao/otest"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { RolloutAction, RolloutFacade } from "../../../../../src/common/api/worker/facades/RolloutFacade"
import { func, matchers, object, verify, when } from "testdouble"
import { sysServices, sysTypeRefs } from "@tutao/typeRefs"
import { createTestEntity } from "../../../TestUtils"
import { RolloutType } from "@tutao/appEnv"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"

o.spec("RolloutFacadeTest", function () {
	let serviceExecutor: IServiceExecutor
	let rolloutFacade: RolloutFacade
	let sendError: (error: Error) => Promise<void>
	o.beforeEach(function () {
		serviceExecutor = object()
		sendError = func<(error: Error) => Promise<void>>()
		rolloutFacade = new RolloutFacade(serviceExecutor, sendError)
	})

	o("getScheduledRolloutTypes() gets the rollouts from the server only once", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, { rollouts: [] }))
		await rolloutFacade.getScheduledRolloutTypes()
		await rolloutFacade.getScheduledRolloutTypes()

		verify(serviceExecutor.get(sysServices.RolloutService, null), { times: 1 })
	})

	o("processRollout() executes a scheduled rollout", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(
			createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, {
				rollouts: [createTestEntity(sysTypeRefs.RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })],
			}),
		)
		await rolloutFacade.getScheduledRolloutTypes()

		const action: RolloutAction = object()
		await rolloutFacade.configureRollout(RolloutType.UserIdentityKeyCreation, action)
		await rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation)
		verify(action.execute())
	})

	o("processRollout() does not execute a rollout that was not scheduled", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(
			createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, {
				rollouts: [createTestEntity(sysTypeRefs.RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })],
			}),
		)
		await rolloutFacade.getScheduledRolloutTypes()

		const action: RolloutAction = object()
		await rolloutFacade.processRollout(RolloutType.SharedMailboxIdentityKeyCreation)
		verify(action.execute(), { times: 0 })
	})

	o("rollouts are removed after processed", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(
			createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, {
				rollouts: [createTestEntity(sysTypeRefs.RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })],
			}),
		)
		await rolloutFacade.getScheduledRolloutTypes()

		await rolloutFacade.configureRollout(RolloutType.UserIdentityKeyCreation, object())
		await rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation)

		const remainingRollouts = await rolloutFacade.getScheduledRolloutTypes()
		// verify that return is empty
		for (const item of remainingRollouts) {
			throw new Error("remainingRollouts are not empty")
		}
	})

	o("cannot configure rollouts that are not scheduled", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, { rollouts: [] }))
		await rolloutFacade.getScheduledRolloutTypes()
		const action: RolloutAction = object()

		await rolloutFacade.configureRollout(RolloutType.AdminOrUserGroupKeyRotation, action)

		const remainingRollouts = await rolloutFacade.getScheduledRolloutTypes()
		// verify that return is empty
		for (const item of remainingRollouts) {
			throw new Error("remainingRollouts are not empty")
		}

		await rolloutFacade.processRollout(RolloutType.AdminOrUserGroupKeyRotation)
		verify(action.execute(), { times: 0 })
	})

	o("errors are sent", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(
			createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, {
				rollouts: [createTestEntity(sysTypeRefs.RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })],
			}),
		)
		await rolloutFacade.getScheduledRolloutTypes()

		const terror = new Error("test error")
		const action: RolloutAction = {
			execute(): Promise<void> {
				throw terror
			},
		}

		await rolloutFacade.configureRollout(RolloutType.UserIdentityKeyCreation, action)
		await rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation)
		verify(sendError(terror))
		// Also, processRollout did not throw
	})

	o("scheduled rollouts must be configured before processed", async function () {
		when(serviceExecutor.get(sysServices.RolloutService, null)).thenResolve(
			createTestEntity(sysTypeRefs.RolloutGetOutTypeRef, {
				rollouts: [createTestEntity(sysTypeRefs.RolloutTypeRef, { rolloutType: RolloutType.UserIdentityKeyCreation })],
			}),
		)
		await rolloutFacade.getScheduledRolloutTypes()

		await rolloutFacade.processRollout(RolloutType.UserIdentityKeyCreation)
		verify(sendError(matchers.argThat((error) => error instanceof ProgrammingError)))
	})
})
