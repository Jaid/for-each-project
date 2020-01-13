/* eslint-disable no-unused-vars */

import fsp from "@absolunet/fsp"
import got from "got"

import octokit from "lib/octokit"
import runForProjects from "lib/runForProjects"

import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  if (!project.pkg.name) {
    log("package.json#name not set, skipping")
    return
  }
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})