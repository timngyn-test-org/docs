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

    console.log('context.payload.review.user', context.payload.review.user);
    console.log(
      'context.payload.pull_request.requested_reviewers',
      context.payload.pull_request.requested_reviewers
    );
    console.log(
      'context.payload.pull_request.requested_teams',
      context.payload.pull_request.requested_teams
    );

    // const trackApprovers = octokit
    //   .paginate(
    //     'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
    //     { owner: ownerLogin, repo: name, issue_number: number },
    //     (response) =>
    //       response.data.filter(
    //         (comment) =>
    //           comment.user.login === 'github-actions[bot]' &&
    //           comment.body.startsWith('From Verify Approvals workflow')
    //       )
    //   )
    //   .then((comment) => {
    //     console.log('found comment!!!', comment);

    //     return comment;
    //   });

    const reviews = await github.rest.pulls.listReviews({
      owner: ownerLogin,
      repo: name,
      pull_number: number
    });

    const reviews2 = await github.paginate(github.rest.pulls.listReviews, {
      owner: ownerLogin,
      repo: name,
      pull_number: number
    }, (response) => response.data.map((review) => ({ userLogin: review.user.login, state: review.state, submitted_at: revieww.submitted_at })));

    console.log('listReviews: ', reviews.data);

    console.log('paginate listreviews', reviews2);

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
