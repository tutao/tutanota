import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

/**
 * Metrics sum up of time periods
 */
class Sumup {
	timeSum: number = 0
	amount: number = 0

	add(time: number) {
		this.timeSum += time
		this.amount++
	}
}

export class SingleTimeMeasurement {
	category: Category
	syncMetrics: SyncMetrics
	start: number = performance.now()

	constructor(category: Category, syncMetrics: SyncMetrics) {
		this.category = category
		this.syncMetrics = syncMetrics
	}

	endMeasurement(): void {
		const result = performance.now() - this.start
		this.syncMetrics.getSumup(this.category).add(result)
	}
}

export enum Category {
	Decrypt,
	LoadMultipleRest,
	LoadRest,
	ProvideMultipleDb,
	ProvideRangeDb,
	GetDb,
	PutDb,
	PutMultipleDb,
}

export class SyncMetrics {
	metrics: Map<Category, Sumup> = new Map()
	start: number = performance.now()

	beginMeasurement(category: Category): SingleTimeMeasurement {
		return new SingleTimeMeasurement(category, this)
	}

	getResults(): string {
		return `SYNC metrics
		Full sync:           ${roundAndFormat(performance.now() - this.start)}ms
		Decrypt:             ${this.formatResult(Category.Decrypt)} 
		LoadMultiple REST:   ${this.formatResult(Category.LoadMultipleRest)}
		Load         REST:   ${this.formatResult(Category.LoadRest)}
		ProvideMultiple DB:  ${this.formatResult(Category.ProvideMultipleDb)}
		ProvideRange    DB:  ${this.formatResult(Category.ProvideRangeDb)}
		Get             DB:  ${this.formatResult(Category.GetDb)}
		Put             DB:  ${this.formatResult(Category.PutDb)}
		PutMultiple     DB:  ${this.formatResult(Category.PutMultipleDb)}
		`
	}

	getSumup(category: Category): Sumup {
		let measurement: Sumup | undefined = this.metrics.get(category)
		if (!measurement) {
			measurement = new Sumup()
			this.metrics.set(category, measurement)
		}
		return measurement
	}

	formatResult(category: Category): string {
		let sumup = this.getSumup(category)
		return `${roundAndFormat(sumup.timeSum)}ms | ${roundAndFormat(sumup.amount)}`
	}
}

function roundAndFormat(sum: number): string {
	return Math.round(sum).toString().padStart(6, " ")
}

export let syncMetrics: Nullable<SyncMetrics> = null

export function newSyncMetrics() {
	syncMetrics = new SyncMetrics()
}

export function purgeSyncMetrics() {
	syncMetrics = null
}
