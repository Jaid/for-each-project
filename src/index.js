import runForProjects from "lib/runForProjects"

async function job(project, log) {
  log("hi")
  log("hello")
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})