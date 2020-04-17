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

  const dependsOnRuntime = project.hasDependency("@babel/runtime")
  if (!dependsOnRuntime) {
    return
  }
  await project.npmCheckUpdatesUpgrade()
  await project.uninstallDependency("@babel/runtime")

}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})