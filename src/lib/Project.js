import path from "path"

import fsp from "@absolunet/fsp"
import gitFlush from "git-flush"
import simpleGit from "simple-git/promise"

export default class Project {

  /**
   * @type {string}
   */
  directory = null

  constructor(directory) {
    this.directory = directory
  }

  async init() {
    this.folderName = path.basename(this.directory)
    this.pkg = await this.getFileString("package.json")
  }

  /**
   * @param {Object} pkg
   * @return {Promise<void>}
   */
  async writePkg(pkg) {
    await fsp.outputFile(this.relativeFile("package.json"), JSON.stringify(pkg, null, 2))
  }

  /**
   * @param {string} relativePath
   * @return {Promise<string>}
   */
  async getFileString(relativePath) {
    const file = this.relativeFile(relativePath)
    const exists = await fsp.pathExists(file)
    if (!exists) {
      return null
    }
    const text = await fsp.readFile(file)
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
    await gitFlush(message, {
      pull: true,
      push: true,
      directory: this.directory,
    })
  }

  relativeFile(relativePath) {
    return path.resolve(this.directory, relativePath)
  }

}