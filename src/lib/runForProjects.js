import globby from "globby"
import readableMs from "readable-ms"
import chalk from "chalk"
import simpleGit from "simple-git/promise"
import {isEmpty} from "has-content"

import Project from "./Project"

const log = message => {
  process.stdout.write(`${message}\n`)
}

const indentLog = message => {
  log(`╎ ${chalk.blueBright(message)}`)
}

/**
 * @return {Promise<Project[]>}
 */
export default async job => {
  const dirs = await globby("*", {
    absolute: true,
    cwd: "E:/Projects",
    onlyDirectories: true,
  })
  for (const dir of dirs) {
    const time = Date.now()
    const project = new Project(dir)
    await project.init()
    const gitRepository = simpleGit(dir)
    log(chalk.magenta(`${project.folderName} `.padEnd(60, "╴")))
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
    await job(project, indentLog)
    log(`Processed ${project.folderName} in ${readableMs(Date.now() - time)}`)
  }
}