import { PluginId } from "../sdk/PluginId"
import { PluginManifest } from "../sdk/PluginManifest"
import { NEXTCLOUD_PLUGIN_MANIFEST } from "./nextcloud/manifest"

export type PluginRegistryEntry = Pick<PluginManifest, "id" | "name" | "description" | "logoSvgUrl">

/**
 * Static, synchronous manifest of plugins that can be enabled/configured from the admin Plugins settings page.
 * Kept independent of PluginManager/dynamic import() - the Settings page must list plugins that are
 * *available to enable*, including disabled ones, without pulling in plugin runtime bundles just to
 * render a name/description/logo.
 */
export const PLUGIN_REGISTRY: Readonly<Record<PluginId, PluginManifest>> = Object.freeze({
	nextcloud: NEXTCLOUD_PLUGIN_MANIFEST,
})
