import { ConstructOut, TConstruct } from "./TConstruct"

const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "Int", swift: "" },
	Boolean: { kotlin: "Boolean", swift: "" },
})

export class TTypeName extends TConstruct {
	constructor(private readonly rawName: string) {
		super()
	}

	generateKotlin(): ConstructOut {
		return MappedPrimitiveType[this.rawName]?.kotlin ?? this.rawName
	}

	isPrimitiveType(): boolean {
		return MappedPrimitiveType[this.rawName] != null
	}
}
