import { fetch, RequestInfo, RequestInit, Response } from "undici"
import { ServiceUnavailableError, TooManyRequestsError } from "../../api/common/error/RestError.js"
import { filterInt } from "@tutao/tutanota-utils"
import { log } from "../DesktopLog.js"

const TAG = "[suspending-fetch]"

export async function suspensionAwareFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
	const res = await fetch(input, init)
	if ((res.status === ServiceUnavailableError.CODE || TooManyRequestsError.CODE) && (res.headers.get("retry-after") || res.headers.get("suspension-time"))) {
		// headers are lowercased, see https://nodejs.org/api/http.html#http_message_headers
		const time = filterInt((res.headers.get("retry-after") ?? res.headers.get("suspension-time")) as string)
		log.debug(TAG, `ServiceUnavailable when downloading missed notification, waiting ${time}s`)

		return new Promise((resolve, reject) => {
			setTimeout(() => suspensionAwareFetch(input, init).then(resolve, reject), time * 1000)
		})
	} else {
		return res
	}
}
