import { isTest } from "../../api/common/Env"
import { CommandExecutor } from "../CommandExecutor"

// In tests, we don't use a real CommandExecutor, so it's safe to instantiate there.
//
// But otherwise, we definitely do not want to create a WindowsRegistryFacade on
// non-Windows.
if (!isTest() && process.platform !== "win32") {
	throw new Error(`Cannot load WindowsRegistryFacade from ${process.platform}`)
}

/**
 * Registry hive to use
 */
export enum RegistryHive {
	HKEY_CURRENT_USER = "HKEY_CURRENT_USER",
}

// NOT EXHAUSTIVE; add as needed
enum RegistryValueType {
	/**
	 * String (internally null-terminated in the registry)
	 */
	String = "REG_SZ",

	/**
	 * Unsigned 32-bit integer
	 */
	DWORD = "REG_DWORD",
}

/**
 * Interface that handles querying the Windows registry.
 */
export class WindowsRegistryFacade {
	constructor(private readonly childProcess: CommandExecutor) {}

	/**
	 * Create a handle for querying a registry key.
	 *
	 * Note that this function does not interact with the registry.
	 *
	 * @param registryHive Hive the key is located in
	 * @param path Path to the registry key (note: must start with a backslash)
	 */
	entry(registryHive: RegistryHive, path: string): WindowsRegistryKey {
		if (!path.startsWith("\\")) {
			throw new Error(`invalid registry path ${path} - must start with backslash`)
		}

		return new WindowsRegistryKey(this.childProcess, registryHive, path)
	}
}

export type WindowsRegistryValueType = string | number

/**
 * High level interface for interacting with a given registry key
 *
 * This can (and should) be instantiated with {@link WindowsRegistryFacade#entry} rather than constructed directly.
 */
export class WindowsRegistryKey {
	constructor(
		private readonly childProcess: CommandExecutor,
		private readonly registryHive: RegistryHive,
		private readonly path: string,
	) {}

	/**
	 * Get all values in the registry key
	 * @return a map of all values, or null if nothing
	 */
	async enumerate(): Promise<Map<string, WindowsRegistryValueType> | null> {
		const fullPath = `${this.registryHive}${this.path}`
		const result = await this.query([fullPath])
		return result != null ? parseResult(result) : null
	}

	/**
	 * Get the given value from the registry key
	 * @param name value to get
	 * @return the value, or null if nothing
	 */
	async get(name: string): Promise<WindowsRegistryValueType | null> {
		const fullPath = `${this.registryHive}${this.path}`
		const result = await this.query([fullPath, "/v", name])
		if (result == null) {
			return null
		}
		return parseResult(result).get(name) ?? null
	}

	private async query(params: string[]): Promise<string | null> {
		const output = await this.childProcess.run({
			executable: "reg",
			args: ["QUERY", ...params],
		})
		if (output.exitCode !== 0) {
			return null
		} else {
			return output.stdout
		}
	}

	/**
	 * Set the value
	 * @param name name of the value to add
	 * @param value value to set
	 */
	async set(name: string, value: WindowsRegistryValueType): Promise<void> {
		const fullPath = `${this.registryHive}${this.path}`
		let type
		if (typeof value === "number") {
			type = RegistryValueType.DWORD
		} else {
			type = RegistryValueType.String
		}
		const result = await this.childProcess.run({
			executable: "reg",
			args: ["ADD", fullPath, "/v", name, "/t", type, "/d", String(value), "/f"],
		})
		if (result.exitCode !== 0) {
			throw new Error(`Failed to write to the registry: got exit code ${result.exitCode}, stderr=${result.stderr}`)
		}
	}

	/**
	 * Remove the given value from the registry key
	 * @param name name of the value
	 * @return true if removed successfully, false if no value was removed (likely because it wasn't there)
	 */
	async remove(name: string): Promise<boolean> {
		const fullPath = `${this.registryHive}${this.path}`
		const result = await this.childProcess.run({
			executable: "reg",
			args: ["DELETE", fullPath, "/v", name, "/f"],
		})
		return result.exitCode === 0
	}
}

function parseResult(stdout: string): Map<string, WindowsRegistryValueType> {
	// The "correct" way to do this would be to use win32 directly instead
	// of calling command-line REG.
	//
	// However, REG should be fine enough for our use case, as we don't
	// really need to deal with anything more than just basic strings and
	// maybe numbers.
	const lines: string[][] = stdout
		// convert CRLF to LF
		.replaceAll("\r\n", "\n")
		// split by line
		.split("\n")
		// split by four spaces since that is what REG QUERY outputs
		.map((s) => s.trimStart().split("    "))
		// ignore any empty lines or the line that contains the input
		.filter((l) => l.length > 1)
		// normalize the result
		.map((s) => {
			if (s.length > 3) {
				// in case the value had four spaces in it
				return [s[0], s[1], ...s.slice(2).join("    ")]
			} else {
				// otherwise, just return as-is
				return s
			}
		})

	// Actually map now
	let map = new Map()
	for (const line of lines) {
		const key = line[0]
		const value = line[2]
		const type = line[1]

		switch (type) {
			case RegistryValueType.DWORD:
				map.set(key, parseInt(value))
				break
			case RegistryValueType.String:
				map.set(key, value)
				break
			default:
				map.set(key, value)
				break
		}
	}

	return map
}
