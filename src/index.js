/** @module for-each-project */

import simpleGit from "simple-git/promise"

/**
 * @function
 * @param {string} directory Absolute path to a git repository directory
 * @returns {Promise<boolean|null>} `true` if repository is dirty, `false` if repository is clean, `null` if given directory is not a git repository
 * @example
 * import forEachProject from "for-each-project"
 * const result = await forEachProject("/my/path")
 * result === false
 */
export default async directory => {
  const gitRepository = simpleGit(directory)
  const isGitRepository = await gitRepository.checkIsRepo()
  if (!isGitRepository) {
    return null
  }
  const gitStatus = await gitRepository.status()
  const isDirty = gitStatus.files?.length > 0
  return isDirty
}