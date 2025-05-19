public enum SqlcipherError: Error {
	case intergrityCheck
	case prepare(message: String, sql: String)
	case exec(message: String, sql: String)
}
