import o, { assertThrows } from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { PluginManager } from "../../../../src/plugin-kit/plugin-manager/PluginManager"
import { ConfigurationAdapter, PluginConfigurationOwner, PluginHost } from "../../../../src/plugin-kit/plugin-manager/hostApi/PluginHost"
import { DialogAdapter, PluginApi } from "../../../../src/plugin-kit/sdk/PluginApi"
import { AttachmentButtonExtension } from "../../../../src/plugin-kit/sdk/AttachmentButtonExtensionPoint"
import { EventLocationButtonExtension } from "../../../../src/plugin-kit/sdk/EventLocationButtonExtensionPoint"
import { ExtensionPoint } from "../../../../src/plugin-kit/sdk/hostApi/PluginHostApi"
import { CustomerConfigPluginError } from "../../../../src/plugin-kit/sdk/PluginError"
import { withOverriddenEnv } from "../../TestUtils"
import { Mode } from "../../../../src/platform-kit/app-env"
import { OperationType } from "../../../../src/platform-kit/meta"
import { stringToBase64UrlCustomId } from "../../../../src/platform-kit/utils/Encoding"
import { CachingStatus, EntityUpdateData } from "../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { PluginConfiguration, PluginConfigurationTypeRef } from "@tutao/entities/sys"

o.spec("PluginManagerTest", () => {
	let configurationAdapter: ConfigurationAdapter
	let dialogAdapter: DialogAdapter
	let pluginManager: PluginManager

	o.beforeEach(() => {
		configurationAdapter = object<ConfigurationAdapter>()
		dialogAdapter = object<DialogAdapter>()
		pluginManager = new PluginManager(configurationAdapter, dialogAdapter)
	})

	function seedLoadedPlugin(overrides: { api?: any; pluginAsWorker?: any; draftConfig?: Record<string, string> } = {}) {
		const wrapper = {
			pluginId: "nextcloud" as const,
			api: overrides.api ?? object<PluginApi & AttachmentButtonExtension & EventLocationButtonExtension>(),
			pluginHost: object<PluginHost>(),
			pluginAsWorker: overrides.pluginAsWorker ?? { terminate: func() },
			draftConfig: overrides.draftConfig ?? {},
		}
		;(pluginManager as any).loadedPlugins["nextcloud"] = wrapper
		return wrapper
	}

	o.spec("loadPlugins", () => {
		o.test("early-returns without touching the configuration adapter when running as the admin client", async () => {
			await withOverriddenEnv({ mode: Mode.Admin }, () => pluginManager.loadPlugins("nextcloud"))

			verify(configurationAdapter.getCustomerConfig(matchers.anything()), { times: 0 })
			o.check(pluginManager.pluginIsLoaded("nextcloud")).equals(false)
		})

		o.test("throws when the plugin is already loaded", async () => {
			seedLoadedPlugin()

			const err = await assertThrows(Error, () => pluginManager.loadPlugins("nextcloud"))
			o.check(err.message).equals("Could not load plugin: nextcloud as it is already loaded. Call unload() first")
		})
	})

	o.spec("pluginIsLoaded / getLoadedPlugin", () => {
		o.test("pluginIsLoaded is false before loading and true after seeding", () => {
			o.check(pluginManager.pluginIsLoaded("nextcloud")).equals(false)
			const wrapper = seedLoadedPlugin()
			o.check(pluginManager.pluginIsLoaded("nextcloud")).equals(true)
			o.check(pluginManager.getLoadedPlugin("nextcloud")).equals(wrapper)
		})

		o.test("getLoadedPlugin throws when the plugin is not loaded", async () => {
			const err = await assertThrows(Error, async () => pluginManager.getLoadedPlugin("nextcloud"))
			o.check(err.message).equals("AssertNotNull failed: Plugin nextcloud is not yet loaded!")
		})
	})

	o.spec("unloadPlugin", () => {
		o.test("throws when the plugin is not loaded", async () => {
			const err = await assertThrows(Error, () => pluginManager.unloadPlugin("nextcloud"))
			o.check(err.message).equals("Plugin nextcloud is not yet loaded. Call .load() first")
		})

		o.test("unloads a loaded plugin and purges only its registrations", async () => {
			const wrapper = seedLoadedPlugin()
			const btnNextcloud = { extensionPoint: ExtensionPoint.SaveAttachmentDialog, text: { en: "NC" } }
			const btnOther = { extensionPoint: ExtensionPoint.SaveAttachmentDialog, text: { en: "Other" } }
			pluginManager.registerButton("nextcloud", btnNextcloud)
			pluginManager.registerButton("otherplugin" as any, btnOther)
			const fieldNextcloud = { extensionPoint: ExtensionPoint.ConfigField as const, configFieldId: "a", text: { en: "A" }, defaultValue: "" }
			pluginManager.registerConfigField("nextcloud", fieldNextcloud)

			await pluginManager.unloadPlugin("nextcloud")

			verify(wrapper.api.unload())
			verify(wrapper.pluginAsWorker.terminate())
			o.check(pluginManager.pluginIsLoaded("nextcloud")).equals(false)
			o.check(pluginManager.getRegisteredConfigFieldsByPluginId("nextcloud")).deepEquals([])
			o.check(pluginManager.getRegisteredButtonsByExtensionPoint(ExtensionPoint.SaveAttachmentDialog)).deepEquals([
				{ config: btnOther, pluginId: "otherplugin" as any },
			])
		})
	})

	o.spec("setConfigField / getConfigFieldValue / persistCustomerConfig", () => {
		o.test("round-trips a value through the seeded draft config", () => {
			seedLoadedPlugin({ draftConfig: {} })

			pluginManager.setConfigField("nextcloud", "foo", "bar")

			o.check(pluginManager.getConfigFieldValue("nextcloud", "foo")).equals("bar")
		})

		o.test("getConfigFieldValue does not throw for a missing field", async () => {
			seedLoadedPlugin({ draftConfig: {} })

			const missingField = pluginManager.getConfigFieldValue("nextcloud", "missing")
			o.check(missingField).equals(null)
		})

		o.test("persistCustomerConfig serializes the draft config via the configuration adapter", async () => {
			seedLoadedPlugin({ draftConfig: { a: "1" } })
			when(configurationAdapter.storeCustomerConfig("nextcloud", JSON.stringify({ a: "1" }))).thenResolve(true)

			const result = await pluginManager.persistCustomerConfig("nextcloud")

			o.check(result).equals(true)
		})
	})

	o.spec("attachmentButtonClicked / eventLocationButtonClicked", () => {
		o.test("attachmentButtonClicked delegates to the loaded plugin's api with the resolved data file", async () => {
			const wrapper = seedLoadedPlugin()
			const dataFile = { name: "f.pdf", mimeType: "application/pdf", data: new Uint8Array([1]), size: 1 }

			await pluginManager.attachmentButtonClicked("nextcloud", Promise.resolve(dataFile))

			verify(wrapper.api.attachmentButtonClicked(dataFile))
		})

		o.test("eventLocationButtonClicked delegates to the loaded plugin's api and returns its result", async () => {
			const wrapper = seedLoadedPlugin()
			when(wrapper.api.eventLocationButtonClicked("Room 1")).thenResolve("https://join")

			const result = await pluginManager.eventLocationButtonClicked("nextcloud", "Room 1")

			o.check(result).equals("https://join")
		})
	})

	o.spec("entityUpdatesListener", () => {
		function makeUpdate(operation: OperationType): EntityUpdateData<PluginConfiguration> {
			return {
				typeRef: PluginConfigurationTypeRef,
				instanceListId: "listId",
				instanceId: stringToBase64UrlCustomId("nextcloud"),
				operation,
				instance: null,
				blobInstance: null,
				patches: null,
				cachingStatus: CachingStatus.CacheNotUpdated,
			}
		}

		o.test("CREATE + Customer owner + not loaded calls loadPlugins and fires the config change listener", async () => {
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)
			const stubbedLoadPlugins = func<(pluginId: string) => void>()
			;(pluginManager as any).loadPlugins = stubbedLoadPlugins
			const configChangeListener = func<() => void>()
			pluginManager.setConfigChangeListener(configChangeListener)

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.CREATE)], "ownerGroupId", false)

			verify(stubbedLoadPlugins("nextcloud"))
			verify(configChangeListener())
		})

		o.test("CREATE + Customer owner + already loaded falls through to the update branch instead", async () => {
			const wrapper = seedLoadedPlugin()
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)
			when(wrapper.api.onCustomerConfigChange()).thenResolve(undefined)
			const stubbedLoadPlugins = func<(pluginId: string) => void>()
			;(pluginManager as any).loadPlugins = stubbedLoadPlugins

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.CREATE)], "ownerGroupId", false)

			verify(wrapper.api.onCustomerConfigChange())
			verify(stubbedLoadPlugins(matchers.anything()), { times: 0 })
		})

		o.test("DELETE unloads the plugin", async () => {
			const wrapper = seedLoadedPlugin()
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.DELETE)], "ownerGroupId", false)

			verify(wrapper.api.unload())
			verify(wrapper.pluginAsWorker.terminate())
			o.check(pluginManager.pluginIsLoaded("nextcloud")).equals(false)
		})

		o.test("an update-shaped operation for a plugin that is not loaded throws", async () => {
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)

			const err = await assertThrows(Error, () =>
				pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.UPDATE)], "ownerGroupId", false),
			)
			o.check(err.message).equals("AssertNotNull failed: Got updated config for plugin nextcloud. But the plugin is not yet loaded")
		})

		o.test("update-shaped, loaded, Customer owner calls onCustomerConfigChange and fires the listener", async () => {
			const wrapper = seedLoadedPlugin()
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)
			when(wrapper.api.onCustomerConfigChange()).thenResolve(undefined)
			const configChangeListener = func<() => void>()
			pluginManager.setConfigChangeListener(configChangeListener)

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.UPDATE)], "ownerGroupId", false)

			verify(wrapper.api.onCustomerConfigChange())
			verify(configChangeListener())
		})

		o.test("update-shaped, loaded, Customer owner, rejection is caught and shown via the dialog adapter without throwing", async () => {
			const wrapper = seedLoadedPlugin()
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.Customer)
			when(wrapper.api.onCustomerConfigChange()).thenReject(new CustomerConfigPluginError("bad url"))
			const configChangeListener = func<() => void>()
			pluginManager.setConfigChangeListener(configChangeListener)

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.UPDATE)], "ownerGroupId", false)

			verify(dialogAdapter.showDialog("Error while updating config: bad url"))
			verify(configChangeListener())
		})

		o.test("update-shaped, loaded, User owner calls onUserConfigChange", async () => {
			const wrapper = seedLoadedPlugin()
			when(configurationAdapter.getConfigOwner("listId")).thenReturn(PluginConfigurationOwner.User)
			when(wrapper.api.onUserConfigChange()).thenResolve(undefined)

			await pluginManager.entityUpdatesListener.onEntityUpdatesReceived([makeUpdate(OperationType.UPDATE)], "ownerGroupId", false)

			verify(wrapper.api.onUserConfigChange())
		})
	})
})
