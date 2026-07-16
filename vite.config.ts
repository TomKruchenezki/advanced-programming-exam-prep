import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GITHUB_ACTIONS and GITHUB_REPOSITORY (format "owner/repo") are set automatically by every
// GitHub Actions run and are never present locally, so this always resolves to '/' for
// dev/build/preview run on this machine, and to '/<repo>/' only when built in CI for a normal
// project repo (a username.github.io user/org page repo is served from '/' instead).
const inGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const repository = process.env.GITHUB_REPOSITORY
const repoName = repository?.split('/')[1]
const isUserOrgPage = repoName?.toLowerCase().endsWith('.github.io') ?? false
const base = inGitHubActions && repoName && !isUserOrgPage ? `/${repoName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
