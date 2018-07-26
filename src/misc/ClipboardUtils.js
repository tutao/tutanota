//@flow
function fallbackCopyTextToClipboard(text) {
	const textArea = document.createElement("textarea");
	textArea.value = text;
	window.document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		const successful = document.execCommand('copy');
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}
	window.document.body.removeChild(textArea);
}

export function copyToClipboard(text: string): void {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	(navigator: any).clipboard.writeText(text).catch((err) => {
		console.error('Async: Could not copy text: ', err);
	})
}