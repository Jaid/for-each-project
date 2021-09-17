/* eslint-disable no-unused-vars */

import fsp from "@absolunet/fsp"
import got from "got"

import octokit from "lib/octokit"
import runForProjects from "lib/runForProjects"

import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(message: string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  if (!project.pkg) {
    log("No pkg")
    return
  }
  if (project.pkg.type === "module") {
    log("Already module")
    return
  }
  await project.setPkgValue("type", "module")
  await project.gitFlush("manage: Added “type: module” to pkg")
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})