import o from "@tutao/otest"
import { object } from "testdouble"
import { PluginHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/PluginHost"
import { ConfigHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/ConfigHost"
import { MailEditorHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/MailEditorHost"
import { UiHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/UiHost"
import { WindowHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/WindowHost"
import { PluginManager } from "../../../../../src/plugin-kit/plugin-manager/PluginManager"
import { ConfigurationAdapter, MailIntegrationAdapter } from "../../../../../src/plugin-kit/plugin-manager/hostApi/PluginHost"
import { DialogAdapter } from "../../../../../src/plugin-kit/sdk/PluginApi"
import { NEXTCLOUD_PLUGIN_MANIFEST } from "../../../../../src/plugin-kit/plugins/nextcloud/manifest"

o.spec("PluginHostTest", () => {
	o.test("config and ui are set immediately by the constructor", () => {
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>())
		const pluginHost = new PluginHost(pluginManager, "nextcloud")

		o.check(pluginHost.config instanceof ConfigHost).equals(true)
		o.check(pluginHost.ui instanceof UiHost).equals(true)
	})

	o.test("mailEditor is null when the plugin manager has no mail integration adapter", () => {
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>())
		const pluginHost = new PluginHost(pluginManager, "nextcloud")

		o.check(pluginHost.mailEditor).equals(null)
	})

	o.test("mailEditor is a MailEditorHost when the plugin manager has a mail integration adapter", () => {
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>(), object<MailIntegrationAdapter>())
		const pluginHost = new PluginHost(pluginManager, "nextcloud")

		o.check(pluginHost.mailEditor instanceof MailEditorHost).equals(true)
	})

	o.test("pluginManifest and window reflect the uninitialized sentinel before initialize() is called", () => {
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>())
		const pluginHost = new PluginHost(pluginManager, "nextcloud")

		o.check(pluginHost.pluginManifest).equals(null)
		o.check(pluginHost.window).equals(null)
	})

	o.test("initialize() sets pluginManifest and constructs a WindowHost", () => {
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>())
		const pluginHost = new PluginHost(pluginManager, "nextcloud")

		pluginHost.initialize(NEXTCLOUD_PLUGIN_MANIFEST)

		o.check(pluginHost.pluginManifest).equals(NEXTCLOUD_PLUGIN_MANIFEST)
		o.check(pluginHost.window instanceof WindowHost).equals(true)
	})
})
