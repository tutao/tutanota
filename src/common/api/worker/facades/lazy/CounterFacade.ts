import { assertWorkerOrNode } from "@tutao/appEnv"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { monitorServices, monitorTypeRefs } from "@tutao/typeRefs"
import { CounterType } from "@tutao/appEnv"

assertWorkerOrNode()

export class CounterFacade {
	constructor(private readonly serviceExecutor: IServiceExecutor) {}

	async readCounterValue(counterType: CounterType, rowName: string, columnName: Id): Promise<number> {
		const counterData = monitorTypeRefs.createReadCounterData({
			counterType,
			rowName,
			columnName,
		})
		const counterReturn = await this.serviceExecutor.get(monitorServices.CounterService, counterData)
		return Number(counterReturn.counterValues[0].value)
	}

	async readAllCustomerCounterValues(counterType: CounterType, customerId: Id): Promise<monitorTypeRefs.CounterValue[]> {
		const counterData = monitorTypeRefs.createReadCounterData({
			counterType,
			rowName: customerId,
			columnName: null,
		})
		const counterReturn = await this.serviceExecutor.get(monitorServices.CounterService, counterData)
		return counterReturn.counterValues
	}
}
