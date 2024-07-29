import o from "@tutao/otest"
import path from "node:path"
import { OutgoingHttpHeader } from "node:http"
import { func, matchers, object, verify, when } from "testdouble"
import { doHandleProtocols, handleProtocols } from "../../../../src/common/desktop/net/ProtocolProxy.js"

o.spec("ProtocolProxy", function () {
	let fetchMock

	o.beforeEach(function () {
		fetchMock = func()
	})

	o("will only be intercepted once on a session", function () {
		const protocol: any = object()
		const ses: any = { protocol }
		when(protocol.isProtocolHandled("http")).thenReturn(true)
		when(protocol.isProtocolHandled("https")).thenReturn(true)
		when(protocol.isProtocolHandled("asset")).thenReturn(true)
		handleProtocols(ses, "none")
		verify(protocol.handle("https", matchers.anything()), { times: 0 })
		verify(protocol.handle("http", matchers.anything()), { times: 0 })
		verify(protocol.handle("asset", matchers.anything()), { times: 0 })
	})

	o("protocol will be handled if it wasn't before", function () {
		const protocol: any = object()
		const ses: any = { protocol }
		when(protocol.isProtocolHandled("http")).thenReturn(false, true)
		when(protocol.isProtocolHandled("https")).thenReturn(false, true)
		when(protocol.isProtocolHandled("asset")).thenReturn(false, true)
		handleProtocols(ses, "none")
		verify(protocol.handle("http", matchers.anything()), { times: 1 })
		verify(protocol.handle("https", matchers.anything()), { times: 1 })
		verify(protocol.handle("asset", matchers.anything()), { times: 1 })
	})

	o.spec("OPTIONS gets intercepted", function () {
		o("fetch", async function () {
			const protocol: any = object()
			const ses: any = { protocol }
			const httpCaptor = matchers.captor()
			const httpsCaptor = matchers.captor()
			when(protocol.isProtocolHandled("http")).thenReturn(false, true)
			when(protocol.isProtocolHandled("https")).thenReturn(false, true)
			when(protocol.isProtocolHandled("asset")).thenReturn(true)
			when(protocol.handle("http", httpCaptor.capture())).thenReturn(undefined)
			when(protocol.handle("https", httpsCaptor.capture())).thenReturn(undefined)
			when(protocol.handle("asset", matchers.anything())).thenReturn(undefined)
			const path: any = object()
			const fs: any = object()
			doHandleProtocols(ses, "none", fetchMock, path, fs)
			const request = (url) => ({
				method: "OPTIONS",
				headers: {},
				url,
			})

			const responseHeaders = {
				"access-control-allow-origin": "*",
				"access-control-allow-methods": "POST, GET, PUT, DELETE",
				"access-control-allow-headers": "*",
			}
			const responseHttp = await httpCaptor.value(request("http://no/where"))
			const responseHttps = await httpsCaptor.value(request("https://no/where"))
			o(responseHttp.status).equals(200)
			o(headersToObject(responseHttp.headers)).deepEquals(responseHeaders)
			o(responseHttps.status).equals(200)
			o(headersToObject(responseHttps.headers)).deepEquals(responseHeaders)
		})
	})

	o.spec("methods other than OPTIONS get proxied", function () {
		o("GET http", async function () {
			const protocol: any = object()
			const ses: any = { protocol }
			const captor = matchers.captor()
			when(protocol.isProtocolHandled(matchers.anything())).thenReturn(false, true)
			when(protocol.isProtocolHandled(matchers.anything())).thenReturn(false, true)
			when(protocol.handle("http", captor.capture())).thenReturn(undefined)
			when(protocol.handle("https", matchers.anything())).thenReturn(undefined)
			when(protocol.handle("asset", matchers.anything())).thenReturn(undefined)
			const request = {
				arrayBuffer: () => Promise.resolve(new Uint8Array()),
				method: "GET",
				headers: {
					"some-header": "header-value",
				},
				url: "http://no/where",
				referrer: "",
			}
			const path: any = object()
			const fs: any = object()
			const responseSymbol = "abc"
			when(fetchMock("http://no/where", matchers.anything())).thenResolve(responseSymbol)
			doHandleProtocols(ses, "none", fetchMock, path, fs)
			const responseFromSubject = await captor.value(request)
			o(responseFromSubject).deepEquals(responseSymbol)
		})
	})

	o.spec("asset protocol works", function () {
		let protocol: any = object()
		let ses: any
		let promises: any = object()
		let fs: any = { promises }
		o.beforeEach(function () {
			when(protocol.isProtocolHandled("http")).thenReturn(true)
			when(protocol.isProtocolHandled("https")).thenReturn(true)
			when(protocol.isProtocolHandled("asset")).thenReturn(false, true)
			ses = { protocol }
		})

		o("returns files that can be found", async function () {
			const captor = matchers.captor()
			when(protocol.handle("asset", captor.capture())).thenReturn(undefined)
			when(fs.promises.readFile("/tutanota/assets/noodles.txt")).thenResolve("hello OK")
			doHandleProtocols(ses, "/tutanota/assets", fetchMock, path, fs)
			const request = { url: "asset://app/noodles.txt" }
			const responseFromSubject = await captor.value(request)
			o(await responseFromSubject.text()).deepEquals("hello OK")
		})

		o("normalizes pathname before resolving", async function () {
			const captor = matchers.captor()
			when(protocol.handle("asset", captor.capture())).thenReturn(undefined)
			when(fs.promises.readFile("/tutanota/assets/win32/noodles.exe")).thenResolve("hello OK")
			doHandleProtocols(ses, "/tutanota/assets", fetchMock, path, fs)
			const request = { url: "asset://app/subfolder/../../../win32/noodles.exe" }
			const responseFromSubject = await captor.value(request)
			o(await responseFromSubject.text()).deepEquals("hello OK")
		})

		o("rejects invalid protocol", async function () {
			const captor = matchers.captor()
			when(protocol.handle("asset", captor.capture())).thenReturn(undefined)
			doHandleProtocols(ses, "/tutanota/assets", fetchMock, path, fs)
			const request = { url: "basset://app/noodles.txt" }
			const responseFromSubject = await captor.value(request)
			o(await responseFromSubject.status).deepEquals(404)
		})

		o("rejects non-app hostname", async function () {
			const captor = matchers.captor()
			when(protocol.handle("asset", captor.capture())).thenReturn(undefined)
			doHandleProtocols(ses, "/tutanota/assets", fetchMock, path, fs)
			const request = { url: "asset://bop/noodles.txt" }
			const responseFromSubject = await captor.value(request)
			o(await responseFromSubject.status).deepEquals(404)
		})
	})
})

function headersToObject(headers: Headers): Record<string, OutgoingHttpHeader> {
	const returnObject: Record<string, OutgoingHttpHeader> = {}
	// headers should be iterable but maybe not in our configuration for some reason
	// eslint-disable-next-line unicorn/no-array-for-each
	headers.forEach((value: OutgoingHttpHeader, key: string) => {
		returnObject[key] = value
	})
	return returnObject
}
