import o from "@tutao/otest"
import { CHECK_INTERVAL, SLEEP_INTERVAL, SleepDetector } from "../../../../../src/common/api/worker/utils/SleepDetector.js"
import { SchedulerMock } from "../../../TestUtils.js"
import { func, object, verify, when } from "testdouble"
import { assertNotNull } from "@tutao/tutanota-utils"
import { DateProvider } from "../../../../../src/common/api/common/DateProvider.js"

o.spec("SleepDetector", function () {
	let scheduler: SchedulerMock
	let dateProvider: DateProvider
	let detector: SleepDetector

	o.beforeEach(function () {
		scheduler = new SchedulerMock()
		dateProvider = object()
		detector = new SleepDetector(scheduler, dateProvider)
	})

	o("on lower periods it does not report sleep", function () {
		when(dateProvider.now()).thenReturn(1, 1 + CHECK_INTERVAL)

		detector.start(() => {
			throw new Error("Sleep detected while it shouldn't be")
		})
		const { thunk } = assertNotNull(scheduler.scheduledPeriodic.get(CHECK_INTERVAL))
		thunk()
	})

	o("on higher periods it does report sleep", function () {
		when(dateProvider.now()).thenReturn(1, 1 + SLEEP_INTERVAL + 10)

		const sleepCb = func(() => {})
		detector.start(sleepCb)
		const { thunk } = assertNotNull(scheduler.scheduledPeriodic.get(CHECK_INTERVAL))
		thunk()

		verify(sleepCb())
	})

	o("when cancelling it unschedules", function () {
		when(dateProvider.now()).thenReturn(1)

		const sleepCb = func(() => {})
		detector.start(sleepCb)
		const { id } = assertNotNull(scheduler.scheduledPeriodic.get(CHECK_INTERVAL))
		detector.stop()

		o(scheduler.cancelledPeriodic.has(id)).equals(true)("Has cancelled check task")
	})
})
