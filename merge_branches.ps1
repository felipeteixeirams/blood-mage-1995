# merge_branches.ps1
# Automated merging of a whitelist of remote branches into 'main' with optional test execution and cleanup.
# Run this script from the repository root.

param(
    [string]$TestCommand = ''  # e.g., 'dotnet test' - leave empty to skip tests
)

# Whitelisted branches to merge (exclude 'main')
$whitelist = @(
    'jules-9114446690083402392-bec511d1',
    'sentinel/secure-headers-and-localstorage-4653226317850432416',
    'jules-9885888320136625415-2b3cfd39',
    'feature/resolve-pr-merge-conflicts-16473221725735026719'
)

# Ensure we're in the correct directory
$repoPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $repoPath

Write-Host "Fetching all remote branches..."
git fetch --all

# Get list of remote branches (full refs) excluding symbolic refs such as HEAD -> origin/main
$remoteRefs = git branch -r | ForEach-Object { $_.Trim() } |
    Where-Object { $_ -notmatch '->' }

# Filter to only those that are in the whitelist
$remoteBranches = $remoteRefs | Where-Object {
    $branchName = $_ -replace '^origin/', ''
    $whitelist -contains $branchName
}

if (-not $remoteBranches) {
    Write-Host "No whitelisted remote branches to merge. Exiting."
    exit 0
}

foreach ($remoteBranch in $remoteBranches) {
    $branchName = $remoteBranch -replace '^origin/', ''
    Write-Host "\nProcessing branch: $branchName"

    # Checkout main and ensure it's up‑to‑date
    git checkout main
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to checkout 'main'."; exit 1 }
    git pull origin main
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to pull latest 'main'."; exit 1 }

    # Merge the branch
    Write-Host "Merging $remoteBranch into main..."
    git merge --no-ff $remoteBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Merge conflict detected while merging $branchName. Please resolve manually."
        Write-Host "Instructions are in MERGE_GUIDE.md"
        exit 1
    }

    # Optional test execution
    if ($TestCommand) {
        Write-Host "Running tests: $TestCommand"
        Invoke-Expression $TestCommand
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Tests failed after merging $branchName. Aborting and reverting merge."
            git merge --abort
            exit 1
        }
    }

    # Push the updated main
    git push origin main
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to push 'main'."; exit 1 }

    # Delete the remote branch
    Write-Host "Deleting remote branch $branchName..."
    git push origin --delete $branchName
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to delete remote branch $branchName."; exit 1 }

    Write-Host "Branch $branchName merged and deleted successfully."
}

Write-Host "All whitelisted branches processed."
