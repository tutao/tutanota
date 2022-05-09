import o from "ospec"
import type {BrowserData} from "../../src/misc/ClientConstants.js"
import type {Db} from "../../src/api/worker/search/SearchTypes.js"
import {IndexerCore} from "../../src/api/worker/search/IndexerCore.js"
import {EventQueue} from "../../src/api/worker/search/EventQueue.js"
import {DbFacade, DbTransaction} from "../../src/api/worker/search/DbFacade.js"
import {assertNotNull, neverNull, Thunk} from "@tutao/tutanota-utils"
import type {DesktopKeyStoreFacade} from "../../src/desktop/KeyStoreFacadeImpl.js"
import {mock} from "@tutao/tutanota-test-utils"
import {aes256RandomKey, fixedIv, uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {ScheduledPeriodicId, ScheduledTimeoutId, Scheduler} from "../../src/api/common/utils/Scheduler.js"

export const browserDataStub: BrowserData = {
	needsMicrotaskHack: false,
	needsExplicitIDBIds: false,
	indexedDbSupported: true
}

export function makeCore(args?: {
	db?: Db,
	queue?: EventQueue,
	browserData?: BrowserData,
	transaction?: DbTransaction
}, mocker?: (_: any) => void): IndexerCore {
	const safeArgs = args ?? {}
	const {transaction} = safeArgs
	const defaultDb = {
		key: aes256RandomKey(),
		iv: fixedIv,
		dbFacade: ({createTransaction: () => Promise.resolve(transaction)} as Partial<DbFacade>),
		initialized: Promise.resolve()
	} as Partial<Db> as Db
	const defaultQueue = {} as Partial<EventQueue> as EventQueue
	const {db, queue, browserData} = {
		...{db: defaultDb, browserData: browserDataStub, queue: defaultQueue},
		...safeArgs,
	}
	const core = new IndexerCore(db, queue, browserData)
	mocker && mock(core, mocker)
	return core
}

export function preTest() {
	if (globalThis.isBrowser) {
		const p = document.createElement("p")
		p.id = "report"
		p.style.fontWeight = "bold"
		p.style.fontSize = "30px"
		p.style.fontFamily = "sans-serif"
		p.textContent = "Running tests..."
		neverNull(document.body).appendChild(p)
	}
}

export function reportTest(results: any, stats: any) {
	// @ts-ignore
	const errCount = o.report(results, stats)
	if (typeof process != "undefined" && errCount !== 0) process.exit(1) // eslint-disable-line no-process-exit
	if (globalThis.isBrowser) {
		const p = assertNotNull(document.getElementById("report"))
		// errCount includes bailCount
		p.textContent = errCount === 0 ? "No errors" : `${errCount} error(s) (see console)`
		p.style.color = errCount === 0 ? "green" : "red"
	}
}

export function makeKeyStoreFacade(uint8ArrayKey: Uint8Array): DesktopKeyStoreFacade {
	return {
		getDeviceKey() {
			return Promise.resolve(uint8ArrayToKey(uint8ArrayKey))
		},
		getCredentialsKey(): Promise<Aes256Key> {
			return Promise.resolve(uint8ArrayToKey(uint8ArrayKey))
		}
	}
}

type IdThunk = {
	id: ScheduledTimeoutId
	thunk: Thunk
}

export class SchedulerMock implements Scheduler {
	alarmId: number = 0

	/** key is the time */
	scheduledAt: Map<number, IdThunk> = new Map()
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

	unscheduleTimeout(id) {
		this.cancelledAt.add(id)
	}

	schedulePeriodic(thunk, period: number): ScheduledPeriodicId {
		const id = this._incAlarmId()
		this.scheduledPeriodic.set(period, {id, thunk})
		return id
	}

	unschedulePeriodic(id: ScheduledPeriodicId) {
		this.cancelledPeriodic.add(id)
	}

	_incAlarmId(): ScheduledTimeoutId {
		return this.alarmId++
	}
}