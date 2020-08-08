import chalk from "chalk"
import globby from "globby"
import readableMs from "readable-ms"
import simpleGit from "simple-git/promise"

import Project from "./Project"

const log = message => {
  process.stdout.write(`${message}\n`)
}

const indentLog = message => {
  log(`${chalk.magenta("╎")} ${chalk.blueBright(message)}`)
}

/**
 * @return {Promise<Project[]>}
 */
export default async job => {
  const dirs = await globby("*", {
    absolute: true,
    cwd: "P:/",
    onlyDirectories: true,
  })
  for (const dir of dirs) {
    const time = Date.now()
    const project = new Project(dir)
    await project.init()
    log(chalk.magenta(`╭ ${project.folderName} `.padEnd(60, "╴")))
    if (project.folderName === "for-each-project") {
      log(chalk.gray("This is me!"))
      continue
    }
    const gitRepository = simpleGit(dir)
    if (!project.pkg) {
      log(chalk.gray(`${project.folderName} has no pkg`))
      continue
    }
    const isGit = await gitRepository.checkIsRepo()
    if (!isGit) {
      log(chalk.gray(`${project.folderName} is not git`))
      continue
    }
    const status = await gitRepository.status()
    if (!status.isClean()) {
      log(chalk.gray(`${project.folderName} is dirty`))
      continue
    }
    await project.pull()
    await job(project, indentLog)
    await project.gitFlush("Modified in bulk with jaid/for-each-project")
    log(`Processed ${project.folderName} in ${readableMs(Date.now() - time)}`)
  }
}