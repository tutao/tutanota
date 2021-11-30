// @flow

import o from "ospec"
import {applyScriptBuilder, removeScriptBuilder} from "../../../../src/desktop/integration/RegistryScriptGenerator"

o.spec("RegistryScriptGenerator Test", function () {

	const templates = [
		{
			name: "empty template",
			t: [],
			apply: "Windows Registry Editor Version 5.00",
			remove: "Windows Registry Editor Version 5.00"
		},
		{
			name: "naked value",
			t: [{root: 'HKLM', value: {"tuta": "some_value"}}],
			apply: 'Windows Registry Editor Version 5.00\r\n\r\n[HKLM]\r\n"tuta"="some_value"',
			remove: 'Windows Registry Editor Version 5.00\r\n\r\n[HKLM]\r\n"tuta"=-'
		},
		{
			name: "with subkeys",
			t: [{root: 'HKLM', value: {tuta: {'': "subkey_value"}}}],
			apply: 'Windows Registry Editor Version 5.00\r\n\r\n[HKLM\\tuta]\r\n@="subkey_value"',
			remove: 'Windows Registry Editor Version 5.00\r\n\r\n[-HKLM\\tuta]'
		},
		{
			name: "mixed",
			t: [{root: "HKLM", value: {direct: "direct_val", sub: {"key": "sub_val"}}}],
			apply: 'Windows Registry Editor Version 5.00\r\n\r\n[HKLM]\r\n"direct"="direct_val"\r\n\r\n[HKLM\\sub]\r\n"key"="sub_val"',
			remove: 'Windows Registry Editor Version 5.00\r\n\r\n[HKLM]\r\n"direct"=-\r\n\r\n[-HKLM\\sub]',
		},
		{
			name: "deeper subkey",
			t: [{root: "HKCU", value: {a: {deep: {path: {subkey: {'': "hello."}}}}}}],
			apply: 'Windows Registry Editor Version 5.00\r\n\r\n[HKCU\\a\\deep\\path\\subkey]\r\n@="hello."',
			remove: 'Windows Registry Editor Version 5.00\r\n\r\n[-HKCU\\a]',
		},
	]

	for (const {t, apply, remove, name} of templates) {
		o(name, function () {
			o(applyScriptBuilder(t)).equals(apply)
			o(removeScriptBuilder(t)).equals(remove)
		})
	}
})