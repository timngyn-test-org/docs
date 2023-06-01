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
  }
};
