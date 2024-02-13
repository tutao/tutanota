export const ansiSequences = Object.freeze({
	redFg: "\x1b[31m",
	greenBg: "\x1b[42m",
	redBg: "\x1b[41m",
	yellowBg: "\x1b[43m",
	reset: "\x1b[0m",
	bold: "\x1b[0;1m",
	faint: "\x1b[0;2m",
})

type CodeValues = (typeof ansiSequences)[keyof typeof ansiSequences]

export function fancy(text: string, code: CodeValues) {
	if (typeof process !== "undefined" && process.stdout.isTTY) {
		return `${code}${text}${ansiSequences.reset}`
	} else {
		return text
	}
}
