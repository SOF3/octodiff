# octodiff
Create a pull request when git diff is dirty.

Let's say we have a tool that modifies our source code a bit,
e.g. a code formatter.
Since the workflow is automatic, we don't want to overwrite the branch.
Instead, the workflow creates a *pull request* if the working directory is dirty,
similar to the dependabot style.

octodiff **only** affects branches starting with `octodiff/`.
Furthermore, octodiff always force-pushes.
Do not name any other branches starting with `octodiff/`
unless you are merging.

## Usage
Put the following step in your action file
after you have performed steps that might modify files:
```yaml
- uses: SOF3/octodiff
  with:
    token: ${{secrets.GH_TOKEN}}
    # commitMessage: "$GITHUB_WORKFLOW for $GITHUB_SHA"
    # prTitle: "$GITHUB_WORKFLOW for $GITHUB_BRANCH"
```

Create a user access token at <https://github.com/settings/tokens>
with the `repo` (or `public_repo`) scope.
Setup the secret `GH_TOKEN` at your repo settings page
(`https://github.com/<user>/<repo>/settings/secrets/actions`)
and pass it to the workflow.

The optional parameters `commitMessage` and `prTitle`
are the templates of commit and pull request titles.
All environment variables available in a workflow are available
(see <https://docs.github.com/en/free-pro-team@latest/actions/reference/environment-variables>),
as well as `GITHUB_BRANCH` and `OCTODIFF_BRANCH`
for the current branch and the branch being used by octodiff.

Note that it does not make sense to use octodiff on tags.

## Note
octodiff uses `git diff HEAD` to check changes in *tracked* files.
To check changes with *new* files,
add `run: git add -A` before the octodiff step.

## Example
### `rustfmt`

```yaml
name: rustfmt
on:
  push:
    branches: "**"
jobs:
  rustfmt:
    runs-on: [ubuntu-20.04]
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
        with:
          components: rustfmt
      - run: cargo fmt
      - uses: SOF3/octodiff@v1
        with:
          token: ${{secrets.GH_TOKEN}}
```

### `black` (python)

```yaml
name: python reformat
on:
  push:
    branches: "**"
jobs:
  black:
    runs-on: [ubuntu-20.04]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: "3.9"
      - run: pip3 install black
      - run: black src
      - uses: SOF3/octodiff@v1
        with:
          token: ${{secrets.GH_TOKEN}}
```
