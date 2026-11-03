export type TsString = string
export type TsInt = number
export type TsDouble = number
export type TsBoolean = boolean
export const TsInt = Object.assign(Number, {
	// We cannot use .toString() method on number,
	// since kotlin have a method called .toString() for all object which return String instead of KtString
	// instead of doin 1.toString() we should do TsInt.toString(1)
	toString(int: TsInt): TsString {
		return int.toString()
	},
})
export const TsDouble = Object.assign(Number, {
	from(int: TsInt): TsDouble {
		return int
	},
})
export const TsString = String
