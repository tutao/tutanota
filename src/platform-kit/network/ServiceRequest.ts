import { assertMainOrNode } from "@tutao/app-env"
import { DeleteService, GetService, ParamTypeFromRef, PostService, PutService, ReturnTypeFromRef } from "../meta"
import { Nullable } from "@tutao/utils"
import { ExtraServiceParams } from "../instance-pipeline/RestClientOptions"

assertMainOrNode()

export interface IServiceExecutor {
	get<S extends GetService>(
		service: S,
		data: ParamTypeFromRef<S["get"]["data"]>,
		params: Nullable<ExtraServiceParams>,
	): Promise<ReturnTypeFromRef<S["get"]["return"]>>

	post<S extends PostService>(
		service: S,
		data: ParamTypeFromRef<S["post"]["data"]>,
		params: Nullable<ExtraServiceParams>,
	): Promise<ReturnTypeFromRef<S["post"]["return"]>>

	put<S extends PutService>(
		service: S,
		data: ParamTypeFromRef<S["put"]["data"]>,
		params: Nullable<ExtraServiceParams>,
	): Promise<ReturnTypeFromRef<S["put"]["return"]>>

	delete<S extends DeleteService>(
		service: S,
		data: ParamTypeFromRef<S["delete"]["data"]>,
		params: Nullable<ExtraServiceParams>,
	): Promise<ReturnTypeFromRef<S["delete"]["return"]>>
}
