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
    const {
      payload: {
        repository: {
          owner: { login: ownerLogin },
          name: repoName
        },
        workflow_run: {
          id: workflowRunId
        }
      }
    } = context;

    console.log('context: ', context);

    console.log('github: ', github);


    const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
      owner: ownerLogin,
      repo: repoName,
      run_id: workflowRunId
    });


    const matchArtifact = artifacts.data.artifacts.filter((artifact) => {
      return artifact.name == artifactName;
    })[0];


    const download = await github.actions.downloadArtifact({
      owner: ownerLogin,
      repo: repoName,
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
