/**
 * return a list of words contained in a text, lowercased.
 * @param text
 */
export function tokenize(text: string | null): string[] {
	if (text == null) return []
	let currentWord: string[] = []
	let words: string[] = []

	for (let i = 0; i < text.length; i++) {
		let currentChar = text.charAt(i)

		if (isEndOfWord(currentChar)) {
			addCurrentWord(currentWord, words)
			currentWord = []
		} else {
			currentWord.push(currentChar)
		}
	}

	addCurrentWord(currentWord, words)
	return words
}

function addCurrentWord(currentWord: string[], words: string[]) {
	while (currentWord.length > 0 && currentWord[0] === "'") {
		currentWord.shift()
	}

	while (currentWord.length > 0 && currentWord[currentWord.length - 1] === "'") {
		currentWord.pop()
	}

	if (currentWord.length > 0) {
		words.push(currentWord.join("").toLowerCase())
	}
}

function isEndOfWord(char: string) {
	switch (char) {
		case " ":
		case "\n":
		case "\r":
		case "\t":
		case "\x0B":
		case "\f":
		case ".":
		case ",":
		case ":":
		case ";":
		case "!":
		case "?":
		case "&":
		case '"':
		case "<":
		case ">":
		case "-":
		case "+":
		case "=":
		case "(":
		case ")":
		case "[":
		case "]":
		case "{":
		case "}":
		case "/":
		case "\\":
		case "^":
		case "_":
		case "`":
		case "~":
		case "|":
		case "@":
			return true

		default:
			return false
	}
}
