import * as githubService from '../services/githubService.js'
import dotenv from 'dotenv'

dotenv.config()

const OWNER = process.env.GITHUB_OWNER

/**
 * GET /api/github/user
 */
export async function getUser(req, res) {
  try {
    const user = await githubService.getUserProfile()
    return res.json(user)
  } catch (err) {
    console.error('[GitHub User Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch user profile', details: err.message })
  }
}

/**
 * POST /api/github/commit
 * Body: { message, repo }
 */
export async function commitChanges(req, res) {
  try {
    const { message, repo } = req.body
    const result = await githubService.commitAndPush({ message, repo })
    return res.json(result)
  } catch (err) {
    console.error('[GitHub Commit Error]', err.message)
    return res.status(500).json({ error: 'Failed to commit changes', details: err.message })
  }
}

/**
 * GET /api/github/repositories
 */
export async function listRepositories(req, res) {
  try {
    const repos = await githubService.getRepositories()
    return res.json(repos)
  } catch (err) {
    console.error('[GitHub Repos Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch repositories', details: err.message })
  }
}

/**
 * GET /api/github/prs/:repo
 */
export async function listPullRequests(req, res) {
  try {
    const { repo } = req.params
    const owner = req.query.owner || OWNER
    const prs = await githubService.getPullRequests(owner, repo)
    return res.json(prs)
  } catch (err) {
    console.error('[GitHub PRs Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch PRs', details: err.message })
  }
}

/**
 * GET /api/github/prs/:repo/:number/diff
 */
export async function getPRDiff(req, res) {
  try {
    const { repo, number } = req.params
    const owner = req.query.owner || OWNER
    const diff = await githubService.getPRDiff(owner, repo, number)
    return res.json({ diff })
  } catch (err) {
    console.error('[GitHub Diff Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch PR diff', details: err.message })
  }
}

/**
 * GET /api/github/file/:repo?path=...
 */
export async function getFile(req, res) {
  try {
    const { repo } = req.params
    const { path, ref = 'main', owner } = req.query
    if (!path) return res.status(400).json({ error: 'path query param is required' })
    const file = await githubService.getFileContent(owner || OWNER, repo, path, ref)
    return res.json(file)
  } catch (err) {
    console.error('[GitHub File Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch file', details: err.message })
  }
}

/**
 * POST /api/github/create-pr
 */
export async function createPR(req, res) {
  try {
    const { repo, title, body, head, base, owner } = req.body
    if (!repo || !title || !head) {
      return res.status(400).json({ error: 'repo, title, and head are required' })
    }
    const pr = await githubService.createPullRequest(owner || OWNER, repo, { title, body, head, base })
    return res.json(pr)
  } catch (err) {
    console.error('[GitHub Create PR Error]', err.message)
    return res.status(500).json({ error: 'Failed to create PR', details: err.message })
  }
}

/**
 * GET /api/github/commits/:repo
 */
export async function listCommits(req, res) {
  try {
    const { repo } = req.params
    const { branch = 'main', owner } = req.query
    const commits = await githubService.getCommits(owner || OWNER, repo, branch)
    return res.json(commits)
  } catch (err) {
    console.error('[GitHub Commits Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch commits', details: err.message })
  }
}

/**
 * GET /api/github/issues/:repo
 */
export async function listIssues(req, res) {
  try {
    const { repo } = req.params
    const { state = 'open', owner } = req.query
    const issues = await githubService.getIssues(owner || OWNER, repo, state)
    return res.json(issues)
  } catch (err) {
    console.error('[GitHub Issues Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch issues', details: err.message })
  }
}

/**
 * POST /api/github/issues/:repo
 */
export async function createIssue(req, res) {
  try {
    const { repo } = req.params
    const { title, body, labels, owner } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const issue = await githubService.createIssue(owner || OWNER, repo, { title, body, labels })
    return res.status(201).json(issue)
  } catch (err) {
    console.error('[GitHub Create Issue Error]', err.message)
    return res.status(500).json({ error: 'Failed to create issue', details: err.message })
  }
}

/**
 * GET /api/github/tree/:repo
 */
export async function getRepoTree(req, res) {
  try {
    const { repo } = req.params
    const { branch = 'main', owner } = req.query
    const tree = await githubService.getRepoTree(owner || OWNER, repo, branch)
    return res.json(tree)
  } catch (err) {
    console.error('[GitHub Tree Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch repo tree', details: err.message })
  }
}

/**
 * GET /api/github/repository/:repo
 */
export async function getRepoDetails(req, res) {
  try {
    const { repo } = req.params
    const { owner } = req.query
    const repoData = await githubService.getRepository(owner || OWNER, repo)
    return res.json(repoData)
  } catch (err) {
    console.error('[GitHub Repo Details Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch repo details', details: err.message })
  }
}

/**
 * POST /api/github/import-repo
 * Body: { url, name, description }
 */
export async function importRepo(req, res) {
  try {
    const url = req.body.url || req.body.repoUrl
    const { name, description, owner } = req.body
    if (!url && !name) {
      return res.status(400).json({ error: 'Repository URL or Name is required' })
    }
    const imported = await githubService.importRepository({
      url,
      name,
      description,
      owner: owner || OWNER,
    })
    return res.status(201).json(imported)
  } catch (err) {
    console.error('[GitHub Import Repo Error]', err.message)
    return res.status(500).json({ error: 'Failed to import repository', details: err.message })
  }
}

/**
 * GET /api/github/insights/:repo
 */
export async function getRepoInsights(req, res) {
  try {
    const { repo } = req.params
    const { owner } = req.query
    const insights = await githubService.getRepositoryInsights(owner || OWNER, repo)
    return res.json(insights)
  } catch (err) {
    console.error('[GitHub Insights Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch repository insights', details: err.message })
  }
}

