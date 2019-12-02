import runForProjects from "lib/runForProjects"

/**
 * @param {import("lib/Project").default} project
 * @param {(string) => void} log
 * @return {Promise<void>}
 */
async function job(project, log) {
  if (!project.pkg) {
    return
  }
  const prepar = project.getScript("preparActionJest")
  if (prepar) {
    log("HELP")
  }
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})