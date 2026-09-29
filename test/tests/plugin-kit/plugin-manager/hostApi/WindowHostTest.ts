import o, { assertThrows } from "@tutao/otest"
import { func, verify } from "testdouble"
import { WindowHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/WindowHost"
import { PluginManifest } from "../../../../../src/plugin-kit/sdk/PluginManifest"
import { HostApiPermissionDenied } from "../../../../../src/plugin-kit/sdk/PluginError"

function makeManifest(overrides: Partial<PluginManifest["permissions"]> = {}): PluginManifest {
	return {
		id: "nextcloud",
		name: "Test",
		description: "Test",
		logoSvgUrl: "",
		tags: [],
		homePage: "",
		version: { major: 0, minor: 1, patch: 0 },
		permissions: { windowOpen: { allowedDomains: [] }, getHost: true, ...overrides },
	}
}

o.spec("WindowHostTest", () => {
	let originalOpen: typeof window.open

	o.before(() => {
		originalOpen = window.open
	})

	o.afterEach(() => {
		window.open = originalOpen
	})

	o.spec("openWindow - protocol check", () => {
		o.test("allows https urls", async () => {
			;(window as any).open = func()
			const windowHost = new WindowHost(makeManifest())
			await windowHost.openWindow("https://example.com")
		})

		o.test("allows http urls", async () => {
			;(window as any).open = func()
			const windowHost = new WindowHost(makeManifest())
			await windowHost.openWindow("http://example.com")
		})

		o.test("rejects file urls", async () => {
			const windowHost = new WindowHost(makeManifest())
			const err = await assertThrows(HostApiPermissionDenied, () => windowHost.openWindow("file:///etc/passwd"))
			o.check(err.message).equals("Only https url are supported. Found: file:")
		})
	})

	o.spec("openWindow / closeWindow / isWindowOpen bookkeeping", () => {
		o.test("assigns sequential window ids starting at 0", async () => {
			;(window as any).open = () => ({ closed: false, close: func() })
			const windowHost = new WindowHost(makeManifest())

			const first = await windowHost.openWindow("https://a.example.com")
			const second = await windowHost.openWindow("https://b.example.com")

			o.check(first).equals(0)
			o.check(second).equals(1)
		})

		o.test("a null window.open result still yields a window id, and isWindowOpen resolves true for it", async () => {
			;(window as any).open = () => null
			const windowHost = new WindowHost(makeManifest())

			const windowId = await windowHost.openWindow("https://example.com")

			o.check(windowId).equals(0)
			o.check(await windowHost.isWindowOpen(windowId!)).equals(true)
		})

		o.test("a non-null window is stored and isWindowOpen reflects its closed state", async () => {
			const fakeWin = { closed: false, close: func() }
			;(window as any).open = () => fakeWin
			const windowHost = new WindowHost(makeManifest())
			const windowId = (await windowHost.openWindow("https://example.com"))!

			o.check(await windowHost.isWindowOpen(windowId)).equals(true)

			fakeWin.closed = true
			o.check(await windowHost.isWindowOpen(windowId)).equals(false)
		})

		o.test("closeWindow closes a stored non-null window", async () => {
			const fakeWin = { closed: false, close: func() }
			;(window as any).open = () => fakeWin
			const windowHost = new WindowHost(makeManifest())
			const windowId = (await windowHost.openWindow("https://example.com"))!

			await windowHost.closeWindow(windowId)

			verify(fakeWin.close())
		})

		o.test("closeWindow throws for an unknown window id", async () => {
			const windowHost = new WindowHost(makeManifest())
			const err = await assertThrows(Error, () => windowHost.closeWindow(999))
			o.check(err.message).equals("WindowId 999 does not exist")
		})

		o.test("isWindowOpen throws for an unknown window id", async () => {
			const windowHost = new WindowHost(makeManifest())
			const err = await assertThrows(Error, () => windowHost.isWindowOpen(999))
			o.check(err.message).equals("WindowId 999 does not exist")
		})
	})

	o.spec("getHost", () => {
		o.test("throws when permissions.getHost is false", async () => {
			const windowHost = new WindowHost(makeManifest({ getHost: false }))
			const err = await assertThrows(HostApiPermissionDenied, () => windowHost.getHost())
			o.check(err.message).equals("permissions.getHost is not declared true in manifest file")
		})

		o.test("returns the current hostname when permissions.getHost is true", async () => {
			// window.origin is shared global state that other specs' before() hooks may have mutated by the time this
			// runs, so pin it explicitly rather than relying on testInNode.ts's initial dom.reconfigure() call.
			const originalDescriptor = Object.getOwnPropertyDescriptor(window, "origin")
			Object.defineProperty(window, "origin", { value: "http://tutanota.com", configurable: true })
			try {
				const windowHost = new WindowHost(makeManifest({ getHost: true }))
				const host = await windowHost.getHost()
				o.check(host).equals("tutanota.com")
			} finally {
				if (originalDescriptor) {
					Object.defineProperty(window, "origin", originalDescriptor)
				} else {
					delete (window as any).origin
				}
			}
		})
	})
})
