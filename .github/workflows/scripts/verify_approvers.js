module.exports = {
  verifyApprovers: async ({ github, context }) => {
    // Listens for review submissions to update a comment on PR to keep track of who has actually approved
    // against who was originally requested
    // console.log(context);

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

    console.log('context.payload.review.user', context.payload.review.user);
    console.log(
      'context.payload.pull_request.requested_reviewers',
      context.payload.pull_request.requested_reviewers
    );
    console.log(
      'context.payload.pull_request.requested_teams',
      context.payload.pull_request.requested_teams
    );

    // Try to find the comment by the `github-actions[bot]` so we can
    // keep track of who the original list of requested reviewers were.
    // Need to do this because Github API only shows who is currently requested.
    // When a user submits their review (comment, approve, request changes), they are removed
    // from the list of requested reviewers.
    const prComments = await github.paginate(
      github.rest.issues.listComments,
      { owner: ownerLogin, repo: name, issue_number: number },
      (response) =>
        response.data.filter(
          (comment) =>
            comment.user.login === 'github-actions[bot]' &&
            comment.body.startsWith('From Verify Approvals workflow')
        )
    );

    console.log('PR comments from the github bot: ', prComments);

    const latestBotComment = prComments[prComments.length - 1].body;

    const origRequestedReviewers = latestBotComment.str
      .split('\n')
      .filter((text) => text.startsWith('-'))
      .map((text) => text.substring(2));

    const requestedReviewersMap = new Map();

    origRequestedReviewers.forEach((requestedReviewer) => {
      requestedReviewersMap.set(requestedReviewer, '');
    });

    const reviews = await github.paginate(
      github.rest.pulls.listReviews,
      {
        owner: ownerLogin,
        repo: name,
        pull_number: number
      },
      (response) =>
        response.data.map((review) => ({
          userLogin: review.user.login,
          state: review.state,
          submitted_at: review.submitted_at
        }))
    );

    console.log('List of reviews on PR: ', reviews);

    // Go through each list of reviewers chronologically and see if everyone
    // in our requestedReviewersMap is "approved"
    reviews.forEach((review) => {
      // If there are teams, then we need to make another API call to check if that
      // reviewer is in the team or not
      // not sure if this works how it should, but ideally we just keep setting
      // the "review state" to what is found in the list of reviews so that when we're
      // done iterating through the array we can have the current state of reviews:
      // if (requestedReviewersMap.has(review.userLogin)) {
      //   requestedReviewersMap.set(review.userLogin, review.state);
      // }
    });

    // After we have went through the list of reviews
    // go through the object to see if everything is approved
    // If everyone is all approved then we can merge the PR
    // Otherwise we don't merge it.
    // Should we add a comment to let people know that they still need to approve?

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
