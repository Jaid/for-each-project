import fsp from "@absolunet/fsp"
import chalk from "chalk"
import ensureArray from "ensure-array"
import execa from "execa"
import gitFlush from "git-flush"
import got from "got"
import hasContent, {isEmpty} from "has-content"
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
    const file = this.relativeFile("package.json")
    await fsp.outputFile(file, JSON.stringify(pkg || this.pkg, null, 2))
  }

  /**
   * @param {Object} pkg
   * @return {Promise<void>}
   */
  async setPkgValue(field, value) {
    this.pkg[field] = value
    await this.writePkg(this.pkg)
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
   * @return {Promise<Object>}
   */
  async readFileJson(relativePath) {
    const file = this.relativeFile(relativePath)
    const exists = await fsp.pathExists(file)
    if (!exists) {
      return null
    }
    const object = await fsp.readJson5(file)
    return object
  }

  /**
   * @param {string} relativePath
   * @param {Object} object
   * @return {Promise<void>}
   */
  async writeFileJson(relativePath, object) {
    const file = this.relativeFile(relativePath)
    const text = JSON.stringify(object, null, 2)
    await this.writeFile(file, text)
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
  async hasFile(relativePath) {
    const absoluteFile = this.relativeFile(relativePath)
    const exists = await fsp.pathExists(absoluteFile)
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
    const file = this.relativeFile(relativePath)
    await fsp.outputFile(file, text)
    log(`Wrote ${text.length} chars to ${relativePath}`)
  }

  /**
   * @param {string} file
   * @param {string[]} args
   * @param {import("execa").Options} [options]
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

  /**
   * @param {string} file
   * @param {string[]} args
   * @param {import("execa").Options} options
   * @return {Promise<import("execa").ExecaReturnValue<string>>}
   */
  async execVerbose(file, args, options) {
    return this.exec(file, args, {
      stdio: "inherit",
      ...options,
    })
  }

  /**
   * @return {Promise<void>}
   */
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

  /**
   * @return {Promise<void>}
   */
  async upgradeAndRebuildDependencies() {
    await this.npmCheckUpdatesUpgrade()
    await this.emptyDir("node_modules")
    await this.unlink("package-lock.json")
    await this.npmInstall()
  }

  /**
   * @return {Promise<void>}
   */
  async rebuildDependencies() {
    await this.emptyDir("node_modules")
    await this.unlink("package-lock.json")
    await this.npmInstall()
  }

  /**
   * @return {Promise<void>}
   */
  async unlink(file) {
    const hasFile = await this.hasFile(file)
    if (!hasFile) {
      return false
    }
    log(`Deleting ${file}`)
    await fsp.unlink(this.relativeFile(file))
  }

  /**
   * @return {Promise<void>}
   */
  async emptyDir(file) {
    const hasFile = await this.hasFile(file)
    if (!hasFile) {
      return false
    }
    log(`Emptying ${file}`)
    await fsp.emptyDir(this.relativeFile(file))
  }

  /**
   * @return {Promise<void>}
   */
  async npmInstall() {
    await this.exec("npm", ["install"])
  }

  /**
   * @return {Promise<void>}
   */
  async npmCheckUpdatesUpgrade() {
    await this.execVerbose("ncu", ["--upgrade"])
  }

  /**
   * @return {Promise<void>}
   */
  async runTldw() {
    await this.exec("tldw")
  }

  /**
   * @param {string} dependency
   * @param {string|string[]} [dependencyField]
   * @return {boolean}
   */
  hasDependency(dependency, dependencyField) {
    const dependencyFields = dependencyField ? ensureArray(dependencyField) : [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
      "bundleDependencies",
      "bundledDependencies",
    ]
    if (isEmpty(this.pkg)) {
      return false
    }
    for (const key of dependencyFields) {
      if (this.pkg[key]?.[dependency]) {
        return true
      }
    }
    return false
  }

  /**
   * @param {string} dependency
   * @return {boolean}
   */
  hasProductionDependency(dependency) {
    return this.hasDependency(dependency, "dependencies")
  }

  /**
   * @param {string} dependency
   * @return {boolean}
   */
  hasDevelopmentDependency(dependency) {
    return this.hasDependency(dependency, "devDependencies")
  }

  /**
   * @param {string} dependency
   * @return {Promise<void>}
   */
  async uninstallDependency(dependency) {
    await this.exec("npm", ["remove", dependency])
  }

  /**
   * @return {Promise<boolean>}
   */
  async isMineOnNpm() {
    const response = await got(`https://registry.npmjs.org/${this.folderName}`, {
      responseType: "json",
      throwHttpErrors: false,
    })
    if (response.statusCode !== 200) {
      return false
    }
    const maintainers = response.body.maintainers
    if (!Array.isArray(maintainers)) {
      return false
    }
    const me = maintainers.find(maintainer => maintainer.name.toLowerCase() === "jaid")
    return Boolean(me)
  }

}