module.exports = {
  commentListOfReviewers: () => {},
  verifyApprovers: async ({ github, context }) => {
    // Listens for review submissions to update a comment on PR to keep track of who has actually approved
    // against who was originally requested
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

    console.log(state);
    console.log(login);
    console.log(number);
    console.log(ownerLogin);

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

    

    // need to also check that all the reviewers actually approved

    const reviews = await github.rest.pulls.listReviews({
      owner: ownerLogin,
      repo: name,
      pull_number: number
    });

    console.log('listReviews: ', reviews.data);

    const trackRequestedReviewsComment = `From verify_approvals.yml
    
    Still need approvals from:
    - 
    `;

    github.rest.issues.createComment({
      owner: ownerLogin,
      repo: name,
      issue_number: number,
      body: 'test comment from workflow'
    });
  }
};
