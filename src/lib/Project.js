import fsp from "@absolunet/fsp"
import chalk from "chalk"
import execa from "execa"
import gitFlush from "git-flush"
import hasContent from "has-content"
import path from "path"
import simpleGit from "simple-git/promise"
import zahl from "zahl"

const log = message => {
  process.stdout.write(`${chalk.magenta("╎")} ${chalk.yellow(message)}\n`)
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
   * @return {Promise<boolean>}
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
    return Boolean(result)
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

  /**
   * @param {string} relativePath
   */
  relativeFile(relativePath) {
    return path.resolve(this.directory, relativePath)
  }

  /**
   * @param {string} relativePath
   * @return {Promise<boolean>}
   */
  async relativeFileExists(relativePath) {
    const exists = await fsp.pathExists(this.relativeFile(relativePath))
    return exists
  }

  /**
   * @param {string} name
   * @return {string}
   */
  getScript(name) {
    return this.pkg?.scripts?.[name] || null
  }

  /**
   * @param {string} relativePath
   * @param {string} text
   * @return {Promise<void>}
   */
  async writeFile(relativePath, text) {
    await fsp.outputFile(this.relativeFile(relativePath), text)
  }

  /**
   * @param {string} file
   * @param {string[]} args
   * @param {import("execa").Options} options
   * @return {Promise<import("execa").ExecaReturnValue<string>>}
   */
  async exec(file, args, options) {
    let command = `cd ${this.directory} && ${file}`
    if (hasContent(args)) {
      command += ` ${args.join(" ")}`
    }
    log(chalk.greenBright(command))
    const result = await execa(file, args, {
      cwd: this.directory,
      ...options,
    })
    return result
  }

  async eslintFix() {
    const eslintScriptFile = this.relativeFile("node_modules/.bin/eslint")
    const eslintScriptFileExists = await fsp.pathExists(eslintScriptFile)
    if (!eslintScriptFileExists) {
      log(`${eslintScriptFile} does not exist, skipping fix`)
      return
    }
    const execResult = await this.exec(eslintScriptFile, ["--fix", this.relativeFile("src")], {
      reject: false,
    })
    log(`= ${execResult.exitCode}`)
    const hasChanged = await this.gitFlush("Formatted code with `eslint --fix`")
    if (hasChanged) {
      await this.eslintFix()
    }
  }

}