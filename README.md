# Playwright Link Checker

A small starter project that opens a URL with Playwright and prints its final URL, HTTP status, and page title.

## Requirements

- Node.js 20 or newer
- npm

## Install

```bash
npm install
npx playwright install chromium
```

## Check a URL

Linux/macOS:

```bash
TARGET_URL="https://example.com" npm test
```

PowerShell:

```powershell
$env:TARGET_URL="https://example.com"
npm test
```

The default URL is `https://example.com`. Change `TARGET_URL` to the page you want to test.

## GitHub Actions

The workflow runs automatically on pushes and pull requests to `main`. You can also start it manually from the Actions tab.

> Use this only on websites you are authorized to access. Some sites block automated browsers or require login.
