import o, { assertThrows } from "@tutao/otest"
import { pluginIdFromString } from "../../../../src/plugin-kit/sdk/PluginId"

o.spec("PluginIdTest", () => {
	o.test("passes a known plugin id through unchanged", () => {
		o.check(pluginIdFromString("nextcloud")).equals("nextcloud")
	})

	o.test("throws for an unknown plugin id", async () => {
		const err = await assertThrows(Error, async () => pluginIdFromString("unknown-plugin"))
		o.check(err.message).equals("PluginId: unknown-plugin is not a known PluginId")
	})
})
