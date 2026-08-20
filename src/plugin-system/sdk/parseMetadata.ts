import { readdir, readFile } from "node:fs/promises"
import * as path from "node:path"
import { PluginCapabilities, PluginMetadata } from "../IWorkerApi"

export async function parseMetadata() {
	const manifestLocations = await findManifests("../plugins")

	const manifests: PluginMetadata[] = []
	for (const manifestLocation of manifestLocations) {
		manifests.push(await parsePluginMetadata(manifestLocation))
	}
}

async function findManifests(root: string): Promise<string[]> {
	const manifests: string[] = []
	const directories: string[] = [root]

	while (directories.length > 0) {
		const dir = directories.pop()!

		const entries = await readdir(dir, {
			withFileTypes: true,
		})

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				directories.push(fullPath)
			} else if (entry.isFile() && entry.name === "manifest.json") {
				manifests.push(fullPath)
			}
		}
	}

	return manifests
}

export async function parsePluginMetadata(filePath: string): Promise<PluginMetadata> {
	const content = await readFile(filePath, "utf-8")

	let data: unknown

	try {
		data = JSON.parse(content)
	} catch {
		throw new Error(`Invalid JSON in ${filePath}`)
	}

	if (!isRecord(data)) {
		throw new Error("Plugin metadata must be an object")
	}
	if (!isNonEmptyString(data.name)) {
		throw new Error("Plugin metadata 'name' must be a non-empty string")
	}
	if (!isNonEmptyString(data.description)) {
		throw new Error("Plugin metadata 'description' must be a non-empty string")
	}
	if (!isNonEmptyString(data.version)) {
		throw new Error("Plugin metadata 'version' must be a non-empty string")
	}
	if (!isPluginCapability(data.pluginCapabilities)) {
		throw new Error(`Invalid plugin capability: ${String(data.pluginCapabilities)}`)
	}

	return {
		name: data.name,
		description: data.description,
		version: data.version,
		pluginCapabilities: data.pluginCapabilities,
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0
}

function isPluginCapability(value: unknown): value is PluginCapabilities {
	return Object.values(PluginCapabilities).includes(value as PluginCapabilities)
}

// TODO() use to discover and register/ load plugins
