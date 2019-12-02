import runForProjects from "lib/runForProjects"

// eslint-disable-next-line no-unused-vars
import text from "./text.txt"

/**
 * @param {import("lib/Project").default} project
 * @param {(string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  const prepar = project.getScript("preparActionJest")
  if (prepar) {
    delete project.pkg.scripts.preparActionJest
    await project.writePkg(project.pkg)
    await project.gitFlush("Removed unneeded script")
  }
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})