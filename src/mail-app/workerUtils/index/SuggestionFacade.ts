import type { Db } from "../../../common/api/worker/search/SearchTypes.js"
import { stringToUtf8Uint8Array, TypeRef, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { aesDecrypt, aes256EncryptSearchIndexEntry, unauthenticatedAesDecrypt } from "@tutao/tutanota-crypto"
import { SearchTermSuggestionsOS } from "../../../common/api/worker/search/IndexTables.js"

export type SuggestionsType = Record<string, string[]>

export class SuggestionFacade<T> {
	_db: Db
	type: TypeRef<T>
	_suggestions: SuggestionsType

	constructor(type: TypeRef<T>, db: Db) {
		this.type = type
		this._db = db
		this._suggestions = {}
	}

	load(): Promise<void> {
		return this._db.initialized.then(() => {
			return this._db.dbFacade.createTransaction(true, [SearchTermSuggestionsOS]).then((t) => {
				return t.get(SearchTermSuggestionsOS, this.type.type.toLowerCase()).then((encSuggestions) => {
					if (encSuggestions) {
						this._suggestions = JSON.parse(utf8Uint8ArrayToString(unauthenticatedAesDecrypt(this._db.key, encSuggestions, true)))
					} else {
						this._suggestions = {}
					}
				})
			})
		})
	}

	addSuggestions(words: string[]): void {
		for (const word of words) {
			if (word.length > 0) {
				let key = word.charAt(0)

				if (this._suggestions[key]) {
					let existingValues = this._suggestions[key]

					if (existingValues.indexOf(word) === -1) {
						let insertIndex = existingValues.findIndex((v) => word < v)

						if (insertIndex === -1) {
							existingValues.push(word)
						} else {
							existingValues.splice(insertIndex, 0, word)
						}
					}
				} else {
					this._suggestions[key] = [word]
				}
			}
		}
	}

	getSuggestions(word: string): string[] {
		if (word.length > 0) {
			let key = word.charAt(0)
			let result = this._suggestions[key]
			return result ? result.filter((r) => r.startsWith(word)) : []
		} else {
			return []
		}
	}

	store(): Promise<void> {
		return this._db.initialized.then(() => {
			return this._db.dbFacade.createTransaction(false, [SearchTermSuggestionsOS]).then((t) => {
				let encSuggestions = aes256EncryptSearchIndexEntry(this._db.key, stringToUtf8Uint8Array(JSON.stringify(this._suggestions)))
				t.put(SearchTermSuggestionsOS, this.type.type.toLowerCase(), encSuggestions)
				return t.wait()
			})
		})
	}
}
