export type RecordedRequest = { url: string; init: RequestInit }

export function mockedFetch(...responses: (Response | Error)[]) {
	const requests: RecordedRequest[] = []
	const fetchFunction = (async (url: URL | string, init: RequestInit) => {
		requests.push({ url: url.toString(), init })
		const response = responses.shift()
		if (response === undefined) throw new Error("no response configured")
		if (response instanceof Error) throw response
		return response
	}) as any as typeof fetch
	return { fetchFunction, requests }
}

export function json(status: number, body: any = {}, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), { status, headers })
}

// startSync for MigrationSyncSessions resolve once the mailboxes are announced, the download continues in the background, this is used to conclude the downloads in tests
export function flushBackgroundSync() {
	return new Promise((resolve) => setTimeout(resolve, 0))
}
