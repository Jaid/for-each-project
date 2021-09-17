/* eslint-disable no-unused-vars */

import fsp from "@absolunet/fsp"
import got from "got"

import octokit from "./lib/octokit.js"
import runForProjects from "./lib/runForProjects.js"
import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(message: string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  await project.gitFlush("Changed something")
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})