module.exports = {
  getDeletedFiles: async ({ github, context }) => {
    const {
      issue: { number: issue_number },
      repo: { owner, repo }
    } = context;

    const deletedFiles = await github.paginate(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/files',
      { owner, repo, pull_number: issue_number },
      (response) =>
        response.data
          .filter((file) => file.status === 'removed')
          .filter(
            (file) =>
              file.filename.startsWith('src/fragments') ||
              file.filename.startsWith('src/pages')
          )
    );

    console.log('Deleted file count: ', deletedFiles.length);
    console.log('Deleted files: ', deletedFiles);

    return deletedFiles.length;
  },
  getArtifact: async ({ github, context, fs, artifactName }) => {
    console.log(context);
    var artifacts = await github.actions.listWorkflowRunArtifacts({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: github.event.workflow_run.id
    });
    var matchArtifact = artifacts.data.artifacts.filter((artifact) => {
      return artifact.name == artifactName;
    })[0];
    var download = await github.actions.downloadArtifact({
      owner: context.repo.owner,
      repo: context.repo.repo,
      artifact_id: matchArtifact.id,
      archive_format: 'zip'
    });
    fs.writeFileSync(`${github.workspace}/${artifactName}.zip`, Buffer.from(download.data));
  },
  addRedirectsNeededLabel: async ({ github, context, fs, artifactName }) => {
    var artifactContents = fs.readFileSync(`./${artifactName}.txt`);
    console.log(artifactContents);
  }
};
