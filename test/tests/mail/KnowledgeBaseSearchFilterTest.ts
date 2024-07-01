import o from "@tutao/otest"
import { knowledgeBaseSearch } from "../../../src/mail-app/knowledgebase/model/KnowledgeBaseSearchFilter.js"
import type { KnowledgeBaseEntry } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { KnowledgeBaseEntryKeywordTypeRef, KnowledgeBaseEntryTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("KnowledgeBaseSearchFilter", function () {
	o("finds in title with two filtered keywords", function () {
		const knowledgebaseEntry1: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "User forgot their password",
			description:
				"When a user is certain that they do not remember their password anymore, " +
				"first, ask the user if they tried all passwords that come to mind" +
				"if the user completed step 1, ask if they can provide proof that they own the account",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "password",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "forgotten",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "reset",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "account",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "access",
				}),
			],
		})
		const knowledgebaseEntry2: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "User cannot access account anymore",
			description: "A general entry for when the user cannot access their account",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "access",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "account",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "lost",
				}),
			],
		})
		const allFakeEntries = [knowledgebaseEntry1, knowledgebaseEntry2]
		o(knowledgeBaseSearch("password", allFakeEntries)).deepEquals([knowledgebaseEntry1]) // should find knowledgebaseEntry1
	})
	o("finds in title without filtered keywords", function () {
		const knowledgebaseEntry1: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "User forgot their password",
			description:
				"When a user is certain that they do not remember their password anymore" +
				"first, ask the user if they tried all passwords that come to mind" +
				"if the user completed step 1, ask if they can provide proof that they own the account",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "password",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "forgotten",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "reset",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "account",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "access",
				}),
			],
		})
		const knowledgebaseEntry2: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "User cannot access account anymore",
			description:
				"A general entry for when the user cannot access their account" +
				"ask user whether its because of the password or other factors as to why they cannot access their account",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "access",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "account",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "lost",
				}),
			],
		})
		const allFakeEntries = [knowledgebaseEntry1, knowledgebaseEntry2]
		o(knowledgeBaseSearch("user", allFakeEntries)).deepEquals([knowledgebaseEntry1, knowledgebaseEntry2]) // should find in both entries
	})
	o("more than one filter word", function () {
		const knowledgebaseEntry1: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "Payment has been booked but features arent accessible",
			description:
				"Something went wrong and the payment registered, but the user believes their features arent accessible yet" +
				"first, check how long the time between payment and contact has been" +
				"if it has been more than X days, ask the user to provide a bill or payment proof",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "payment",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "features",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "inaccessible",
				}),
			],
		})
		const knowledgebaseEntry2: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "Payment hasn't been booked yet, features aren't accessible either",
			description:
				"Something went wrong and the payment never registered" +
				"ask user if they can provide a bill or payment proof" +
				"if provided, re-do the booking and enable the features for the user",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "payment",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "unregistered",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "inaccessible",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "features",
				}),
			],
		})
		const knowledgebaseEntry3: KnowledgeBaseEntry = createTestEntity(KnowledgeBaseEntryTypeRef, {
			title: "Features don't work as intended, or are buggy",
			description:
				"The user has reported features that do not work as intended and hinder the users' experience" +
				"if needed, ask user if they can elaborate on their issue" +
				"if the problem is known, explain that the team is working on a fix, or explain a temporary fix" +
				"if its a new problem, tell the user that it has been reported to the team and will be taken care of",
			keywords: [
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "functionality",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "not",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "working",
				}),
				createTestEntity(KnowledgeBaseEntryKeywordTypeRef, {
					keyword: "bug",
				}),
			],
		})
		const fakeEntries = [knowledgebaseEntry1, knowledgebaseEntry2, knowledgebaseEntry3]
		o(knowledgeBaseSearch("payment functionality", fakeEntries)).deepEquals([knowledgebaseEntry1, knowledgebaseEntry2, knowledgebaseEntry3]) // should find all entries
	})
})
