import runForProjects from "lib/runForProjects"

async function job(project) {
}

async function main() {
  await runForProjects(job)
}

main().catch(error => {
  console.error(error)
})