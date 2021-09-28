// @flow

/**
 * produce a tmp windows registry script to register an executable as a mailto handler
 * @param execPath path to the executable that should be registered
 * @param dllPath path to the mapi dll that handles "Send as Mail..." requests
 * @param logPath path to the directory the mapi dll should put logs in
 * @param tmpPath path to the tmp dir that's managed by tutanota
 * @returns {string} registry script
 */
module.exports.registerKeys = (execPath: string, dllPath: string, logPath: string, tmpPath: string): string => {
	const esc = s => s.replace(/\\/g, '\\\\')
	execPath = esc(execPath)
	dllPath = esc(dllPath)
	logPath = esc(logPath)
	tmpPath = esc(tmpPath)
	return `Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\\mailto]
@="URL:MailTo Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\mailto\\shell\\open\\command]
@="\\"${execPath}\\" %1"

[HKEY_CLASSES_ROOT\\tutanota.Mailto]
@="URL:MailTo Protocol"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\tutanota.Mailto\\shell\\open\\command]
@="\\"${execPath}\\" %1"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\mailto]
@="URL:MailTo Protocol"
"URL Protocol"=""

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\mailto\\shell\\open\\command]
@="\\"${execPath}\\" %1"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\tutanota.Mailto]
@="URL:MailTo Protocol"
"URL Protocol"=""

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\tutanota.Mailto\\shell\\open\\command]
@="\\"${execPath}\\" %1"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\RegisteredApplications]
"tutanota"="SOFTWARE\\\\tutao\\\\tutanota\\\\Capabilities"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\tutao\\tutanota\\Capabilities]
"ApplicationName"="Tutanota Desktop"
"ApplicationDescription"=""

[HKEY_LOCAL_MACHINE\\SOFTWARE\\tutao\\tutanota\\Capabilities\\UrlAssociations]
"mailto"="tutanota.Mailto"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\Mail\\tutanota]
@="tutanota"
"DLLPath"="${dllPath}"
"EXEPath"="${execPath}"
"LOGPath"="${logPath}"
"TMPPath"="${tmpPath}"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\Mail]
@="tutanota"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\RegisteredApplications]
"tutanota"="SOFTWARE\\\\Wow6432Node\\\\tutao\\\\tutanota\\\\Capabilities"

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\tutao\\tutanota\\Capabilities]
"ApplicationName"="Tutanota Desktop"
"ApplicationDescription"=""

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\tutao\\tutanota\\Capabilities\\UrlAssociations]
"mailto"="tutanota.Mailto"
`.replace(/\n/g, "\r\n")
}

/**
 * produce a tmp windows registry script to unregister tutanota as a mailto handler
 * @returns {*} registry script
 */
module.exports.unregisterKeys = (): string => {
	return `Windows Registry Editor Version 5.00

[-HKEY_CLASSES_ROOT\\tutanota.Mailto]

[-HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\tutanota.Mailto]

[HKEY_LOCAL_MACHINE\\SOFTWARE\\RegisteredApplications]
"tutanota"=-

[-HKEY_LOCAL_MACHINE\\SOFTWARE\\tutao\\tutanota]

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\Mail]
@=-

[-HKEY_LOCAL_MACHINE\\SOFTWARE\\Clients\\Mail\\tutanota]

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\RegisteredApplications]
"tutanota"=-

[-HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\tutao\\tutanota]
`.replace(/\n/g, "\r\n")
}