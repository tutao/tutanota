export type TsString = string
export type TsInt = number
export type TsDouble = number
export type TsBoolean = boolean
export const TsInt = Number
export const TsDouble = Object.assign(Number, {
	from(int: TsInt): TsDouble {
		return int
	},
})
export const TsString = String
