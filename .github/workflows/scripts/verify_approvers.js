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
    const prComments = await octokit.paginate(
      rest.issues.listComments,
      { owner: ownerLogin, repo: name, issue_number: number },
      (response) =>
        response.data.filter(
          (comment) =>
            comment.user.login === 'github-actions[bot]' &&
            comment.body.startsWith('From Verify Approvals workflow')
        )
    );

    console.log('PR comments from the github bot: ', prComments);

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
