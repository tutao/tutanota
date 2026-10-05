import o, { assertThrows } from "@tutao/otest"
import { func, matchers, object, verify, when } from "testdouble"
import { NextcloudPlugin } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudPlugin"
import { NextcloudApi } from "../../../../../src/plugin-kit/plugins/nextcloud/NextcloudApi"
import { ExtensionPoint, PluginHostApi } from "../../../../../src/plugin-kit/sdk/hostApi/PluginHostApi"
import { CustomerConfigPluginError } from "../../../../../src/plugin-kit/sdk/PluginError"
import { PluginDataFile } from "../../../../../src/plugin-kit/sdk/PluginDataFile"
import { PluginFileReference } from "../../../../../src/plugin-kit/sdk/FileImportExtensionPoint"
import { PLUGIN_REGISTRY } from "../../../../../src/plugin-kit/plugin-manager/PluginRegistry"
import { PluginManifest } from "../../../../../src/plugin-kit/sdk/PluginManifest"

o.spec("NextcloudPluginTest", () => {
	let pluginHost: PluginHostApi
	let plugin: NextcloudPlugin
	const NEXTCLOUD_PLUGIN_MANIFEST: PluginManifest = PLUGIN_REGISTRY["nextcloud"]

	o.beforeEach(() => {
		pluginHost = object<PluginHostApi>()
		plugin = new NextcloudPlugin(pluginHost)
		//@ts-ignore
		plugin.manifest = NEXTCLOUD_PLUGIN_MANIFEST
	})

	o.spec("load", () => {
		o.test("registers the two config fields and the two buttons", async () => {
			when(pluginHost.getCustomerConfig()).thenResolve(null)
			when(pluginHost.getUserConfig()).thenResolve(null)

			await plugin.load(NEXTCLOUD_PLUGIN_MANIFEST)

			verify(
				pluginHost.registerConfigFields([
					{
						extensionPoint: ExtensionPoint.ConfigField,
						configFieldId: "nextCloudUrl",
						text: { en: "Nextcloud instance URL", de: "URL der Nextcloud Instanz" },
						defaultValue: "",
					},
					{
						configFieldId: "targetAttachmentFolder",
						extensionPoint: ExtensionPoint.ConfigField,
						text: { en: "Folder name for attachments", de: "Ordnername für Anhänge" },
						defaultValue: "TutaAttachments",
					},
				]),
			)
			verify(
				pluginHost.registerButton({
					extensionPoint: ExtensionPoint.SaveAttachmentDialog,
					text: { en: "Save to Nextcloud", de: "In Nextcloud speichern" },
				}),
			)
			verify(
				pluginHost.registerButton({
					extensionPoint: ExtensionPoint.EventLocationButton,
					text: { en: "Generate Nextcloud Talk meeting", de: "Nextcloud Talk Meeting anlegen" },
				}),
			)
		})

		o.test("skips nextcloud api initialization when there is no customer config", async () => {
			when(pluginHost.getCustomerConfig()).thenResolve(null)
			when(pluginHost.getUserConfig()).thenResolve(null)

			await plugin.load(NEXTCLOUD_PLUGIN_MANIFEST)

			verify(pluginHost.getHost(), { times: 0 })
		})

		o.test("initializes the nextcloud api when a customer config is present", async () => {
			when(pluginHost.getCustomerConfig()).thenResolve(JSON.stringify({ nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "Att" }))
			when(pluginHost.getUserConfig()).thenResolve(null)
			when(pluginHost.getHost()).thenResolve("app.tuta.com")

			await plugin.load(NEXTCLOUD_PLUGIN_MANIFEST)

			verify(pluginHost.getHost())
			o.check((plugin as any).nextcloudApi instanceof NextcloudApi).equals(true)
		})
	})

	o.spec("credentialsUpdated", () => {
		o.test("stores the updated credentials in the user config", async () => {
			;(plugin as any).userConfig = { credentials: null }
			const creds = { appPassword: "p", loginName: "l", server: "s" }

			await plugin.credentialsUpdated(creds)

			o.check((plugin as any).userConfig.credentials).deepEquals(creds)
			verify(pluginHost.storeUserConfig(JSON.stringify({ credentials: creds })))
		})
	})

	o.spec("attachmentButtonClicked", () => {
		o.test("uploads the file and opens the resulting url", async () => {
			;(plugin as any).customerConfig = { nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "Att" }
			const dataFile: PluginDataFile = { name: "f.pdf", mimeType: "application/pdf", data: new Uint8Array([1]), size: 1 }
			const fakeNextcloudApi = { uploadFile: func() }
			when(fakeNextcloudApi.uploadFile(dataFile, "Att")).thenResolve({ filesUiUrl: "https://nc.example.com/files" })
			;(plugin as any).nextcloudApi = fakeNextcloudApi

			await plugin.attachmentButtonClicked(dataFile)

			verify(pluginHost.openWindow("https://nc.example.com/files"))
		})
	})

	o.spec("receiveFileReference", () => {
		o.test("downloads the file and opens the mail editor with it", async () => {
			const fileReference: PluginFileReference = { path: "/Docs/f.pdf" }
			const downloadedFile: PluginDataFile = { name: "f.pdf", mimeType: "application/pdf", data: new Uint8Array([1]), size: 1 }
			const fakeNextcloudApi = { downloadFile: func() }
			when(fakeNextcloudApi.downloadFile(fileReference)).thenResolve(downloadedFile)
			;(plugin as any).nextcloudApi = fakeNextcloudApi

			await plugin.receiveFileReference(fileReference)

			verify(pluginHost.openMailEditor(downloadedFile))
		})
	})

	o.spec("eventLocationButtonClicked", () => {
		o.test("returns the joinUrl created by the nextcloud api", async () => {
			const fakeNextcloudApi = { createTalkRoom: func() }
			when(fakeNextcloudApi.createTalkRoom("Room 1")).thenResolve({ joinUrl: "https://nc.example.com/call/1" })
			;(plugin as any).nextcloudApi = fakeNextcloudApi

			const result = await plugin.eventLocationButtonClicked("Room 1")

			o.check(result).equals("https://nc.example.com/call/1")
		})
	})

	o.spec("onCustomerConfigChange", () => {
		o.test("updates the url on the existing nextcloud api without re-initializing", async () => {
			const fakeNextcloudApi = { setNextcloudUrl: func() }
			;(plugin as any).nextcloudApi = fakeNextcloudApi
			when(pluginHost.getCustomerConfig()).thenResolve(JSON.stringify({ nextCloudUrl: "https://new.example.com", targetAttachmentFolder: "Att" }))

			await plugin.onCustomerConfigChange()

			verify(fakeNextcloudApi.setNextcloudUrl("https://new.example.com"))
			verify(pluginHost.getHost(), { times: 0 })
		})

		o.test("initializes the nextcloud api when it was not set up yet", async () => {
			;(plugin as any).nextcloudApi = null
			when(pluginHost.getCustomerConfig()).thenResolve(JSON.stringify({ nextCloudUrl: "https://new.example.com", targetAttachmentFolder: "Att" }))
			when(pluginHost.getHost()).thenResolve("app.tuta.com")

			await plugin.onCustomerConfigChange()

			o.check((plugin as any).nextcloudApi instanceof NextcloudApi).equals(true)
		})
	})

	o.spec("verifyCustomerConfiguration", () => {
		const originalGetInstalledVersion = NextcloudApi.getInstalledVersion

		o.afterEach(() => {
			;(NextcloudApi as any).getInstalledVersion = originalGetInstalledVersion
		})

		function stubInstalledVersion(major: number) {
			;(NextcloudApi as any).getInstalledVersion = async () => ({ major, minor: 0, patch: 0 })
		}

		o.test("throws when the installed nextcloud plugin is newer than what this manifest supports", async () => {
			stubInstalledVersion(NEXTCLOUD_PLUGIN_MANIFEST.version.major + 1)

			const err = await assertThrows(CustomerConfigPluginError, () =>
				plugin.verifyCustomerConfiguration(JSON.stringify({ nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "Att" })),
			)
			o.check(err.message).equals(
				`Tuta plugin installed in Nextcloud is too old. Try updating tuta app in nexcloud to version: ${NEXTCLOUD_PLUGIN_MANIFEST.version.major}`,
			)
		})

		o.test("throws when the url has a trailing slash", async () => {
			stubInstalledVersion(NEXTCLOUD_PLUGIN_MANIFEST.version.major)

			const err = await assertThrows(CustomerConfigPluginError, () =>
				plugin.verifyCustomerConfiguration(JSON.stringify({ nextCloudUrl: "https://nc.example.com/", targetAttachmentFolder: "Att" })),
			)
			o.check(err.message).equals("URL should not end in a trailing slash.")
		})

		o.test("throws when the target attachment folder is empty", async () => {
			stubInstalledVersion(NEXTCLOUD_PLUGIN_MANIFEST.version.major)

			const err = await assertThrows(CustomerConfigPluginError, () =>
				plugin.verifyCustomerConfiguration(JSON.stringify({ nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "" })),
			)
			o.check(err.message).equals("Need a non-empty folder name")
		})

		o.test("throws when the target attachment folder is whitespace-only", async () => {
			stubInstalledVersion(NEXTCLOUD_PLUGIN_MANIFEST.version.major)

			const err = await assertThrows(CustomerConfigPluginError, () =>
				plugin.verifyCustomerConfiguration(JSON.stringify({ nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "   " })),
			)
			o.check(err.message).equals("Need a non-empty folder name")
		})

		o.test("resolves without throwing for a valid configuration", async () => {
			stubInstalledVersion(NEXTCLOUD_PLUGIN_MANIFEST.version.major)

			await plugin.verifyCustomerConfiguration(JSON.stringify({ nextCloudUrl: "https://nc.example.com", targetAttachmentFolder: "Att" }))
		})
	})

	o.spec("onUserConfigChange", () => {
		o.test("sets credentials on the nextcloud api when credentials are present", async () => {
			const creds = { appPassword: "p", loginName: "l", server: "s" }
			const fakeNextcloudApi = { setNextcloudCredentials: func() }
			;(plugin as any).nextcloudApi = fakeNextcloudApi
			when(pluginHost.getUserConfig()).thenResolve(JSON.stringify({ credentials: creds }))

			await plugin.onUserConfigChange()

			verify(fakeNextcloudApi.setNextcloudCredentials(creds))
		})

		o.test("does not touch the nextcloud api when credentials are absent", async () => {
			const fakeNextcloudApi = { setNextcloudCredentials: func() }
			;(plugin as any).nextcloudApi = fakeNextcloudApi
			when(pluginHost.getUserConfig()).thenResolve(JSON.stringify({ credentials: null }))

			await plugin.onUserConfigChange()

			verify(fakeNextcloudApi.setNextcloudCredentials(matchers.anything()), { times: 0 })
		})
	})
})
