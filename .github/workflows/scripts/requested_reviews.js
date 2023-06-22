module.exports = {
  getRequestedReviewers: async ({ github, context }) => {
    console.log(context);

    const {
      payload: {
        pull_request: { number },
        repository: {
          owner: { login: ownerLogin },
          name
        },
        organization: { login: orgLogin }
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

    const teamsArr = teams.map((e) => `@${orgLogin}/${e.slug}`);

    const usersArr = users.map((e) => `@${e.login}`);

    return `${teamsArr}\n${usersArr}`;
  }
};
