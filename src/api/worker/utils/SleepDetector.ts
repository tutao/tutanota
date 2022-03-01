import {Thunk} from "@tutao/tutanota-utils"
import {Scheduler} from "../../common/utils/Scheduler.js"
import {DateProvider} from "../../common/DateProvider"

// exported for testing
export const CHECK_INTERVAL = 5000
export const SLEEP_INTERVAL = 15000

interface ScheduledState {
	scheduledId: number,
	lastTime: number,
	readonly onSleep: Thunk,
}

export class SleepDetector {
	private scheduledState: ScheduledState | null = null

	constructor(
		private readonly scheduler: Scheduler,
		private readonly dateProvider: DateProvider,
	) {
	}

	start(onSleep: Thunk): void {
		this.stop()
		this.scheduledState = {
			scheduledId: this.scheduler.schedulePeriodic(() => this.check(), CHECK_INTERVAL),
			lastTime: this.dateProvider.now(),
			onSleep,
		}
	}

	private check() {
		if (this.scheduledState == null) return

		const now = this.dateProvider.now()
		if (now - this.scheduledState.lastTime > SLEEP_INTERVAL) {
			this.scheduledState.onSleep()
		}
		this.scheduledState.lastTime = now
	}

	stop(): void {
		if (this.scheduledState) {
			this.scheduler.unschedulePeriodic(this.scheduledState.scheduledId)
			this.scheduledState = null
		}
	}
}