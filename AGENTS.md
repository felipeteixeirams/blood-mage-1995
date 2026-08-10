# Agent Instructions & Project Guidelines

## GitHub Repository & Git Integration

When requested by the user to commit and push changes to the remote GitHub repository (`https://github.com/felipeteixeirams/blood-mage-1995.git`), use the personal access token stored in the environment variable `GITHUB_TOKEN_PERSONAL`.

### Git Remote Authentication & Push Workflow:
1. Configure git user identity if not already set:
   ```bash
   git config --global user.name "Felipe Teixeira"
   git config --global user.email "felipeteixeirams@gmail.com"
   ```
2. Set the remote URL with the PAT token authentication:
   ```bash
   git remote set-url origin https://x-access-token:${GITHUB_TOKEN_PERSONAL}@github.com/felipeteixeirams/blood-mage-1995.git
   ```
3. Stage, commit, and push changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message here"
   git push origin master
   ```
