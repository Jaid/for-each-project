import chalk from "chalk"
import globby from "globby"
import hasContent from "has-content"
import readableMs from "readable-ms"
import simpleGit from "simple-git/promise.js"

import Project from "./Project.js"

const log = message => {
  process.stdout.write(`${message}\n`)
}

const indentLog = message => {
  log(`${chalk.magenta("╎")} ${chalk.blueBright(message)}`)
}

/**
 * @return {Promise<void>}
 */
export default async job => {
  const dirs = await globby("*", {
    absolute: true,
    cwd: "P:/Git",
    onlyDirectories: true,
  })
  let pullCount = 0
  let okCount = 0
  const errorNames = []
  const dirtyNames = []
  for (const dir of dirs) {
    const time = Date.now()
    const project = new Project(dir)
    await project.init()
    try {
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
        dirtyNames.push(project.folderName)
        continue
      }
      const pulled = await project.pull()
      if (pulled) {
        pullCount++
      }
      await job(project, indentLog)
      await project.gitFlush("Modified in bulk with Jaid/for-each-project")
      log(`Processed ${project.folderName} in ${readableMs(Date.now() - time)}`)
      okCount++
    } catch (error) {
      log(error)
      errorNames.push(project.folderName)
    }
  }
  if (hasContent(errorNames)) {
    log(`${errorNames.length} errored: ${errorNames.join(", ")}`)
  }
  if (hasContent(dirtyNames)) {
    log(`${dirtyNames.length} dirty: ${dirtyNames.join(", ")}`)
  }
  if (pullCount) {
    log(`${pullCount} pulled`)
  }
  if (okCount) {
    log(`${okCount} ok`)
  }
}