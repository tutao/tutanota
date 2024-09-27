import type { BrowserData } from "../../src/common/misc/ClientConstants.js"
import type { Db } from "../../src/common/api/worker/search/SearchTypes.js"
import { IndexerCore } from "../../src/mail-app/workerUtils/index/IndexerCore.js"
import { EventQueue } from "../../src/common/api/worker/EventQueue.js"
import { DbFacade, DbTransaction } from "../../src/common/api/worker/search/DbFacade.js"
import { assertNotNull, deepEqual, defer, Thunk, TypeRef } from "@tutao/tutanota-utils"
import type { DesktopKeyStoreFacade } from "../../src/common/desktop/DesktopKeyStoreFacade.js"
import { mock } from "@tutao/tutanota-test-utils"
import { aes256RandomKey, fixedIv, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { ScheduledPeriodicId, ScheduledTimeoutId, Scheduler } from "../../src/common/api/common/utils/Scheduler.js"
import { matchers, object, when } from "testdouble"
import { Entity, TypeModel } from "../../src/common/api/common/EntityTypes.js"
import { create } from "../../src/common/api/common/utils/EntityUtils.js"
import { typeModels } from "../../src/common/api/common/EntityFunctions.js"
import { type fetch as undiciFetch, type Response } from "undici"

export const browserDataStub: BrowserData = {
	needsMicrotaskHack: false,
	needsExplicitIDBIds: false,
	indexedDbSupported: true,
}

export function makeCore(
	args?: {
		db?: Db
		queue?: EventQueue
		browserData?: BrowserData
		transaction?: DbTransaction
	},
	mocker?: (_: any) => void,
): IndexerCore {
	const safeArgs = args ?? {}
	const { transaction } = safeArgs
	const defaultDb = {
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: { createTransaction: () => Promise.resolve(transaction) } as Partial<DbFacade>,
		initialized: Promise.resolve(),
	} as Partial<Db> as Db
	const defaultQueue = {} as Partial<EventQueue> as EventQueue
	const { db, queue, browserData } = {
		...{ db: defaultDb, browserData: browserDataStub, queue: defaultQueue },
		...safeArgs,
	}
	const core = new IndexerCore(db, queue, browserData)
	mocker && mock(core, mocker)
	return core
}

export function makeKeyStoreFacade(uint8ArrayKey: Uint8Array): DesktopKeyStoreFacade {
	const o: DesktopKeyStoreFacade = object()
	when(o.getDeviceKey()).thenResolve(uint8ArrayToKey(uint8ArrayKey))
	when(o.getKeyChainKey()).thenResolve(uint8ArrayToKey(uint8ArrayKey))
	return o
}

type IdThunk = {
	id: ScheduledTimeoutId
	thunk: Thunk
}

export class SchedulerMock implements Scheduler {
	alarmId: number = 0

	/** key is the time */
	scheduledAt: Map<number, IdThunk> = new Map()
	scheduledAfter: Map<number, IdThunk> = new Map()
	cancelledAt: Set<ScheduledTimeoutId> = new Set()
	scheduledPeriodic: Map<number, IdThunk> = new Map()
	cancelledPeriodic: Set<ScheduledTimeoutId> = new Set()

	scheduleAt(callback, date): ScheduledTimeoutId {
		const id = this._incAlarmId()

		this.scheduledAt.set(date.getTime(), {
			id,
			thunk: callback,
		})
		return id
	}

	getThunkAt(time: number): Thunk {
		return assertNotNull(this.scheduledAt.get(time), "No thunk scheduled at " + time).thunk
	}

	getThunkAfter(time: number): Thunk {
		return assertNotNull(this.scheduledAfter.get(time), "No thunk scheduled after " + time).thunk
	}

	scheduleAfter(thunk: Thunk, after: number): ScheduledTimeoutId {
		const id = this._incAlarmId()

		this.scheduledAfter.set(after, {
			id,
			thunk: thunk,
		})
		return id
	}

	unscheduleTimeout(id) {
		this.cancelledAt.add(id)
	}

	schedulePeriodic(thunk, period: number): ScheduledPeriodicId {
		const id = this._incAlarmId()
		this.scheduledPeriodic.set(period, { id, thunk })
		return id
	}

	getThunkPeriodic(period: number): Thunk {
		return assertNotNull(this.scheduledPeriodic.get(period), "No thunk scheduled each " + period).thunk
	}

	getAllPeriodThunks(): Array<Thunk> {
		return Array.from(this.scheduledPeriodic.values()).map((idThunk) => idThunk.thunk)
	}

	unschedulePeriodic(id: ScheduledPeriodicId) {
		this.cancelledPeriodic.add(id)
	}

	_incAlarmId(): ScheduledTimeoutId {
		return this.alarmId++
	}
}

export const domainConfigStub: DomainConfig = {
	firstPartyDomain: true,
	partneredDomainTransitionUrl: "",
	apiUrl: "",
	u2fAppId: "",
	webauthnRpId: "",
	referralBaseUrl: "",
	giftCardBaseUrl: "",
	paymentUrl: "",
	webauthnUrl: "",
	legacyWebauthnUrl: "",
	webauthnMobileUrl: "",
	legacyWebauthnMobileUrl: "",
	websiteBaseUrl: "",
}

// non-async copy of the function
function resolveTypeReference(typeRef: TypeRef<any>): TypeModel {
	// @ts-ignore
	const modelMap = typeModels[typeRef.app]

	const typeModel = modelMap[typeRef.type]
	if (typeModel == null) {
		throw new Error("Cannot find TypeRef: " + JSON.stringify(typeRef))
	} else {
		return typeModel
	}
}

export function createTestEntity<T extends Entity>(typeRef: TypeRef<T>, values?: Partial<T>): T {
	const typeModel = resolveTypeReference(typeRef as TypeRef<any>)
	const entity = create(typeModel, typeRef)
	if (values) {
		return Object.assign(entity, values)
	} else {
		return entity
	}
}

export function mockFetchRequest(mock: typeof undiciFetch, url: string, headers: Record<string, string>, status: number, jsonObject: unknown): Promise<void> {
	const response = object<Writeable<Response>>()
	response.ok = status >= 200 && status < 300
	response.status = status
	const jsonDefer = defer<void>()
	when(response.json()).thenDo(() => {
		jsonDefer.resolve()
		return Promise.resolve(jsonObject)
	})
	when(
		mock(
			matchers.argThat((urlArg) => urlArg.toString() === url),
			matchers.argThat((options) => {
				return deepEqual(options.headers, headers)
			}),
		),
	).thenResolve(response)
	return jsonDefer.promise
}

export function textIncludes(match: string): (text: string) => { pass: true } | { pass: false; message: string } {
	return (text) => (text.includes(match) ? { pass: true } : { pass: false, message: `should include: "${match}"` })
}
