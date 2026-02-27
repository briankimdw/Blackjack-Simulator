# Push this project to Git

Git wasn’t found on your machine. Do this once Git is installed:

## 1. Install Git (if needed)

- Download: https://git-scm.com/download/win  
- Run the installer and restart your terminal (or Cursor).

## 2. Create a remote repo

- On **GitHub**: https://github.com/new  
- On **GitLab**: https://gitlab.com/projects/new  
- Create a new repo (e.g. `blackjack-simulator`). Don’t add a README if the site offers that option.

## 3. In this project folder, run:

```powershell
cd "c:\Users\Brian\Pictures\Blackjack Simulator"

git init
git add .
git commit -m "Initial commit: Blackjack card counting simulator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub (or GitLab) username and repo name.  
If you use SSH instead of HTTPS, use the SSH URL (e.g. `git@github.com:USER/REPO.git`) for `git remote add origin`.
