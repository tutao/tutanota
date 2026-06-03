import { ConstructOut, TConstruct } from "./TConstruct"
import { ExportGetableNode, Scope, ScopedNode } from "ts-morph"

export class TVisibility extends TConstruct {
	constructor(private readonly scope: Scope) {
		super()
	}

	public static checkExported(node: ExportGetableNode) {
		if (node.isExported()) {
			return new TVisibility(Scope.Public)
		} else {
			return new TVisibility(Scope.Private)
		}
	}

	public static checkScope(node: ScopedNode) {
		if (node.hasScopeKeyword()) {
			return new TVisibility(node.getScope())
		} else {
			// if we do not specify any scope it's public by default in js
			return new TVisibility(Scope.Public)
		}
	}

	generateKotlin(): ConstructOut {
		switch (this.scope) {
			case Scope.Public:
				return "public"
			case Scope.Protected:
				return "protected"
			case Scope.Private:
				return "private"
		}
	}
}
