import { assertMainOrNode } from "@tutao/app-env"
import { DeleteService, GetService, ParamTypeFromRef, PostService, PutService, ReturnTypeFromRef } from "../meta"
import { AesKey } from "@tutao/crypto"
import { SuspensionBehavior } from "../rest-client/types"
import { Nullable } from "@tutao/utils"

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

export interface ExtraServiceParams {
	queryParams: Nullable<Dict>
	sessionKey: Nullable<AesKey>
	extraHeaders: Nullable<Dict>
	suspensionBehavior: Nullable<SuspensionBehavior>
	/** override origin for the request */
	baseUrl: Nullable<string>
}
export const DEFAULT_EXTRA_SERVICE_PARAMS: ExtraServiceParams = {
	queryParams: null,
	sessionKey: null,
	extraHeaders: null,
	suspensionBehavior: null,
	baseUrl: null,
}
