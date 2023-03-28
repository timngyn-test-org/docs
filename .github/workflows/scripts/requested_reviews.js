module.exports = {
  requestedReviewers: async ({github, context}) => {
    console.log(context);

    const {
      payload: {
        pull_request: { number },
        repository: {
          owner: { login: ownerLogin },
          name
        },
        review: {
          state,
          user: { login }
        }
      }
    } = context;

    const reviewers = await github.rest.pulls.listRequestedReviewers({
      owner: ownerLogin,
      repo: name,
      pull_number: number
    });

    const {
      data: { users, teams }
    } = reviewers;

    console.log('listRequestedReviewers users: ', users);
    console.log('listRequestedReviewers teams: ', teams);
  }
};