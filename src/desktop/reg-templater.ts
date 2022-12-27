import type { RegistryTemplateDefinition } from "./integration/RegistryScriptGenerator"
import { applyScriptBuilder, removeScriptBuilder } from "./integration/RegistryScriptGenerator"

export enum RegistryRoot {
	/** Global (per-device) registry keys */
	LOCAL_MACHINE = "HKEY_LOCAL_MACHINE",
	/** Per-user registry keys */
	CURRENT_USER = "HKEY_CURRENT_USER",
}

/**
 * > The HKEY_CLASSES_ROOT (HKCR) key contains file name extension associations and COM class registration information such as ProgIDs, CLSIDs, and IIDs.
 * > It is primarily intended for compatibility with the registry in 16-bit Windows.
 *
 * see https://docs.microsoft.com/en-us/windows/win32/sysinfo/hkey-classes-root-key
 */
const HKCR = "HKEY_CLASSES_ROOT"

/**
 * execPath: path for the dll to this executable
 * dllPath: path for other apps to the dll
 * logPath: path for the dll to log mapi activity to
 * tmpPath: path for the dll to put temporary attachment files
 */
export type RegistryPaths = {
	execPath: string
	dllPath: string
	logPath: string
	tmpPath: string
}

/**
 * get a registry template specific to tutanota desktop
 * https://docs.microsoft.com/en-us/windows/win32/msi/installation-context#registry-redirection
 */
function getTemplate(opts: RegistryPaths, registryRoot: RegistryRoot): RegistryTemplateDefinition {
	const { execPath, dllPath, logPath, tmpPath } = opts
	const client_template = {
		tutanota: {
			"": "tutanota",
			DLLPath: dllPath,
			EXEPath: execPath,
			LOGPath: logPath,
			TMPPath: tmpPath,
		},
		"": "tutanota",
	}
	const mailto_template = {
		"": "URL:MailTo Protocol",
		"URL Protocol": "",
		FriendlyTypeName: "Tutanota URL",
		shell: {
			open: {
				command: {
					"": `\\"${execPath}\\" \\"%1\\"`,
				},
			},
		},
	}
	const capabilities_template = {
		tutao: {
			tutanota: {
				Capabilities: {
					ApplicationName: "Tutanota Desktop",
					ApplicationDescription: "",
					UrlAssociations: {
						mailto: "tutanota.Mailto",
					},
				},
			},
		},
	}

	return [
		{
			root: `${registryRoot}\\SOFTWARE\\Clients\\Mail`,
			value: client_template,
		},
		{
			root: `${registryRoot}\\SOFTWARE\\CLASSES`,
			value: {
				mailto: mailto_template,
				"tutanota.Mailto": mailto_template,
			},
		},
		{
			root: HKCR,
			value: {
				mailto: mailto_template,
				"tutanota.Mailto": mailto_template,
			},
		},
		{
			root: `${registryRoot}\\SOFTWARE\\RegisteredApplications`,
			value: {
				tutanota: "SOFTWARE\\\\tutao\\\\tutanota\\\\Capabilities",
			},
		},
		{
			root: `${registryRoot}\\SOFTWARE\\Wow6432Node\\RegisteredApplications`,
			value: {
				tutanota: "SOFTWARE\\\\Wow6432Node\\\\tutao\\\\tutanota\\\\Capabilities",
			},
		},
		{
			root: `${registryRoot}\\SOFTWARE`,
			value: capabilities_template,
		},
		{
			root: `${registryRoot}\\SOFTWARE\\Wow6432Node`,
			value: capabilities_template,
		},
	]
}

function escape(s: string): string {
	return s.replace(/\\/g, "\\\\")
}

/**
 * produce a tmp windows registry script to register an executable as a mailto handler
 * @param registryRoot
 * @param opts {RegistryPaths}
 * @returns {string} registry script
 */
export function makeRegisterKeysScript(registryRoot: RegistryRoot, opts: RegistryPaths): string {
	const { execPath, dllPath, logPath, tmpPath } = opts
	const template = getTemplate(
		{
			execPath: escape(execPath),
			dllPath: escape(dllPath),
			logPath: escape(logPath),
			tmpPath: escape(tmpPath),
		},
		registryRoot,
	)
	return applyScriptBuilder(template)
}

/**
 * produce a tmp windows registry script to unregister tutanota as a mailto handler
 * @returns {string} registry script
 */
export function makeUnregisterKeysScript(registryRoot: RegistryRoot): string {
	// the removal script generator doesn't care about values
	const template = getTemplate(
		{
			execPath: "execPath",
			dllPath: "dllPath",
			logPath: "logPath",
			tmpPath: "tmpPath",
		},
		registryRoot,
	)
	return removeScriptBuilder(template)
}
