export const tutaApiConsole = {
	log(...msg: any): void {
		return console.log(...msg)
	},

	error(...msg: any): void {
		return console.error(...msg)
	},

	warn(...msg: any): void {
		return console.warn(...msg)
	},

	debug(...msg: any): void {
		return console.debug(...msg)
	},

	trace(...msg: any): void {
		return console.debug(...msg)
	},
}
