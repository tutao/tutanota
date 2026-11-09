export const TsMath = Math
export type TsRegex = RegExp
export const TsObject = Object
export const TsNumber = Number
export const TsDate = Date

export type lazy<T> = () => T
export type lazyAsync<T> = () => Promise<T>
export type Thunk = () => unknown
