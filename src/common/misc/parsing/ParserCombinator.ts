// @bundleInto:common-min

import { downcast } from "@tutao/tutanota-utils"
import { TutanotaError } from "@tutao/tutanota-error"

export type Parser<T> = (arg0: StringIterator) => T

export class ParserError extends TutanotaError {
	filename: string | null

	constructor(message: string, filename?: string) {
		super("ParserError", message)
		this.filename = filename ?? null
	}
}

export const combineParsers: (<A, B>(arg0: Parser<A>, arg1: Parser<B>) => Parser<[A, B]>) &
	(<A, B, C>(arg0: Parser<A>, arg1: Parser<B>, arg2: Parser<C>) => Parser<[A, B, C]>) &
	(<A, B, C, D>(arg0: Parser<A>, arg1: Parser<B>, arg2: Parser<C>, arg3: Parser<D>) => Parser<[A, B, C, D]>) &
	(<A, B, C, D, E>(arg0: Parser<A>, arg1: Parser<B>, arg2: Parser<C>, arg3: Parser<D>, arg4: Parser<E>) => Parser<[A, B, C, D, E]>) = downcast(
	(...parsers: any[]) =>
		(iterator: StringIterator) =>
			parsers.map((p) => p(iterator)),
)

export function makeCharacterParser(character: string): Parser<string> {
	return (iterator: StringIterator) => {
		let value = iterator.peek()

		if (value === character) {
			iterator.next()
			return value
		}

		const sliceStart = Math.max(iterator.position - 10, 0)
		const sliceEnd = Math.min(iterator.position + 10, iterator.iteratee.length - 1)
		throw new ParserError(`expected character "${character}" got "${value}" near ${iterator.iteratee.slice(sliceStart, sliceEnd)}`)
	}
}

export function makeNotCharacterParser(character: string): Parser<string> {
	return (iterator: StringIterator) => {
		let value = iterator.peek()

		if (value && value !== character) {
			iterator.next()
			return value
		}

		const sliceStart = Math.max(iterator.position - 10, 0)
		const sliceEnd = Math.min(iterator.position + 10, iterator.iteratee.length - 1)
		throw new ParserError(`expected character "${character}" got "${value}" near ${iterator.iteratee.slice(sliceStart, sliceEnd)}`)
	}
}

export function makeZeroOrMoreParser<T>(anotherParser: Parser<T>): Parser<Array<T>> {
	return (iterator: StringIterator) => {
		const result: T[] = []

		try {
			let parseResult = anotherParser(iterator)

			while (true) {
				result.push(parseResult)
				parseResult = anotherParser(iterator)
			}
		} catch (e) {}

		return result
	}
}

export function mapParser<T, R>(parser: Parser<T>, mapper: (arg0: T) => R): Parser<R> {
	return (iterator: StringIterator) => {
		return mapper(parser(iterator))
	}
}

export function makeOneOrMoreParser<T>(parser: Parser<T>): Parser<Array<T>> {
	return mapParser(makeZeroOrMoreParser(parser), (value: Array<T>) => {
		if (value.length === 0) {
			throw new ParserError("Expected at least one value, got none")
		}

		return value
	})
}

export function maybeParse<T>(parser: Parser<T>): Parser<T | null> {
	return (iterator) => {
		const iteratorPosition = iterator.position

		try {
			return parser(iterator)
		} catch (e) {
			if (e instanceof ParserError) {
				iterator.position = iteratorPosition
			}
			return null
		}
	}
}

export function makeSeparatedByParser<S, T>(separatorParser: Parser<S>, valueParser: Parser<T>): Parser<Array<T>> {
	return (iterator) => {
		const result: T[] = []
		result.push(valueParser(iterator))

		while (true) {
			try {
				separatorParser(iterator)
			} catch (e) {
				break
			}

			result.push(valueParser(iterator))
		}

		return result
	}
}

export function makeEitherParser<A, B>(parserA: Parser<A>, parserB: Parser<B>): Parser<A | B> {
	return (iterator) => {
		const iteratorPosition = iterator.position

		try {
			return parserA(iterator)
		} catch (e) {
			if (e instanceof ParserError) {
				iterator.position = iteratorPosition
				return parserB(iterator)
			}

			throw e
		}
	}
}

export function makeOneOfCharactersParser(allowed: Array<string>): Parser<string> {
	return (iterator: StringIterator) => {
		const value = iterator.peek()

		if (value && allowed.includes(value)) {
			iterator.next()
			return value
		}

		throw new ParserError(`Expected one of ${allowed.map((c) => `"${c}"`).join(", ")}, but got "${value}\n${context(iterator, iterator.position, 10)}"`)
	}
}

export function makeNotOneOfCharactersParser(notAllowed: Array<string>): Parser<string> {
	return (iterator: StringIterator) => {
		const value = iterator.peek()

		if (typeof value !== "string") {
			throw new ParserError("unexpected end of input")
		}

		if (!notAllowed.includes(value)) {
			iterator.next()
			return value
		}

		throw new ParserError(`Expected none of ${notAllowed.map((c) => `"${c}"`).join(", ")}, but got "${value}"\n${context(iterator, iterator.position, 10)}`)
	}
}

export const numberParser: Parser<number> = mapParser(
	makeOneOrMoreParser(makeOneOfCharactersParser(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])),
	(values) => parseInt(values.join(""), 10),
)

export class StringIterator {
	iteratee: string
	position: number = -1

	constructor(iteratee: string) {
		this.iteratee = iteratee
	}

	next(): IteratorResult<string> {
		const value = this.iteratee[++this.position]
		const done: boolean = this.position >= this.iteratee.length
		return done
			? {
					done: true,
					value: undefined,
			  }
			: {
					done: false,
					value,
			  }
	}

	peek(): string | null {
		return this.iteratee[this.position + 1] ?? null
	}
}

function context(iterator: StringIterator, contextCentre: number, contextRadius: number = 10): string {
	const sliceStart = Math.max(contextCentre - contextRadius, 0)
	const sliceEnd = Math.min(contextCentre + contextRadius, iterator.iteratee.length - 1)
	const sliceLength = sliceEnd - sliceStart
	const actualPosition = contextCentre - (2 * contextRadius - sliceLength)
	return iterator.iteratee.slice(sliceStart, sliceEnd)
}
