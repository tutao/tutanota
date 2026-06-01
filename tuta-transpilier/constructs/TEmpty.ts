import { ConstructOut, TConstruct } from "./TConstruct"

export class TEmpty extends TConstruct {
	constructor() {
		super()
	}

	generateKotlin(): ConstructOut {
		return ``
	}
}
