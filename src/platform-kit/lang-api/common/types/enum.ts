import { TsInt, TsString } from "./primitives"
import { assertNotNull } from "../functional"
import { TsObject } from "./ecmascript"

export class LangApiEnum {
	/// In TypeScript, when enum variant is assigned to string value,
	/// the variant can be used in place where string was expected,
	/// that is not the case in kotlin's & swift's langAPi,
	/// hence we need this function.
	/// In TypeScript it will just be identity function
	public static getStringEnumValue(value: TsString): TsString {
		return value
	}

	/// Same as getStringEnumValue but for enum whose assoicated value is number
	public static getNumericEnumValue(value: TsInt): TsInt {
		return value
	}

	public static enumKeyByValue<T extends Record<string, string>>(e: T, value: T[keyof T]): keyof T {
		return assertNotNull(
			TsObject.keys(e).find((k) => e[k] === value),
			`Unknown enum value: ${value}`,
		)
	}
}
