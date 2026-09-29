import o from "@tutao/otest"
import { matchers, object, verify } from "testdouble"
import { UiHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/UiHost"
import { PluginManager } from "../../../../../src/plugin-kit/plugin-manager/PluginManager"
import { ExtensionPoint } from "../../../../../src/plugin-kit/sdk/hostApi/PluginHostApi"

o.spec("UiHostTest", () => {
	let pluginManager: PluginManager
	let uiHost: UiHost

	o.beforeEach(() => {
		pluginManager = object<PluginManager>()
		uiHost = new UiHost("nextcloud", pluginManager)
	})

	o.test("registerConfigFields registers each entry individually, scoped to the plugin id", async () => {
		const cfg1 = { extensionPoint: ExtensionPoint.ConfigField as const, configFieldId: "a", text: { en: "A" }, defaultValue: "" }
		const cfg2 = { extensionPoint: ExtensionPoint.ConfigField as const, configFieldId: "b", text: { en: "B" }, defaultValue: "" }

		await uiHost.registerConfigFields([cfg1, cfg2])

		verify(pluginManager.registerConfigField("nextcloud", cfg1))
		verify(pluginManager.registerConfigField("nextcloud", cfg2))
	})

	o.test("registerConfigFields does nothing for an empty array", async () => {
		await uiHost.registerConfigFields([])

		verify(pluginManager.registerConfigField(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("registerButton delegates and returns a ref pointing at the plugin id", async () => {
		const cfg = { extensionPoint: ExtensionPoint.SaveAttachmentDialog, text: { en: "Save" } }

		const ref = await uiHost.registerButton(cfg)

		verify(pluginManager.registerButton("nextcloud", cfg))
		o.check(ref).deepEquals({ id: "nextcloud" })
	})
})
