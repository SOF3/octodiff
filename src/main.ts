import {env} from "process"

import {getInput, info, setFailed} from "@actions/core"
import {exec} from "@actions/exec"
import {Octokit} from "@octokit/rest"

;(async () => {
	const ref = (env.GITHUB_REF as string).split("/")
	const branch = ref[ref.length - 1]
	const newBranch = `octodiff/${branch}`
	env.GITHUB_BRANCH = branch
	env.OCTODIFF_BRANCH = newBranch

	const token = getInput("token")
	const commitMessage = getInput("commitMessage")
		.replace(/\$([A-Za-z_][A-Za-z0-9_])*/g, (match, p1) => env[p1] as string)
	const prTitle = getInput("prTitle")
		.replace(/\$([A-Za-z_][A-Za-z0-9_])*/g, (match, p1) => env[p1] as string)

	const octokit = new Octokit({
		auth: token,
		userAgent: "octodiff/1"
	})
	const whoami = (await octokit.users.getAuthenticated()).data.login

	const exitCode = await exec("git", ["diff", "HEAD", "--exit-code"])
	if(exitCode === 0) {
		info("No files changed. Run `git add` before octodiff if you would like to consider unstaged files in the diff.")
		return
	}

	const repoFull = env.GITHUB_REPOSITORY as string

	await exec("git", ["checkout", "-b", newBranch])
	await exec("git", ["add", "-A"])
	await exec("git", ["-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", commitMessage])
	await exec("git", ["remote", "add", "octodiff-token", `https://${whoami}:${token}@github.com/${repoFull}`])
	await exec("git", ["push", "-u", "octodiff-token", newBranch, "--force"])

	const result = await octokit.pulls.create({
		owner: repoFull.split("/")[0],
		repo: repoFull.split("/")[1],
		title: prTitle,
		head: newBranch,
		base: branch,
		body: `Triggered by the ${env.GITHUB_WORKFLOW} workflow`
	})

	info(`Opened pull request #${result.data.number}: ${result.data.html_url}`)
})()
	.catch(setFailed)
