import o from "ospec"
import http from "node:http"
import https from "node:https"
import path from "node:path"
import { constructor, matchers, object, replace, verify, when } from "testdouble"
import { doHandleProtocols, handleProtocols } from "../../../../src/desktop/net/ProtocolProxy.js"

o.spec("ProtocolProxy", function () {
	o("will only be intercepted once on a session", function () {
		const protocol: any = object()
		const ses: any = { protocol }
		when(protocol.isProtocolIntercepted("http")).thenReturn(true)
		when(protocol.isProtocolIntercepted("https")).thenReturn(true)
		when(protocol.isProtocolRegistered("asset")).thenReturn(true)
		handleProtocols(ses, "none")
	})

	o.spec("will be intercepted if it wasn't before", function () {
		o("http", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			when(protocol.isProtocolIntercepted("http")).thenReturn(false)
			when(protocol.isProtocolIntercepted("https")).thenReturn(true)
			when(protocol.isProtocolRegistered("asset")).thenReturn(true)
			when(protocol.interceptStreamProtocol("http", matchers.anything())).thenReturn(true)
			handleProtocols(ses, "none")
		})

		o("https", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			when(protocol.isProtocolIntercepted("http")).thenReturn(true)
			when(protocol.isProtocolIntercepted("https")).thenReturn(false)
			when(protocol.isProtocolRegistered("asset")).thenReturn(true)
			when(protocol.interceptStreamProtocol("https", matchers.anything())).thenReturn(true)
			handleProtocols(ses, "none")
		})

		o("asset", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			when(protocol.isProtocolIntercepted("http")).thenReturn(true)
			when(protocol.isProtocolIntercepted("https")).thenReturn(true)
			when(protocol.isProtocolRegistered("asset")).thenReturn(false)
			when(protocol.registerFileProtocol("asset", matchers.anything())).thenReturn(true)
			handleProtocols(ses, "none")
		})
	})

	o.spec("OPTIONS gets intercepted", function () {
		o("http", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			const captor = matchers.captor()
			when(protocol.isProtocolIntercepted(matchers.anything())).thenReturn(false)
			when(protocol.isProtocolRegistered(matchers.anything())).thenReturn(false)
			when(protocol.interceptStreamProtocol("http", captor.capture())).thenReturn(true)
			when(protocol.interceptStreamProtocol("https", matchers.anything())).thenReturn(true)
			when(protocol.registerFileProtocol("asset", matchers.anything())).thenReturn(true)
			const agent: any = constructor(http.Agent)
			const httpModule: any = object()
			const httpsModule: any = object()
			replace(httpModule, "Agent", agent)
			replace(httpsModule, "Agent", agent)
			const path: any = object()
			doHandleProtocols(ses, "none", httpModule, httpsModule, path)
			const request = {
				method: "OPTIONS",
				headers: {},
				url: "http://no/where",
				uploadData: null,
				referrer: "",
			}
			const response = {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
					"Access-Control-Allow-Headers": "*",
				},
			}
			const responseReceiver = (resp) => o(resp).deepEquals(response)
			captor.value(request, responseReceiver)
		})

		o("https", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			const captor = matchers.captor()
			when(protocol.isProtocolIntercepted(matchers.anything())).thenReturn(false)
			when(protocol.isProtocolRegistered(matchers.anything())).thenReturn(false)
			when(protocol.interceptStreamProtocol("http", matchers.anything())).thenReturn(true)
			when(protocol.interceptStreamProtocol("https", captor.capture())).thenReturn(true)
			when(protocol.registerFileProtocol("asset", matchers.anything())).thenReturn(true)
			const agent: any = constructor(http.Agent)
			const httpModule: any = object()
			const httpsModule: any = object()
			replace(httpModule, "Agent", agent)
			replace(httpsModule, "Agent", agent)
			const path: any = object()
			doHandleProtocols(ses, "none", httpModule, httpsModule, path)
			const request = {
				method: "OPTIONS",
				headers: {},
				url: "https://no/where",
				uploadData: null,
				referrer: "",
			}
			const response = {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, GET, PUT, DELETE",
					"Access-Control-Allow-Headers": "*",
				},
			}
			const responseReceiver = (resp) => o(resp).deepEquals(response)
			captor.value(request, responseReceiver)
		})
	})

	o.spec("methods other than OPTIONS get proxied", function () {
		o("GET http", function () {
			const protocol: any = object()
			const ses: any = { protocol }
			const captor = matchers.captor()
			when(protocol.isProtocolIntercepted(matchers.anything())).thenReturn(false)
			when(protocol.isProtocolRegistered(matchers.anything())).thenReturn(false)
			when(protocol.interceptStreamProtocol("http", captor.capture())).thenReturn(true)
			when(protocol.interceptStreamProtocol("https", matchers.anything())).thenReturn(true)
			when(protocol.registerFileProtocol("asset", matchers.anything())).thenReturn(true)
			const agent: any = constructor(http.Agent)
			const httpModule: any = object(http)
			const httpsModule: any = object(https)
			const request = {
				method: "GET",
				headers: {
					"some-header": "header-value",
				},
				url: "http://no/where",
				uploadData: null,
				referrer: "",
			}
			const proxiedClientRequest: any = object(["request", "once", "end", "destroy"])
			replace(httpModule, "Agent", agent)
			replace(httpsModule, "Agent", agent)
			when(httpModule.request("http://no/where", { method: request.method, headers: request.headers, agent: matchers.anything() })).thenReturn(
				proxiedClientRequest,
			)
			const path: any = object()
			doHandleProtocols(ses, "none", httpModule, httpsModule, path)

			const response = { statusCode: 200, headers: {}, data: null }
			const responseReceiver = (resp) => o(resp).deepEquals(response)
			captor.value(request, responseReceiver)
			verify(httpModule.request("http://no/where", { method: request.method, headers: request.headers, agent: matchers.anything() }))
		})
	})

	o.spec("asset protocol works", function () {
		function testAssetResolution(name, url, expected) {
			o(name, function () {
				const protocol: any = object()
				const ses: any = { protocol }
				const captor = matchers.captor()
				when(protocol.isProtocolIntercepted(matchers.anything())).thenReturn(true)
				when(protocol.isProtocolRegistered(matchers.anything())).thenReturn(false)
				when(protocol.registerFileProtocol("asset", captor.capture())).thenReturn(true)
				const httpModule: any = {}
				const httpsModule: any = {}
				doHandleProtocols(ses, "/tutanota/assets", httpModule, httpsModule, path)
				const responseReceiver = (resp) => o(resp).deepEquals(expected)
				const request = { url }
				captor.value(request, responseReceiver)
			})
		}

		testAssetResolution("returns files that can be found", "asset://app/noodles.txt", { path: "/tutanota/assets/noodles.txt" })
		testAssetResolution("normalizes pathname before resolving", "asset://app/subfolder/../../../win32/noodles.exe", {
			path: "/tutanota/assets/win32/noodles.exe",
		})
		testAssetResolution("rejects invalid protocol", "basset://app/noodles.txt", { error: -6 })
		testAssetResolution("rejects non-app hostname", "asset://bop/noodles.txt", { error: -6 })
	})
})
