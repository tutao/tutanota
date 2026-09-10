import * as fs from "node:fs/promises"
import { readdir, readFile } from "node:fs/promises"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import { PluginContext } from "./sdk/src/context.js"

export type PluginModule = {
	load(context: unknown): void | Promise<void>
	unload(): void | Promise<void>
}

type TutaoPlugin = {
	module: PluginModule
	metadata: PluginMetadata
}

export async function getPluginModules(): Promise<TutaoPlugin[]> {
	const packages = await getPackagePaths("../plugins")

	const plugins: TutaoPlugin[] = []
	for (const packageLocation of packages) {
		plugins.push(await createTutaoPlugin(packageLocation))
	}

	return plugins
}

async function createTutaoPlugin(packageLocation: string): Promise<TutaoPlugin> {
	const packageModule = await getPackage(packageLocation + "/package.json")
	const packageManifest = await getManifest(packageLocation + "/manifest.json")

	return {
		module: packageModule,
		metadata: packageManifest,
	}
}

async function getPackagePaths(root: string): Promise<string[]> {
	const packages: string[] = []
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
			} else if (entry.isFile() && entry.name === "package.json") {
				packages.push(dir)
			}
		}
	}

	return packages
}

async function getPackage(filePath: string): Promise<PluginModule> {
	const root = await fs.realpath(filePath)
	const content = await readFile(filePath, "utf-8")

	let packageJson: any

	try {
		packageJson = JSON.parse(content)
	} catch {
		throw new Error(`Invalid JSON in ${filePath}`)
	}

	if (packageJson.main !== undefined && typeof packageJson.main !== "string") {
		throw new Error("Invalid plugin main")
	}
	const entry = packageJson.main ?? "./index.js"
	const entryPath = path.resolve(root, entry)

	// Make sure it stays inside the plugin directory
	const relative = path.relative(root, entryPath)
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error("Plugin entry point escapes plugin directory")
	}
	// Resolve symlinks too
	const realEntryPath = await fs.realpath(entryPath)
	const realRelative = path.relative(root, realEntryPath)
	if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) {
		throw new Error("Plugin entry point escapes plugin directory")
	}

	const module = await import(pathToFileURL(realEntryPath).href)

	const plugin = module.default
	if (!plugin || typeof plugin !== "object") {
		throw new Error("Plugin must export a default object")
	}
	if (typeof plugin.load !== "function") {
		throw new Error("Plugin must provide load()")
	}
	if (typeof plugin.unload !== "function") {
		throw new Error("Plugin must provide unload()")
	}

	return plugin
}

async function getManifest(filePath: string): Promise<PluginMetadata> {
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

type PluginMetadata = {
	name: string
	description: string
	version: string
	pluginCapabilities: PluginCapabilities
}

enum PluginCapabilities {
	FilesystemAccess = "FilesystemAccess",
	MailDataAccess = "MailDataAccess",
	None = "None",
}
