import { reverse } from "../../platform-kits/app-env"

export enum CounterType {
	Default = "0",
	Signup = "1",
	UnreadMails = "2",
	UserStorageLegacy = "3",
	GroupStorageLegacy = "4",
	UserStorage = "5",
	GroupStorage = "6",
}

export const CounterTypeToName = reverse(CounterType)