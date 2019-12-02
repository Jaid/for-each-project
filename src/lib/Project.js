import path from "path"

import fsp from "@absolunet/fsp"
import gitFlush from "git-flush"
import simpleGit from "simple-git/promise"
import chalk from "chalk"
import zahl from "zahl"

const log = message => {
  process.stdout.write(`╎ ${chalk.yellow(message)}\n`)
}

export default class Project {

  /**
   * @type {string}
   */
  directory = null

  /**
   * @type {Object}
   */
  pkg = null

  constructor(directory) {
    this.directory = directory
  }

  async init() {
    this.folderName = path.basename(this.directory)
    this.pkg = await this.readFileJson("package.json")
  }

  /**
   * @param {Object} pkg
   * @return {Promise<void>}
   */
  async writePkg(pkg) {
    await fsp.outputFile(this.relativeFile("package.json"), JSON.stringify(pkg || this.pkg, null, 2))
  }

  /**
   * @param {string} relativePath
   * @return {Promise<string>}
   */
  async readFileText(relativePath) {
    const file = this.relativeFile(relativePath)
    const exists = await fsp.pathExists(file)
    if (!exists) {
      return null
    }
    const text = await fsp.readFile(file, "utf8")
    return text
  }

  /**
   * @param {string} relativePath
   * @return {Promise<string>}
   */
  async readFileJson(relativePath) {
    const file = this.relativeFile(relativePath)
    const exists = await fsp.pathExists(file)
    if (!exists) {
      return null
    }
    const text = await fsp.readJson5(file)
    return text
  }

  /**
   * @return {Promise<boolean>}
   */
  async isGit() {
    const gitRepository = simpleGit(this.directory)
    const isGit = await gitRepository.checkIsRepo()
    return isGit
  }

  /**
   * @return {Promise<boolean>}
   */
  async isDirty() {
    const gitRepository = simpleGit(this.directory)
    const status = await gitRepository.status()
    return !status.isClean()
  }

  /**
   * @param {string} message
   */
  async gitFlush(message) {
    const result = await gitFlush(message, {
      pull: true,
      push: true,
      directory: this.directory,
    })
    if (result) {
      log(`Commit: ${message}`)
    }
  }

  /**
   * @return {Promise<boolean>}
   */
  async pull() {
    const gitRepository = simpleGit(this.directory)
    const result = await gitRepository.pull()
    const hasChanges = Boolean(result.files.length)
    if (hasChanges) {
      log(`Pulled ${zahl(result.files, "file change")}`)
    }
    return hasChanges
  }

  relativeFile(relativePath) {
    return path.resolve(this.directory, relativePath)
  }

  /**
   * @param {string} name
   * @return {string}
   */
  getScript(name) {
    return this.pkg?.scripts?.[name] || null
  }

}