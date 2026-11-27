export type TsString = string
export const TsString = String

export type NonPromise<T> = T extends Promise<any> ? never : T

export type Tuple<A, B> = [A, B]
export type Triple<A, B, C> = [A, B, C]
