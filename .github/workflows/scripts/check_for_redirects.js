module.exports = {
  addRedirectsNeededLabel: async ({ github, context, fs, artifactName }) => {
    const {
      payload: {
        repository: {
          owner: { login: ownerLogin },
          name: repoName
        }
      }
    } = context;

    const artifactContents = fs
      .readFileSync(`./${artifactName}.txt`)
      .toString();

    const [prNumberStr, numOfDeletedFilesStr] = artifactContents
      .split('\n')
      .map((str) => str.trim());

    console.log('PR number that triggered workflow: ', prNumberStr);
    console.log('Number of deleted files: ', numOfDeletedFilesStr);

    // Regex to check if string is a number
    const validateNumber = /^[0-9]\d*$/;

    if (
      /^[1-9]\d*$/.test(prNumberStr) &&
      /^(0|[1-9]\d*)$/.test(numOfDeletedFilesStr)
    ) {
      const prNumber = Number(prNumberStr);
      const numOfDeletedFiles = Number(numOfDeletedFilesStr);

      if (numOfDeletedFiles > 0) {
        github.rest.issues.addLabels({
          owner: ownerLogin,
          repo: repoName,
          issue_number: prNumber,
          labels: ['redirects-needed']
        });
      }
    }
  }
};
