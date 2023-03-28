module.exports = {
  requestedReviewers: async ({github, context}) => {
    console.log(context);

    const {
      payload: {
        pull_request: { number },
        repository: {
          owner: { login: ownerLogin },
          name
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

    const teamsArr = teams.map(e => e.slug);
    const teamsText = teamsArr.join('\n- ');

    const usersArr = users.map(e => e.login);
    const usersText = usersArr.join('\n- ')
    

    const trackRequestedReviewsComment = 
`From Verify Approvals workflow

Still need approvals from:`;

    const body =
`${trackRequestedReviewsComment}
    
- ${teamsText}
- ${usersText}`;

    github.rest.issues.createComment({
      owner: ownerLogin,
      repo: name,
      issue_number: number,
      body: body
    });
  }
};