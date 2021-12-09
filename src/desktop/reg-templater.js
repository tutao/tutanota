// @flow
import type {RegistryTemplateDefinition} from "./integration/RegistryScriptGenerator"
import {applyScriptBuilder, removeScriptBuilder} from "./integration/RegistryScriptGenerator"

const esc = s => s.replace(/\\/g, '\\\\')
const hklm = "HKEY_LOCAL_MACHINE"
const hkcu = "HKEY_CURRENT_USER"
const hkcr = "HKEY_CLASSES_ROOT"

/**
 * execPath: path for the dll to this executable
 * dllPath: path for other apps to the dll
 * logPath: path for the dll to log mapi activity to
 * tmpPath: path for the dll to put temporary attachment files
 */
export type RegistryPaths = {
	execPath: string,
	dllPath: string,
	logPath: string,
	tmpPath: string
}

/**
 * get a registry template specific to tutanota desktop
 * https://docs.microsoft.com/en-us/windows/win32/msi/installation-context#registry-redirection
 */
function getTemplate(opts: RegistryPaths, local: boolean): RegistryTemplateDefinition {
	const {execPath, dllPath, logPath, tmpPath} = opts
	const client_template = {
		tutanota: {
			"": "tutanota",
			"DLLPath": dllPath,
			"EXEPath": execPath,
			"LOGPath": logPath,
			"TMPPath": tmpPath
		},
		"": "tutanota"
	}

	const mailto_template = {
		"": "URL:MailTo Protocol",
		"URL Protocol": "",
		"FriendlyTypeName": "Tutanota URL",
		shell: {
			open: {
				command: {
					"": `\\"${execPath}\\" \\"%1\\"`
				}
			}
		}
	}

	const capabilities_template = {
		tutao: {
			tutanota: {
				Capabilities: {
					"ApplicationName": "Tutanota Desktop",
					"ApplicationDescription": "",
					UrlAssociations: {
						"mailto": "tutanota.Mailto"
					}
				}
			}
		}
	}

	const r = local ? hkcu : hklm
	return [
		{
			root: `${r}\\SOFTWARE\\Clients\\Mail`,
			value: client_template
		},
		{
			root: `${r}\\SOFTWARE\\CLASSES`,
			value: {mailto: mailto_template, "tutanota.Mailto": mailto_template}
		},
		{
			root: hkcr,
			value: {mailto: mailto_template, "tutanota.Mailto": mailto_template}
		},
		{
			root: `${r}\\SOFTWARE\\RegisteredApplications`,
			value: {"tutanota": "SOFTWARE\\\\tutao\\\\tutanota\\\\Capabilities"}
		},
		{
			root: `${r}\\SOFTWARE\\Wow6432Node\\RegisteredApplications`,
			value: {"tutanota": "SOFTWARE\\\\Wow6432Node\\\\tutao\\\\tutanota\\\\Capabilities"}
		},
		{
			root: `${r}\\SOFTWARE`,
			value: capabilities_template
		},
		{
			root: `${r}\\SOFTWARE\\Wow6432Node`,
			value: capabilities_template
		}
	]
}

/**
 * produce a tmp windows registry script to register an executable as a mailto handler
 * @param opts {RegistryPaths}
 * @param local set to true if the app was installed per-user
 * @returns {string} registry script
 */
export function registerKeys(opts: RegistryPaths, local: boolean): string {
	const {execPath, dllPath, logPath, tmpPath} = opts
	const template = getTemplate({execPath: esc(execPath), dllPath: esc(dllPath), logPath: esc(logPath), tmpPath: esc(tmpPath)}, local)
	return applyScriptBuilder(template)
}

/**
 * produce a tmp windows registry script to unregister tutanota as a mailto handler
 * @returns {string} registry script
 */
export function unregisterKeys(local: boolean): string {
	// the removal script generator doesn't care about values
	const template = getTemplate({execPath: "execPath", dllPath: "dllPath", logPath: "logPath", tmpPath: "tmpPath"}, local)
	return removeScriptBuilder(template)
}