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
  const hasFile = await project.hasFile("tsconfigBase.json")
  if (hasFile) {
    log("tsconfig.json not given, skipping")
    return
  }
  const tsconfigBase = await project.readFileJson("tsconfigBase.json")
  const tsconfig = await project.readFileJson("tsconfig.json")
  if (tsconfig === null) {
    log("tsconfig.json not given, skipping")
    return
  }
  if (tsconfigBase === null) {
    log("tsconfigBase.json not given, creating")
    await project.writeFileJson("tsconfigBase.json", {})
    await project.gitFlush("Created tsconfigBase.json")
    return
  }
  return
  if (!tsconfigBase.typeAcquisition) {
    log("tsconfigBase.typeAcquisition not given, skipping")
    return
  }
  delete tsconfigBase.typeAcquisition
  tsconfig.typeAcquisition = {
    enable: true,
  }
  await project.writeFileJson("tsconfig.json", tsconfig)
  await project.writeFileJson("tsconfigBase.json", tsconfigBase)
  await project.gitFlush("Fixed tsconfig for Automatic Type Acquisition in VSCode")
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})