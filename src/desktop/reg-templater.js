// @flow
import type {RegistryTemplateDefinition} from "./integration/RegistryScriptGenerator"
import {applyScriptBuilder, removeScriptBuilder} from "./integration/RegistryScriptGenerator"

const esc = s => s.replace(/\\/g, '\\\\')
const hklm = "HKEY_LOCAL_MACHINE"
const hkcu = "HKEY_CURRENT_USER"
const hkcr = "HKEY_CLASSES_ROOT"
const sw_clients_mail = r => `${r}\\SOFTWARE\\Clients\\Mail`
const sw_cls = r => `${r}\\SOFTWARE\\CLASSES`
const sw = r => `${r}\\SOFTWARE`
const sw_wow = r => `${r}\\SOFTWARE\\Wow6432Node`
const sw_reg_apps = r => `${r}\\SOFTWARE\\RegisteredApplications`
const sw_wow_reg_apps = r => `${r}\\SOFTWARE\\Wow6432Node\\RegisteredApplications`

/**
 * get a registry template specific to tutanota desktop
 * https://docs.microsoft.com/en-us/windows/win32/msi/installation-context#registry-redirection
 */
function getTemplate(
	execPath: string,
	dllPath: string,
	logPath: string,
	tmpPath: string,
	local: boolean,
): RegistryTemplateDefinition {
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
		{root: sw_clients_mail(r), value: client_template},
		{root: sw_cls(r), value: {mailto: mailto_template, "tutanota.Mailto": mailto_template}},
		{root: hkcr, value: {mailto: mailto_template, "tutanota.Mailto": mailto_template}},
		{root: sw_reg_apps(r), value: {"tutanota": "SOFTWARE\\\\tutao\\\\tutanota\\\\Capabilities"}},
		{root: sw_wow_reg_apps(r), value: {"tutanota": "SOFTWARE\\\\Wow6432Node\\\\tutao\\\\tutanota\\\\Capabilities"}},
		{root: sw(r), value: capabilities_template},
		{root: sw_wow(r), value: capabilities_template}
	]
}

/**
 * produce a tmp windows registry script to register an executable as a mailto handler
 * @param execPath path to the executable that should be registered
 * @param dllPath path to the mapi dll that handles "Send as Mail..." requests
 * @param logPath path to the directory the mapi dll should put logs in
 * @param tmpPath path to the tmp dir that's managed by tutanota
 * @param local set to true if the app was installed per-user
 * @returns {string} registry script
 */
export function registerKeys(execPath: string, dllPath: string, logPath: string, tmpPath: string, local: boolean): string {
	const template = getTemplate(esc(execPath), esc(dllPath), esc(logPath), esc(tmpPath), local)
	return applyScriptBuilder(template)
}

/**
 * produce a tmp windows registry script to unregister tutanota as a mailto handler
 * @returns {string} registry script
 */
export function unregisterKeys(local: boolean): string {
	// the removal script generator doesn't care about values
	const template = getTemplate("execPath", "dllPath", "logPath", "tmpPath", local)
	return removeScriptBuilder(template)
}