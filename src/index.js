/* eslint-disable no-unused-vars */

import runForProjects from "lib/runForProjects"
import octokit from "lib/octokit"

import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  const githubRepo = await octokit.repos.get({
    owner: "Jaid",
    repo: project.folderName,
  })
  if (!githubRepo) {
    return
  }
  if (!githubRepo.data.description) {
    return
  }
  if (project.pkg.description === githubRepo.data.description) {
    log("Description already uptodate")
    return
  }
  project.pkg.description = githubRepo.data.description
  await project.writePkg()
  await project.gitFlush("Added description to pkg")
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})