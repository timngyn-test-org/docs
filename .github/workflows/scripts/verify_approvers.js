module.exports = {
  verifyApprovers: async ({ github, context, fs, artifactName }) => {
    const {
      payload: {
        pull_request: { number: prNumber },
        repository: {
          owner: { login: ownerLogin },
          name: repoName
        }
      }
    } = context;

    // use GH API to query who has approved
    // Check if this list matches all the names we've found in the artifacts?!
    // If all the approvers have approved then this script can add a "Ready to merge" label!!?
    // I would have to keep reading all the files each time someone approves...?
    // Is there a better way to do this...?

    // in requested reviewers workflow:
    // what if I have another workflow that runs on the completion of requested reviewers?
    // requested reviewers would create a file that has the current list of requested reviewers
    // then when it's finished it calls this new workflow which contains the latest list of
    // requested reviewers? (Don't think this would work because each workflow_run is a new workflow)
    // I would need to keep track of which one is the most "recent" somehow... would having a timestamp
    // in the file name work? or maybe just a number to indicate its revision?

    // should "Requested reviewers" keep building on a file containing all the requested reivewers?
    // it would have the PR number in the name and a revision number at the very end so that we know which is the most up to date
    // basically treating artifacts like a database... is that the right thing to do?

    // reframing question based off of: https://github.com/Automattic/action-required-review
    // what if we don't care who was requested reviewer
    // just look at who approved?
    // if they submit a review check to see if they are supposed to be reviewing by looking at CODEOWNERS?
    // each review submission will recheck all the people who have submitted a review to see
    // if they belong to the correct paths from CODEOWNERS?
    //

    // if someone just submitted a review, was it approve, comment, or needs changes?
    // if it's approve, are they the right person from CODEOWNERS?
    // would have to parse the CODEOWNERS file
    // Find the file path and then check if they are a codeowner?
    // check only on approved reviews

    // getting list of reviews, we can filter by "approved"
    // if someone approved and their review is DISMISSED then github will overwrite their previous approve!
    // don't need to care about who was originally requested because we can just check if the approver is the
    // correct one or not

    // next steps: fetching the codeowners file -> reading it ->
    // next steps v2: see if I can try out their graphql API to see reviewDecision to figure out CODEOWNERS of a PR
    // one other thing to do is just save the list of reviewers that was created by the CODEOWNERS file

    // steps to implement
    // on every review submitted:
    // 1. make GQL request to see reviewDecision
    //

    const gqlQuery = `query ($repo_name: String!, $repo_owner: String!, $pr_number: Int!) {
      repository(name: $repo_name, owner: $repo_owner) {
        pullRequest(number: $pr_number) {
          reviewDecision
          state
        }
      }
    }`;

    const variables = {
      repo_name: repoName,
      repo_owner: ownerLogin,
      pr_number: prNumber
    };

    const result = await github.graphql(query, variables);

    console.log(result);
  }
};
