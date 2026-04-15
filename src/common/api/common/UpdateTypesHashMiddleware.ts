import { HttpMethod, RestClientMiddleware } from "@tutao/rest-client"
import { isNotNull } from "@tutao/utils"
import { baseServices, ServerModelInfo } from "@tutao/typerefs"
import { APPLICATION_TYPES_HASH_HEADER } from "@tutao/app-env"
import { getServiceRestPath } from "../worker/rest/ServiceExecutor"

/**
 * handle new server model and update the applicationTypesJson file if applicable
 */
export class UpdateAppTypesHashMiddleware implements RestClientMiddleware {
	constructor(private readonly serverModelInfo: ServerModelInfo) {}

	async interceptResponse(sentRequest: XMLHttpRequest, method: HttpMethod): Promise<void> {
		const path = sentRequest.responseURL
		const applicationTypesHashResponseHeader = sentRequest.getResponseHeader(APPLICATION_TYPES_HASH_HEADER)
		if (isNotNull(applicationTypesHashResponseHeader)) {
			this.serverModelInfo.setCurrentHash(applicationTypesHashResponseHeader)
		} else if (!(path === getServiceRestPath(baseServices.ApplicationTypesService) && method === HttpMethod.GET)) {
			console.log(`Empty value for app types hash header in response with path ${path} and method ${method}`)
		}
	}
}
