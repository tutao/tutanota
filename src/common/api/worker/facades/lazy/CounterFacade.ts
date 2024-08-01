import { CounterValue, createReadCounterData } from "../../../entities/monitor/TypeRefs.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { CounterService } from "../../../entities/monitor/Services.js"
import { CounterType } from "../../../common/TutanotaConstants.js"

assertWorkerOrNode()

export class CounterFacade {
	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	async readCounterValue(counterType: CounterType, rowName: string, columnName: Id): Promise<number> {
		const counterData = createReadCounterData({
			counterType,
			rowName,
			columnName,
		})
		const counterReturn = await this.serviceExecutor.get(CounterService, counterData)
		return Number(counterReturn.counterValues[0].value)
	}

	async readAllCustomerCounterValues(counterType: CounterType, customerId: Id): Promise<CounterValue[]> {
		const counterData = createReadCounterData({
			counterType,
			rowName: customerId,
			columnName: null,
		})
		const counterReturn = await this.serviceExecutor.get(CounterService, counterData)
		return counterReturn.counterValues
	}
}
