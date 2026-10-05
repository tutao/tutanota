import o from "@tutao/otest"
import { object } from "testdouble"
import { ConfigHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/ConfigHost"
import { UiHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/UiHost"
import { PluginManager } from "../../../../../src/plugin-kit/plugin-manager/PluginManager"
import { DialogAdapter } from "../../../../../src/plugin-kit/sdk/PluginApi"
import { PluginManifest } from "../../../../../src/plugin-kit/sdk/PluginManifest"
import { ConfigurationAdapter, PluginHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/PluginHost"
import { MailEditorHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/MailEditorHost"
import { PLUGIN_REGISTRY } from "../../../../../src/plugin-kit/plugin-manager/PluginRegistry"
import { WindowHost } from "../../../../../src/plugin-kit/plugin-manager/hostApi/WindowHost"
import { MailPluginIntegrationAdapter } from "../../../../../src/applications/mail-app/plugin/MailPluginIntegrationAdapter"

o.spec("PluginHostTest", () => {
	const NEXTCLOUD_PLUGIN_MANIFEST: PluginManifest = PLUGIN_REGISTRY["nextcloud"]

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
		const pluginManager = new PluginManager(object<ConfigurationAdapter>(), object<DialogAdapter>(), object<MailPluginIntegrationAdapter>())
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

		pluginHost.initialize(NEXTCLOUD_PLUGIN_MANIFEST as PluginManifest)

		o.check(pluginHost.pluginManifest).equals(NEXTCLOUD_PLUGIN_MANIFEST as PluginManifest)
		o.check(pluginHost.window instanceof WindowHost).equals(true)
	})
})
