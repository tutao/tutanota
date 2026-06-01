import { assertMainOrNode } from "@tutao/app-env"
import { DeleteService, GetService, ParamTypeFromRef, PostService, PutService, ReturnTypeFromRef } from "../meta"
import { AesKey } from "@tutao/crypto"
import { SuspensionBehavior } from "../rest-client/types"

assertMainOrNode()

export interface IServiceExecutor {
	get<S extends GetService>(
		service: S,
		data: ParamTypeFromRef<S["get"]["data"]>,
		params: ExtraServiceParams | null,
	): Promise<ReturnTypeFromRef<S["get"]["return"]>>

	post<S extends PostService>(
		service: S,
		data: ParamTypeFromRef<S["post"]["data"]>,
		params: ExtraServiceParams | null,
	): Promise<ReturnTypeFromRef<S["post"]["return"]>>

	put<S extends PutService>(
		service: S,
		data: ParamTypeFromRef<S["put"]["data"]>,
		params: ExtraServiceParams | null,
	): Promise<ReturnTypeFromRef<S["put"]["return"]>>

	delete<S extends DeleteService>(
		service: S,
		data: ParamTypeFromRef<S["delete"]["data"]>,
		params: ExtraServiceParams | null,
	): Promise<ReturnTypeFromRef<S["delete"]["return"]>>
}

export interface ExtraServiceParams {
	queryParams: Dict | null
	sessionKey: AesKey | null
	extraHeaders: Dict | null
	suspensionBehavior: SuspensionBehavior | null
	/** override origin for the request */
	baseUrl: string | null
}

export const NULL_EXTRA_SERVICE_PARAMS: ExtraServiceParams = {
	queryParams: null,
	sessionKey: null,
	extraHeaders: null,
	suspensionBehavior: null,
	baseUrl: null,
}
