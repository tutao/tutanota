//@flow
import {downcast} from "../api/common/utils/Utils"

export type Parser<T> = (StringIterator) => T

export const combineParsers: (<A, B>(Parser<A>, Parser<B>) => Parser<[A, B]>)
	& ((<A, B, C>(Parser<A>, Parser<B>, Parser<C>) => Parser<[A, B, C]>))
	& ((<A, B, C, D>(Parser<A>, Parser<B>, Parser<C>, Parser<D>) => Parser<[A, B, C, D]>))
	& ((<A, B, C, D, E>(Parser<A>, Parser<B>, Parser<C>, Parser<D>, Parser<E>) => Parser<[A, B, C, D, E]>))
	= downcast((...parsers) => (iterator) => parsers.map(p => p(iterator)))

export const parseCharacter = (character: string) => (iterator: StringIterator) => {
	let value = iterator.peek()
	if (value === character) {
		iterator.next()
		return value
	}
	throw new Error("expected character " + character)
}

const parseZeroOrMore = <T>(anotherParser: Parser<T>): Parser<Array<T>> => (iterator: StringIterator) => {
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

export const mapParser = <T, R>(parser: Parser<T>, mapper: (T) => R): Parser<R> => (iterator: StringIterator) => mapper(parser(iterator))

const parseOneOrMore = <T>(parser: Parser<T>): Parser<Array<T>> => mapParser(parseZeroOrMore(parser), (value: Array<T>) => {
	if (value.length === 0) {
		throw new Error("Expected at least one value, got none")
	}
	return value
})


export const maybeParse = <T>(parser: Parser<T>): Parser<?T> => (iterator) => {
	try {
		return parser(iterator)
	} catch (e) {
		return null
	}
}

export const parseSeparatedBy = <T, S>(separatorParser: Parser<S>, valueParser: Parser<T>): Parser<Array<T>> => {
	return (iterator) => {
		const result = []
		while (true) {
			result.push(valueParser(iterator))
			try {
				separatorParser(iterator)
			} catch (e) {
				break
			}
		}
		return result
	}
}

export const parseEither: <A, B>(Parser<A>, Parser<B>) => Parser<A | B> = (parserA, parserB) => (iterator) => {
	const iteratorPosition = iterator.position
	try {
		return parserA(iterator)
	} catch (e) {
		iterator.position = iteratorPosition
		return parserB(iterator)
	}
}

const parseOneOf = <T>(allowed: Array<Parser<T>>) => allowed.reduce(parseEither, () => {
	throw new Error("None of the allowed parsers matched")
})

const parseOneOfCharacters = (allowed: Array<string>): Parser<string> => (iterator: StringIterator) => {
	const value = iterator.peek()
	if (allowed.includes(value)) {
		iterator.next()
		return value
	}
	throw new Error(`Expected one of ${String(allowed)}, got ${value}`)
}
export const parseNumber: Parser<number> = mapParser(parseOneOrMore(parseOneOfCharacters(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])),
	(values) => parseInt(values.join(""), 10))

export class StringIterator {
	iteratee: string
	position = -1

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
