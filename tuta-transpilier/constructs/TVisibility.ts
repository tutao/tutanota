import { ConstructOut, TConstruct } from "./TConstruct"
import { ExportGetableNode } from "ts-morph"

export class TVisibility extends TConstruct {
	constructor(private readonly value: ExportGetableNode) {
		super()
	}

	generateKotlin(): ConstructOut {
		if (this.value.isExported()) {
			return "public"
		} else {
			return "private"
		}
	}
}
