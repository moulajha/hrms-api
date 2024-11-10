#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current date and time for commit message
DATETIME=$(date '+%Y-%m-%d %H:%M:%S')

# Get current branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Function to display status
show_status() {
    echo -e "${YELLOW}Current Status:${NC}"
    git status
}

# Show initial status
show_status

# Add all changes
echo -e "${GREEN}Adding all changes...${NC}"
git add .

# Show status after adding
show_status

# Prompt for commit message
echo -e "${YELLOW}Enter commit message (press enter to use default):${NC}"
read commit_message

# If no commit message provided, use default
if [ -z "$commit_message" ]; then
    commit_message="Auto-commit: Updates as of $DATETIME"
fi

# Commit changes
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "$commit_message"

# Push changes
echo -e "${GREEN}Pushing to remote repository...${NC}"
git push origin $BRANCH

echo -e "${GREEN}Done! Changes pushed successfully to $BRANCH branch${NC}"