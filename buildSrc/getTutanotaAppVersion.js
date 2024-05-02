import { getTutanotaAppVersion } from "./buildUtils.js"

process.stdout.write(await getTutanotaAppVersion())
