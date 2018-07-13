//@flow
import {ReadCounterReturnTypeRef} from "../../entities/monitor/ReadCounterReturn"
import {HttpMethod} from "../../common/EntityFunctions"
import {createReadCounterData} from "../../entities/monitor/ReadCounterData"
import {serviceRequest} from "../EntityWorker"

export function readCounterValue(monitorValue: string, ownerId: Id) {
	let counterData = createReadCounterData()
	counterData.monitor = monitorValue
	counterData.owner = ownerId
	return serviceRequest("counterservice", HttpMethod.GET, counterData, ReadCounterReturnTypeRef).then(counterReturn => {
		return counterReturn.value;
	})
}