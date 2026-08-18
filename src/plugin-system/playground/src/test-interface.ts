export interface TestInterface {
	getMail(id: string): Mail
}

export class Mail {
	subject: string = ""
	body: string = ""

	constructor() {}
}
