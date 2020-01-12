/* eslint-disable no-unused-vars */

import fsp from "@absolunet/fsp"

import octokit from "lib/octokit"
import runForProjects from "lib/runForProjects"

import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})