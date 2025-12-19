import { Octokit } from 'octokit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitHubActionResult {
  success: boolean;
  message: string;
}

/**
 * Fork a repository
 */
export async function forkRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubActionResult> {
  try {
    await octokit.rest.repos.createFork({
      owner,
      repo
    });

    return {
      success: true,
      message: `Successfully forked ${owner}/${repo}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to fork: ${(error as Error).message}`
    };
  }
}

/**
 * Star a repository
 */
export async function starRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubActionResult> {
  try {
    await octokit.rest.activity.starRepoForAuthenticatedUser({
      owner,
      repo
    });

    return {
      success: true,
      message: `⭐ Starred ${owner}/${repo}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to star: ${(error as Error).message}`
    };
  }
}

/**
 * Unstar a repository
 */
export async function unstarRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubActionResult> {
  try {
    await octokit.rest.activity.unstarRepoForAuthenticatedUser({
      owner,
      repo
    });

    return {
      success: true,
      message: `Unstarred ${owner}/${repo}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to unstar: ${(error as Error).message}`
    };
  }
}

/**
 * Watch a repository
 */
export async function watchRepository(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<GitHubActionResult> {
  try {
    await octokit.rest.activity.setRepoSubscription({
      owner,
      repo,
      subscribed: true
    });

    return {
      success: true,
      message: `👁️  Watching ${owner}/${repo}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to watch: ${(error as Error).message}`
    };
  }
}

/**
 * Clone a repository locally
 */
export async function cloneRepository(
  url: string,
  destination?: string
): Promise<GitHubActionResult> {
  try {
    const cloneCmd = destination
      ? `git clone ${url} ${destination}`
      : `git clone ${url}`;

    const { stdout } = await execAsync(cloneCmd);

    return {
      success: true,
      message: `Successfully cloned to ${destination || 'current directory'}\n${stdout}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to clone: ${(error as Error).message}`
    };
  }
}

/**
 * Check if user has starred a repository
 */
export async function checkIfStarred(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await octokit.rest.activity.checkRepoIsStarredByAuthenticatedUser({
      owner,
      repo
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is watching a repository
 */
export async function checkIfWatching(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const { data } = await octokit.rest.activity.getRepoSubscription({
      owner,
      repo
    });
    return data.subscribed;
  } catch {
    return false;
  }
}

/**
 * Get authenticated user info
 */
export async function getAuthenticatedUser(octokit: Octokit): Promise<string | null> {
  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    return data.login;
  } catch {
    return null;
  }
}
