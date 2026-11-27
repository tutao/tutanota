export type TsString = string
export const TsString = String

export type NonPromise<T> = T extends Promise<any> ? never : T
