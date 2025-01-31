module.exports = {
  getRequstedReviewersArtifact: async ({
    github,
    context,
    fs,
    workspace,
    artifactName,
    prNumber
  }) => {
    const {
      payload: {
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
    // 2. if reviewDecision === 'APPROVED', then get the list of reviewers

    // we actually want to get all the requested reviewers of the CODEOWNERS and then make sure all each group submits at least 1 approval
    // when a PR opens, need to save all those who have been requested?
    // or when we get an approval, we just check if those people are the correct ones? but correct in what way
    // of the approvals do we have all the CODEOWNERS?

    // test cases
    // person edits 1 file
    // at least two codeowners
    //

    // on pr create: save the list of requested reviewers
    // on each approval -> we fetch all approvers that have already approved
    // when we see that every requested reviewer has a approver then it's okay to merge

    // Use Github's GraphQL api to get the `reviewDecision` property: https://docs.github.com/en/graphql/reference/objects#pullrequest
    // It represents the current status of the pull request with respect to code review
    // const gqlQuery = `query ($repo_name: String!, $repo_owner: String!, $pr_number: Int!) {
    //   repository(name: $repo_name, owner: $repo_owner) {
    //     pullRequest(number: $pr_number) {
    //       reviewDecision
    //       state
    //     }
    //   }
    // }`;

    // const variables = {
    //   repo_name: repoName,
    //   repo_owner: ownerLogin,
    //   pr_number: prNumber
    // };

    // const {
    //   repository: {
    //     pullRequest: { reviewDecision }
    //   }
    // } = await github.graphql(gqlQuery, variables);

    // // console.log(result);
    // console.log(reviewDecision);

    // if (reviewDecision === 'APPROVED') {
    //   // Does it make sense to use this property?
    //   // Wha
    // }

    // Get the artifact from the "Requested Reviewers" workflow for the respective PR
    const artifact = (
      await github.paginate(
        github.rest.actions.listArtifactsForRepo,
        {
          owner: ownerLogin,
          repo: repoName
        },
        (response) => response.data
      )
    ).find((artifact) => artifact.name.startsWith(prNumber)); // is `find()` okay to use here?
    // I only create this file on PR open so there shouldn't be any duplicates right?
    // What if someone creates a new workflow and tries to create the same file? 🤔

    console.log(artifact);

    if (artifact && artifact.id) {
      const download = await github.rest.actions.downloadArtifact({
        owner: ownerLogin,
        repo: repoName,
        artifact_id: artifact.id,
        archive_format: 'zip'
      });

      fs.writeFileSync(
        `${workspace}/${prNumber}_${artifactName}.zip`,
        Buffer.from(download.data)
      );
    }
  },
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

    console.log(context);

    const artifactContents = fs
      .readFileSync(`./${artifactName}.txt`)
      .toString();

    const [requestedTeams, requestedUsers] = artifactContents
      .split('\n')
      .map((str) => str.trim());

    const requestedTeamsArr = requestedTeams.split(',');
    const requestedUsersArr = requestedUsers.split(',');

    console.log('teams:', requestedTeamsArr);

    console.log('users', requestedUsersArr);

    // TODO: make a request to get all reviews and filter by only approves
    // then go through each requested reviewer and see if all the approves fit?

    // Get all current approvers
    // This doesn't get the latest approver??
    // does that mean this will only grab the previous approvers
    const approvers = await github.paginate(
      github.rest.pulls.listReviews,
      {
        owner: ownerLogin,
        repo: repoName,
        pull_number: prNumber
      },
      (response) => response.data
    );

    console.log('listreviews:', approvers);

    const test = approvers
      .filter((review) => review.state === 'APPROVED')
      .map((review) => review.user.login);

    console.log('Current approvers:', test);

    // Check if all the requested user reviewers exist in the list of approvers
    const approversSet = new Set(test);
    const correctUserReviews = requestedUsersArr.every((requestedUser) =>
      approversSet.has(requestedUser)
    );

    const isTeamMember = async (team_slug, username) => {
      // Noooo, this request requires a PAT for more elevated scope: `read:org`
      // this scope is not in the GITHUB_TOKEN unfortunately
      const response = await github.rest.teams.getMembershipForUserInOrg({
        // org: 'aws-amplify',
        org: 'timngyn-test-org',
        team_slug,
        username
      });

      console.log(response);
      console.log(response.data);

      if (response.data && response.data.state === 'active') {
        return true;
      }

      return false;
    };

    // Check if all the requested teams have an approver
    // want to go through each team and see if there is a user from the list of approvers that satifies the team
    for (const requestedTeam of requestedTeamsArr) {
      console.log('current requestedTeam:', requestedTeam);
      for (const approver of test) {
        console.log('current approver:', approver);
        const result = await isTeamMember(requestedTeam, approver);
        if (result) {
          console.log(`${approver} is part of the team ${requestedTeam}`);
        } else {
          console.log(`${approver} is NOT part of the team ${requestedTeam}`);
        }
      }
    }

    // WHAT IF I just check to see if there is a requested reviewer who is a team?
    // no wait that doesn't work because if someone from a team reviews but doesn't approve, then
    // the team is "gone"
  }
};
