import { RequestInit } from "undici"
import { assertNotNull, filterInt } from "@tutao/tutanota-utils"
import { customFetch, FetchImpl, UndiciResponse } from "./NetAgent"
import { isSuspensionResponse, SuspensionHandler } from "../../api/worker/SuspensionHandler"

const TAG = "[suspending-fetch]"

export function makeSuspensionAwareFetch(suspensionHandler: SuspensionHandler): FetchImpl {
	const fetch = async (input: string | URL, init?: RequestInit): Promise<UndiciResponse> => {
		const res = await customFetch(input, init)
		const suspensionTime = res.headers.get("retry-after") || res.headers.get("suspension-time")
		if (isSuspensionResponse(res.status, suspensionTime)) {
			// isSuspensionResponse checks that the header is correct
			suspensionHandler.activateSuspensionIfInactive(filterInt(assertNotNull(suspensionTime)), new URL(input))
			return await suspensionHandler.deferRequest(() => fetch(input, init))
		} else {
			return res
		}
	}
	return fetch
}
