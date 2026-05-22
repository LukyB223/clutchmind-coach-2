# GitHub Upload Steps

Because this computer environment does not currently have `git` or `gh` installed, upload through the GitHub website:

1. Go to https://github.com/new
2. Repository name: `clutchmind-coach`
3. Visibility: `Public`
4. Do not add a README, gitignore, or license on GitHub. The project already includes files.
5. Click `Create repository`.
6. Click `uploading an existing file`.
7. Drag all files from this folder into GitHub:
   - `index.html`
   - `riot-review.html`
   - `styles.css`
   - `app.js`
   - `server.js`
   - `README.md`
   - `package.json`
   - `.gitignore`
   - `START_CLUTCHMIND.bat`
   - `start-backend.bat`
   - `start-backend-with-riot-key.bat`
8. Commit the files.
9. Go to `Settings` -> `Pages`.
10. Source: `Deploy from a branch`
11. Branch: `main`
12. Folder: `/root`
13. Save.

Your Riot Product URL should be:

```text
https://YOUR_GITHUB_USERNAME.github.io/clutchmind-coach/riot-review.html
```

Do not upload Riot API keys. This project should not contain any `RGAPI-...` key.
