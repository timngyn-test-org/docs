module.exports = {
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

    // need to also check that all the reviewers actually approved

    const reviews = await github.rest.pulls.listReviews({
      owner: ownerLogin,
      repo: name,
      pull_number: number
    });

    console.log('listReviews: ', reviews.data);

    // const trackRequestedReviewsComment = `From Verify Approvals workflow
    
    // Still need approvals from:
    // - 
    // `;

    // github.rest.issues.createComment({
    //   owner: ownerLogin,
    //   repo: name,
    //   issue_number: number,
    //   body: 'test comment from workflow'
    // });
  }
};
