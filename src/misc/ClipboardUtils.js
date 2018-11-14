//@flow
function fallbackCopyToClipboard(text: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const textArea = document.createElement("textarea")
		textArea.value = text
		window.document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()
		try {
			document.execCommand('copy')
		} catch (err) {
			reject("fallback copy failed")
		}
		window.document.body.removeChild(textArea)
		console.log('fallback copy successful')
		resolve()
	})
}

export function copyToClipboard(text: string): Promise<void> {
	return new Promise((resolve) => {
		navigator.clipboard.writeText(text)
		         .then(() => {
			         console.log('copy successful')
			         resolve()
		         })
	})
		.catch(() => {
			console.log('copy failed, trying fallback')
			return fallbackCopyToClipboard(text)
		})
}