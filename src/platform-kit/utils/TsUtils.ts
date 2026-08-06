import { Nullable } from "./Utils"

export abstract class TsBrand {
	protected abstract readonly __brand: Nullable<never>
}

export type BrandedType<T, B extends TsBrand> = T & { __brand: B }
