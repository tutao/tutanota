import { program } from "commander"
import { bumpVersionCmd } from "./bump-version"
import { fetchDictionariesCmd } from "./fetchDictionaries"
import { prepareMobileBuildCmd } from "./prepareMobileBuild"
import { releaseNotesCmd } from "./releaseNotes"
import { createReleaseDraftCmd } from "./createReleaseDraft"
import { publishCmd } from "./publish"
import { desktopCmd } from "./desktop"
import { webappCmd } from "./webapp"
import { androidCmd } from "./android"

await program
	.addCommand(bumpVersionCmd)
	.addCommand(fetchDictionariesCmd)
	.addCommand(prepareMobileBuildCmd)
	.addCommand(androidCmd)
	.addCommand(webappCmd)
	.addCommand(desktopCmd)
	.addCommand(releaseNotesCmd)
	.addCommand(createReleaseDraftCmd)
	.addCommand(publishCmd)
	.parseAsync(process.argv)
