export type TsString = string
export type TsNumber = number
export type TsBoolean = boolean
export const TsString = String

export type NonPromise<T> = T extends Promise<any> ? never : T
