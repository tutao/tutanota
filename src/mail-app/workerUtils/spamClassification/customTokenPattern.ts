export const DATE_PATTERN = new RegExp(
	"\\b(?:\\d{1,2}[.\\/\\-]){2}\\d{2,4}\\b|" + // Match 01-01-2015 (and "./-" variations)
		"\\b\\d{2,4}[.\\/\\-]\\d{1,2}[.\\/\\-]\\d{1,2}\\b|" + // Match Year, Month, Day
		"\\b\\d{1,2}[.\\/\\-]\\d{2,4}\\b", // Match Month/Year
	"gm",
)

export const DATE_PATTERN_TOKEN = "<DATE-TOKEN>"

// Taken from /src/common/misc/FormatValidator.ts, if it works well, refactor.
const DOMAIN_PART_REGEX = "[\\w\\-\\+_]+"
const DOMAIN_REGEXP = new RegExp(`^${DOMAIN_PART_REGEX}\\.${DOMAIN_PART_REGEX}(\\.${DOMAIN_PART_REGEX})*\\s*$`)
const DOMAIN_OR_TLD_REGEXP = new RegExp(`^(${DOMAIN_PART_REGEX}.)*${DOMAIN_PART_REGEX}$`)

export const EMAIL_ADDR_PATTERN = new RegExp(`^[^\\s\\@]+\\@${DOMAIN_PART_REGEX}\\.${DOMAIN_PART_REGEX}(\\.${DOMAIN_PART_REGEX})*\\s*$`)
export const EMAIL_ADDR_PATTERN_TOKEN = "<EMAIL-TOKEN>"

export const URL_PATTERN = new RegExp(/(?:http[s]?:\/\/\.)?(?:www\.)?[-a-zA-Z0-9@%._\\+~#=]{2,256}\\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\\+.~#?&\\/\\/=]*)/, "g")

export const URL_PATTERN_TOKEN = "<LINK:$1>"
