import type { DataTransferEntity, ServiceDefinition } from "@tutao/meta"
import type { Nullable } from "@tutao/utils"
import type { ExtraServiceParams } from "../instance-pipeline/RestClientOptions"

export interface IServiceExecutor {
	execute<In extends DataTransferEntity, Out extends DataTransferEntity>(
		service: ServiceDefinition<In, Out>,
		data: In,
		params: Nullable<ExtraServiceParams>,
	): Promise<Out>
}
