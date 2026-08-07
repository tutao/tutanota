import { assertMainOrNode } from "@tutao/app-env"
import { DataTransferEntity, ServiceDefinition } from "../meta"
import { Nullable } from "@tutao/utils"
import { ExtraServiceParams } from "../instance-pipeline/RestClientOptions"

assertMainOrNode()

export interface IServiceExecutor {
	execute<In extends DataTransferEntity, Out extends DataTransferEntity>(
		service: ServiceDefinition<In, Out>,
		data: In,
		params: Nullable<ExtraServiceParams>,
	): Promise<Out>
}
