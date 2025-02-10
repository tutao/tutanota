import { Stage } from "@tutao/tutanota-usagetests"

export async function completeStageNow(stage: Stage) {
	stage.setMetric({ name: "timestamp", value: Date.now().toString() })

	// complete() will NEVER return void
	const success = (await stage.complete()) as boolean
	if (!success) {
		throw new Error(`stage ${stage.number} could not be completed`)
	}
}
