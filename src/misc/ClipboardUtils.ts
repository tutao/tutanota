import { client } from "./ClientDetector"

function fallbackCopyToClipboard(text: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const textArea = document.createElement("textarea")
		textArea.value = text
		window.document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()

		try {
			document.execCommand("copy")
		} catch (err) {
			reject("fallback copy failed")
		}

		window.document.body.removeChild(textArea)
		console.log("fallback copy successful")
		resolve()
	})
}

function iosCopyToClipboard(text: string) {
	const el = document.createElement("textarea")
	el.value = text
	el.contentEditable = "true"
	el.readOnly = true
	window.document.body.appendChild(el)
	const range = document.createRange()
	range.selectNodeContents(el)
	const s = window.getSelection()
	s?.removeAllRanges()
	s?.addRange(range)
	el.setSelectionRange(0, 999999) // A big number, to cover anything that could be inside the element.

	window.document.execCommand("copy")
	window.document.body.removeChild(el)
}

export async function copyToClipboard(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text)
	} catch {
		console.log("copy failed, trying fallback")

		if (client.isIos()) {
			return iosCopyToClipboard(text)
		} else {
			return fallbackCopyToClipboard(text)
		}
	}
}
