import type { lazy } from "../platform-kit/utils"

export type MaybeLazy<T> = T | lazy<T>

export function resolveMaybeLazy<T>(maybe: MaybeLazy<T>): T {
	return typeof maybe === "function" ? (maybe as () => T)() : maybe
}

export function getAsLazy<T>(maybe: MaybeLazy<T>): lazy<T> {
	return typeof maybe === "function" ? (maybe as lazy<T>) : () => maybe
}

export function mapLazily<T, U>(maybe: MaybeLazy<T>, mapping: (arg0: T) => U): lazy<U> {
	return () => mapping(resolveMaybeLazy(maybe))
}

export function lazyStringValue(valueOrLazy: string | lazy<string>): string {
	return typeof valueOrLazy === "function" ? valueOrLazy() : valueOrLazy
}
