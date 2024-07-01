const modifiers = /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super)$/
const keyCodes =
	/^([0-9A-Z)!@#$%^&*(:+<_>?~{|}";=,\-./`[\\\]']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/
export default function (str: string): boolean {
	let parts = str.split("+")
	let keyFound = false
	return parts.every((val, index) => {
		const isKey = keyCodes.test(val)
		const isModifier = modifiers.test(val)

		if (isKey) {
			// Key must be unique
			if (keyFound) return false
			keyFound = true
		}

		// Key is required
		if (index === parts.length - 1 && !keyFound) return false
		return isKey || isModifier
	})
}
