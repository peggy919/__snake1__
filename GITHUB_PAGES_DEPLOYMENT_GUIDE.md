# GitHub Pages Deployment Actions Guide (2024-2025)

## Executive Summary

Based on official GitHub Actions repositories, here's the current state of GitHub Pages deployment tools:

| Action | Latest Stable | v4 Status | Recommendation |
|--------|---------------|-----------|-----------------|
| **deploy-pages** | v3 (v3.9+) | ⚠️ Incompatible | Use v3 (stable) |
| **upload-pages-artifact** | v3 | ❌ Not available | Use v3 only |

---

## 1. Latest Versions (2024-2025)

### actions/deploy-pages

- **Latest Stable**: `v3` (v3.9+)
- **Recommended**: `@v3` or specific pinned version like `@v3.9.0`
- **v4 Status**: ⚠️ **Incompatible at this time** - marked in official README with warning

### actions/upload-pages-artifact

- **Latest Version**: `@v3`
- **v4 Status**: ❌ **Not released** - no v4 version exists
- **Default retention**: 1 day
- **Max artifact size**: 10GB (⚠️ 1GB recommended)

---

## 2. v4 Availability

### deploy-pages v4
- **Status**: Released but **INCOMPATIBLE** at this time
- **Marked in README**: "v4: :warning: Incompatible at this time"
- **GHES Compatibility**: v4 is not compatible with GitHub Enterprise Server
- **Reason**: Likely due to API changes or feature dependencies not yet available

### upload-pages-artifact v4
- **Status**: **Not available** - no v4 release exists
- **Use**: Stick with v3

---

## 3. Known Issues with v3 and Fixes

### Issue: "Cannot find any run with github.run_id"
This error typically occurs when:
- **Cause**: The workflow artifact cannot locate the CI/CD run artifacts
- **Solution**: Ensure artifacts are uploaded BEFORE deployment in the same workflow run

### Issue: Artifact not found
- **Cause**: Artifact name mismatch or missing upload step
- **Fix**: Ensure artifact is named `github-pages` (default) or matches the `artifact_name` parameter
- **Error Message**: "No artifacts named 'github-pages' were found for this workflow run. Ensure artifacts are uploaded with actions/upload-artifact@v4 or later."

### Issue: Missing permissions
- **Cause**: Job lacks required permissions
- **Fix**: Add to your job:
  ```yaml
  permissions:
    pages: write      # required to deploy to Pages
    id-token: write   # required for OIDC token verification
  ```

### Issue: OIDC Token Errors
- **Cause**: Missing id-token permission or GitHub Pages not enabled
- **Fix**: Ensure both `pages: write` AND `id-token: write` permissions set

### Issue: Artifact validation failures
- **Cause**: Artifact contains symlinks or hard links
- **Fix**: When using upload-pages-artifact, avoid symlinks/hard links; ensure gzip + tar format

---

## 4. Complete Working Example for GitHub Pages Deployment

### Simple Static Files (Recommended Pattern)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js (if needed)
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build site
        run: npm run build
        
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/  # Change to your build output directory
          retention-days: 1

  deploy:
    needs: build
    
    runs-on: ubuntu-latest
    
    # Add explicit environment setup
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
        # Or use: uses: actions/deploy-pages@v3.9.0  (for pinned version)
```

### With Custom Artifact Name

```yaml
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Build
        run: npm run build
        
      - name: Upload custom artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build
          name: my-custom-pages
          retention-days: 1

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
    
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v3
        with:
          artifact_name: my-custom-pages
```

### With Preview Deployment (Alpha Feature)

```yaml
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
      pull-requests: write  # needed for preview comments
    
    steps:
      - name: Deploy with preview
        id: deployment
        uses: actions/deploy-pages@v3
        with:
          preview: ${{ github.event_name == 'pull_request' }}
```

---

## 5. How to Fix "Cannot find any run with github.run_id"

This error typically occurs in these scenarios:

### Scenario 1: Separate Workflow Files
**Problem**: Upload and deploy in separate workflow files
```yaml
# ❌ WRONG - Won't work
# upload.yml
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist/

# deploy.yml  
- uses: actions/deploy-pages@v3  # Can't find artifact from different run
```

**Solution**: Use single workflow with jobs:
```yaml
# ✅ CORRECT
jobs:
  build:
    steps:
      - uses: actions/upload-pages-artifact@v3
  
  deploy:
    needs: build  # Ensures same run
    steps:
      - uses: actions/deploy-pages@v3
```

### Scenario 2: Missing Environment Configuration
**Problem**: Deploy step doesn't reference github-pages environment
```yaml
# ❌ WRONG
deploy:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/deploy-pages@v3
```

**Solution**: Add environment block:
```yaml
# ✅ CORRECT
deploy:
  runs-on: ubuntu-latest
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - uses: actions/deploy-pages@v3
```

### Scenario 3: OIDC Token Not Retrieved
**Problem**: Missing or incorrect token permissions
```yaml
# ❌ WRONG
permissions:
  pages: write  # Missing id-token: write
```

**Solution**: Include both permissions:
```yaml
# ✅ CORRECT
permissions:
  pages: write
  id-token: write
```

---

## 6. Alternative Recommended Deployment Patterns

### Pattern 1: Using GitHub Pages with Actions (Recommended)
The native pattern using official GitHub Actions:

```yaml
name: Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v3
```

**Pros:**
- Official, maintained by GitHub
- Automatic OIDC token handling
- Built-in branch protection support
- 10-minute timeout with configurable error handling

**Cons:**
- Must use artifact format (gzip + tar)
- Deployment takes ~1-2 minutes

### Pattern 2: Direct Repository Push
Alternative if you can't use artifacts:

```yaml
name: Deploy via Git Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - run: npm run build
      
      - name: Deploy
        run: |
          git config user.name "Deploy Bot"
          git config user.email "bot@example.com"
          git add dist/
          git commit -m "Deploy" || true
          git push
```

**Pros:**
- Simple, no artifacts needed
- Direct control
- Fast

**Cons:**
- Less secure
- No official GitHub Pages integration
- Requires commit access

### Pattern 3: Using External Hosting
Deploy to third-party services instead:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - name: Deploy to Netlify
        run: npx netlify-cli deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Pros:**
- More features (preview deploys, analytics)
- Faster CDN
- Easier debugging

**Cons:**
- External dependency
- Cost may apply
- Need credentials

### Pattern 4: Conditional Deployment (Recommended for Monorepos)

```yaml
jobs:
  check-changes:
    outputs:
      changed: ${{ steps.check.outputs.changed }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: check
        run: |
          if git diff HEAD~1 --name-only | grep -q '^src/'; then
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

  build:
    needs: check-changes
    if: needs.check-changes.outputs.changed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: [check-changes, build]
    if: needs.check-changes.outputs.changed == 'true'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v3
```

---

## 7. Most Current Complete Working Workflow

### Production-Ready Template (v3.9+)

```yaml
name: Build and Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: "pages"
  cancel-in-progress: true

env:
  BUILD_PATH: "."

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
          retention-days: 1

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    permissions:
      pages: write
      id-token: write
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v3
        with:
          timeout: 600000
          error_count: 10
          reporting_interval: 5000

      - name: Comment on PR (if applicable)
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Pages deployment would succeed. Deployment URL: ${{ steps.deployment.outputs.page_url }}'
            })
```

**Features:**
- ✅ Proper concurrency control
- ✅ Caching for faster builds
- ✅ Conditional deployment (only on main push)
- ✅ Proper permissions setup
- ✅ Environment configuration
- ✅ OIDC token handling
- ✅ PR preview comments
- ✅ Timeout configuration

---

## 8. Version Recommendations

### For Most Users: Use v3
```yaml
uses: actions/deploy-pages@v3
uses: actions/upload-pages-artifact@v3
```

### If You Need Pinned Versions: Use v3.9.0+
```yaml
uses: actions/deploy-pages@v3.9.0
uses: actions/upload-pages-artifact@v3
```

### GHES Users: Use v3
- v4 is not compatible with GitHub Enterprise Server
- Stay with v3 which supports GHES 3.9+

### GitHub.com (Public/Private): v3 is fully supported
- v4 deploy-pages exists but marked incompatible
- All features work with v3

---

## 9. Common Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Deployment not found" | OIDC token issue | Check `id-token: write` permission |
| "Cannot find artifact" | Wrong artifact name | Verify `artifact_name` matches uploaded artifact |
| "Deployment failed" | Build output issue | Ensure build path contains valid HTML |
| "Timeout reached" | Deployment taking >10min | Increase `timeout` parameter (max 600000ms) |
| "Permission denied" | Missing Pages environment | Add `environment: github-pages` to deploy job |

---

## References

- [actions/deploy-pages](https://github.com/actions/deploy-pages) - Official repository
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) - Official repository
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Starter Workflows - Pages](https://github.com/actions/starter-workflows/tree/main/pages)

---

**Last Updated**: May 2026  
**Status**: Current for 2024-2025  
**Recommended Action Version**: v3 (v3.9+)
