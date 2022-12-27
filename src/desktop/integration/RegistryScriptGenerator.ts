/*
 * This file helps keep registry operations for application and removal in sync by generating
 * an application registry script and a removal script from the same template.
 *
 * Windows Registry Scripts look like this:
 *   ```
 *   Windows Registry Editor Version 5.00
 *
 *   [HKCU\SOFTWARE\CLIENTS\MAIL]
 *   @="default_value"
 *
 *   [-HKLM\SOFTWARE\CLIENTS\MAIL\Mozilla Thunderbird]
 *
 *   [HKCU\SOFTWARE\CLIENTS\MAIL\Section]
 *   @="default_value"
 *   "name"="named_value"
 *   "value_to_delete"=-
 *
 *   [HKCU\SOFTWARE\CLIENTS\MAIL\Section2]
 *   @=-
 *   ```
 *
 * * there is a header line followed by a list of sections
 * * each section starts with a path in square brackets []. if the path is prefixed with a dash (-),
 *   that path and all its subkeys will be removed.
 * * sections can contain
 *     * default value assignments of the form @="VALUE"
 *     * default value nullifications of the form @=-
 *     * named value assignments of the form "NAME"="VALUE"
 *     * named value deletions of the form "NAME"=-
 *
 * The script generator uses JavaScript arrays of RegistryValueTemplates as templates.
 * During application, RegistryValueTemplates will recursively written to the registry at their respective root path.
 * The removal script preserves the root keys. this means that subkeys that were created in a root key will be recursively deleted,
 * but string values that are assigned directly to a root key or a name in that subkey will only be nulled. Example:
 *
 * To generate this application script:
 * ```
 * Windows Registry Editor Version 5.00
 * [HKLM\SOFTWARE\CLIENTS\MAIL]
 * "named"="val"
 * @="default_value_1"
 *
 * [HKLM\SOFTWARE\CLIENTS\MAIL\subkey]
 * @="default_value_2"
 * "DLLPath"="C:\dll\path\t.dll"
 * ```
 *
 * and this removal script
 *
 * ```
 * Windows Registry Editor Version 5.00
 *
 * [HKLM\SOFTWARE\CLIENTS\MAIL]
 * "named"=-
 * @=-
 *
 * [-HKLM\SOFTWARE\CLIENTS\MAIL\subkey]
 * ```
 *
 * We would use this template. Note the values with empty keys which get expanded to @=<value> assignments.
 *
 * ```
 * const template = [{
 * 			root: "HKLM\\SOFTWARE\\CLIENTS\\MAIL",
 *			value: {"named": "val", subkey: {"": "default_value_2", "DLLPath": "C:\\dll\\path\\t.dll",}, "": "default_value_1"}
 * }]
 * ```
 *
 * Also note that "HKLM\SOFTWARE\CLIENTS\MAIL\subkey" was removed entirely while the values
 * directly assigned to "HKLM\SOFTWARE\CLIENTS\MAIL" are only nulled, because that path was given as a root.
 *
 *  Current Limitations:
 *  * only string values are supported
 *  * application can only write, removal will only remove
 *  */
export type RegistryTemplateDefinition = ReadonlyArray<RegistryValueTemplate>
export type RegistryValueTemplate = {
	value: RegistrySubKey
	root: string
}
export type RegistrySubKey = { [key: string]: RegistryValue }
export type RegistryValue = RegistrySubKey | string
type OperationBuffer = Record<string, Array<string>>
const header_line = "Windows Registry Editor Version 5.00"

function quote(s: string): string {
	return `"${s}"`
}

function keyLine(path: string): string {
	return `[${path}]`
}

function valueLine(path: string, value: string | null): string {
	return `${path === "" ? "@" : quote(path)}=${value == null ? "-" : quote(value)}`
}

/**
 * value expander for the script generators. if a value is not a string, it's another section
 * that gets expanded recursively.
 *
 * remove is used to create value/key removal lines
 */
function expandValue(path: string, key: string, value: RegistryValue, buf: OperationBuffer, remove?: boolean): OperationBuffer {
	if (typeof value === "string") {
		buf[path].push(valueLine(key, remove ? null : value))
	} else {
		buf = expandSection(`${path}\\${key}`, value, buf, remove)
	}

	return buf
}

/**
 * section expander for the script generator
 */
function expandSection(path: string, value: RegistrySubKey, buf: OperationBuffer, remove?: boolean): OperationBuffer {
	if (buf[path] == null) buf[path] = []

	for (const key in value) {
		if (typeof value[key] !== "string" && remove) {
			buf[`-${path}\\${key}`] = []
		} else {
			expandValue(path, key, value[key], buf, remove)
		}
	}

	return buf
}

/**
 * converts a map of registry paths to value setters into an executable registry script
 * @param {OperationBuffer} buf List of operations the need to be done
 * @returns {string} a windows registry script that can be imported by regex.exe to apply the operations
 */
function bufToScript(buf: OperationBuffer): string {
	const lines = [header_line]

	for (const key in buf) {
		const next = buf[key]
		if (next.length < 1 && !key.startsWith("-")) continue
		lines.push("", keyLine(key))
		lines.push(...next)
	}

	return lines.join("\r\n").trim()
}

/**
 * the application and removal script generators are very similar in structure, this function abstracts over that.
 */
function scriptBuilder(remove: boolean, template: RegistryTemplateDefinition): string {
	const buf = template.reduce((prev, { root, value }) => expandSection(root, value, prev, remove), {})
	return bufToScript(buf)
}

/**
 * create a windows registry script that can be executed to apply the given template
 */
export function applyScriptBuilder(template: RegistryTemplateDefinition): string {
	return scriptBuilder(false, template)
}

/**
 * create a windows registry script that can be executed to remove the values that have been
 * created by executing the script generated from the template by applyScriptBuilder
 */
export function removeScriptBuilder(template: RegistryTemplateDefinition): string {
	return scriptBuilder(true, template)
}
