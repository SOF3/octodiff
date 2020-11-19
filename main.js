"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
const rest_1 = require("@octokit/rest");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const ref = process_1.env.GITHUB_REF.split("/");
    const branch = ref[ref.length - 1];
    const newBranch = `octodiff/${branch}`;
    process_1.env.GITHUB_BRANCH = branch;
    process_1.env.OCTODIFF_BRANCH = newBranch;
    const token = core_1.getInput("token");
    const commitMessage = core_1.getInput("commitMessage")
        .replace(/\$([A-Za-z_][A-Za-z0-9_])*/g, (match, p1) => process_1.env[p1]);
    const prTitle = core_1.getInput("prTitle")
        .replace(/\$([A-Za-z_][A-Za-z0-9_])*/g, (match, p1) => process_1.env[p1]);
    const octokit = new rest_1.Octokit({
        auth: token,
        userAgent: "octodiff/1"
    });
    const whoami = (yield octokit.users.getAuthenticated()).data.login;
    const exitCode = yield exec_1.exec("git", ["diff", "--exit-code"]);
    if (exitCode === 0) {
        return;
    }
    const repoFull = process_1.env.GITHUB_REPOSITORY;
    yield exec_1.exec("git", ["checkout", "-b", newBranch]);
    yield exec_1.exec("git", ["add", "-A"]);
    yield exec_1.exec("git", ["-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", commitMessage]);
    yield exec_1.exec("git", ["remote", "add", "octodiff-token", `https://${whoami}:${token}@github.com/${repoFull}`]);
    yield exec_1.exec("git", ["push", "-u", "octodiff-token", newBranch, "--force"]);
    yield octokit.pulls.create({
        owner: repoFull.split("/")[0],
        repo: repoFull.split("/")[1],
        title: prTitle,
        head: newBranch,
        base: branch,
        body: `Triggered by the ${process_1.env.GITHUB_WORKFLOW} workflow`
    });
}))();
