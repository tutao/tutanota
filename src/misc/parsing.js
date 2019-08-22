//@flow
import {downcast} from "../api/common/utils/Utils"
import {TutanotaError} from "../api/common/error/TutanotaError"

export type Parser<T> = (StringIterator) => T


export class ParserError extends TutanotaError {
	filename: ?string

	constructor(message: string, filename?: string) {
		super("ParserError", message)
		this.filename = filename
	}
}

export const combineParsers: (<A, B>(Parser<A>, Parser<B>) => Parser<[A, B]>)
	& ((<A, B, C>(Parser<A>, Parser<B>, Parser<C>) => Parser<[A, B, C]>))
	& ((<A, B, C, D>(Parser<A>, Parser<B>, Parser<C>, Parser<D>) => Parser<[A, B, C, D]>))
	& ((<A, B, C, D, E>(Parser<A>, Parser<B>, Parser<C>, Parser<D>, Parser<E>) => Parser<[A, B, C, D, E]>))
	= downcast((...parsers) => (iterator) => parsers.map(p => p(iterator)))


export function makeCharacterParser(character: string): Parser<string> {
	return (iterator: StringIterator) => {
		let value = iterator.peek()
		if (value === character) {
			iterator.next()
			return value
		}
		const sliceStart = Math.max(iterator.position - 10, 0)
		const sliceEnd = Math.min(iterator.position + 10, iterator.iteratee.length - 1)
		throw new ParserError(`expected character ${character} got ${value} near ${iterator.iteratee.slice(sliceStart, sliceEnd)}`)
	}
}

function makeZeroOrMoreParser<T>(anotherParser: Parser<T>): Parser<Array<T>> {
	return (iterator: StringIterator) => {
		const result = []
		try {
			let parseResult = anotherParser(iterator)
			while (true) {
				result.push(parseResult)
				parseResult = anotherParser(iterator)
			}
		} catch (e) {
		}
		return result
	}
}

export function mapParser<T, R>(parser: Parser<T>, mapper: (T) => R): Parser<R> {
	return (iterator: StringIterator) => mapper(parser(iterator))
}

function makeOneOrMoreParser<T>(parser: Parser<T>): Parser<Array<T>> {
	return mapParser(makeZeroOrMoreParser(parser), (value: Array<T>) => {
		if (value.length === 0) {
			throw new ParserError("Expected at least one value, got none")
		}
		return value
	})
}

export function maybeParse<T>(parser: Parser<T>): Parser<?T> {
	return (iterator) => {
		try {
			return parser(iterator)
		} catch (e) {
			return null
		}
	}
}

export function makeSeparatedByParser<S, T>(separatorParser: Parser<S>, valueParser: Parser<T>): Parser<Array<T>> {
	return (iterator) => {
		const result = []
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

function makeOneOfCharactersParser(allowed: Array<string>): Parser<string> {
	return (iterator: StringIterator) => {
		const value = iterator.peek()
		if (allowed.includes(value)) {
			iterator.next()
			return value
		}
		throw new ParserError(`Expected one of ${String(allowed)}, got ${value}`)
	}
}

export const numberParser: Parser<number> = mapParser(makeOneOrMoreParser(makeOneOfCharactersParser([
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
	])),
	(values) => parseInt(values.join(""), 10))

export class StringIterator {
	iteratee: string
	position: number = -1

	constructor(iteratee: string) {
		this.iteratee = iteratee
	}

	next(): {value: ?string, done: boolean} {
		const value = this.iteratee[++this.position]
		const done = this.position >= this.iteratee.length
		return {value, done}
	}

	peek(): string {
		return this.iteratee[this.position + 1]
	}
}
