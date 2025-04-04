import o from "@tutao/otest"
import { IServiceExecutor } from "../../../../../src/common/api/common/ServiceRequest"
import { ApplicationTypesFacade } from "../../../../../src/common/api/worker/facades/ApplicationTypesFacade"
import { object, verify, when } from "testdouble"
import { ApplicationTypesService } from "../../../../../src/common/api/entities/base/Services"
import { defer } from "@tutao/tutanota-utils"

o.spec("ApplicationTypesFacade", function () {
	let serviceExecutor: IServiceExecutor
	let applicationTypesFacade: ApplicationTypesFacade

	o.beforeEach(function () {
		serviceExecutor = object()
		applicationTypesFacade = new ApplicationTypesFacade(serviceExecutor)
	})

	// FIXME figure out if the test is correct and why it fails?
	o("getServerApplicationTypesJson properly queues requests", async function () {
		o.timeout(1000)
		const mockResponse = {
			jsonAllApplicationTypesString: "{}",
			currentApplicationVersionSum: "1",
		}
		when(serviceExecutor.get(ApplicationTypesService, null)).thenResolve(mockResponse)

		const promise1 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise2 = applicationTypesFacade.getServerApplicationTypesJson()
		const promise3 = applicationTypesFacade.getServerApplicationTypesJson()

		await new Promise((resolve) => setTimeout(resolve, 600))

		await promise1
		await promise2
		await promise3

		verify(serviceExecutor.get(ApplicationTypesService, null), { times: 1 })
	})
})
