import { assertWorkerOrNode } from "@tutao/app-env"
import { IServiceExecutor } from "./ServiceRequest.js"
import { CounterValue, createReadCounterData } from "../entities/monitor/TypeRefs"
import { CounterService } from "../entities/monitor/Services"
import { CounterType } from "../entities/monitor/Utils"

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
