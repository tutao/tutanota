//@flow
import {ReadCounterReturnTypeRef} from "../../entities/monitor/ReadCounterReturn"
import {HttpMethod} from "../../common/EntityFunctions"
import {createReadCounterData} from "../../entities/monitor/ReadCounterData"
import {serviceRequest} from "../ServiceRequestWorker"
import {MonitorService} from "../../entities/monitor/Services"
import {assertWorkerOrNode} from "../../common/Env"

assertWorkerOrNode()

export class CounterFacade {

	constructor() {

	}

	readCounterValue(monitorValue: string, ownerId: Id): Promise<?NumberString> {
		let counterData = createReadCounterData()
		counterData.monitor = monitorValue
		counterData.owner = ownerId
		return serviceRequest(MonitorService.CounterService, HttpMethod.GET, counterData, ReadCounterReturnTypeRef)
			.then(counterReturn => {
				return counterReturn.value;
			})
	}
}