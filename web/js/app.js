// Login check + the page frame (top bar for reporters, sidebar for staff).
// Every logged-in page starts with:   const user = await startPage({ roles: ['admin'] })
// Owner: Jan Russel
import { api, clearSession, getSavedUser, getToken, saveSession } from './api.js'
import { APP_NAME } from './config.js'
import { $, esc } from './ui.js'

/** Where each role lands after logging in. */
export const homeFor = (role) => ({ admin: 'admin.html', officer: 'officer.html' })[role] || 'home.html'

const BRAND_SVG = `<svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true"><rect x="10" y="10" width="44" height="44" rx="6" transform="rotate(45 32 32)" fill="#F2B705" stroke="#23272B" stroke-width="4"/><rect x="29" y="18" width="6" height="18" rx="3" fill="#23272B"/><circle cx="32" cy="43" r="3.5" fill="#23272B"/></svg>`
export const brand = (light = false) => `<span class="brand ${light ? 'brand-light' : ''}">${BRAND_SVG}<span>${APP_NAME}</span></span>`

const REPORTER_LINKS = [
  ['home.html', 'Home'],
  ['my-reports.html', 'My reports'],
  ['notifications.html', 'Notifications'],
  ['account.html', 'Account'],
]
const ADMIN_LINKS = [
  ['admin.html', 'Dashboard'],
  ['admin-reports.html', 'Accident reports'],
  ['admin-summaries.html', 'Summaries and export'],
  ['admin-users.html', 'Users'],
  ['admin-settings.html', 'Categories and settings'],
  ['admin-audit.html', 'Audit trail'],
  ['notifications.html', 'Notifications'],
  ['account.html', 'My account'],
]
const OFFICER_LINKS = [
  ['officer.html', 'Assigned reports'],
  ['notifications.html', 'Notifications'],
  ['account.html', 'My account'],
]

export async function logout() {
  try {
    await api('/auth/logout.php', { method: 'POST' })
  } catch {
    /* token may already be expired */
  }
  clearSession()
  location.href = 'login.html'
}

function goLogin() {
  const next = location.pathname.split('/').pop() + location.search
  location.replace('login.html?next=' + encodeURIComponent(next))
}

/**
 * Check the login, draw the frame around <main id="page">, and return the user.
 * roles: who may open the page (omit = any logged-in user).
 * active: which menu link to highlight (default: this file).
 */
export async function startPage({ roles, active } = {}) {
  let user = getSavedUser()
  if (!getToken() || !user) {
    goLogin()
    return new Promise(() => {}) // stop the page script here
  }
  if (roles && !roles.includes(user.role)) {
    location.replace(homeFor(user.role))
    return new Promise(() => {})
  }
  window.addEventListener('auth:expired', goLogin)

  // Refresh the saved user in the background (role or name may have changed)
  api('/auth/me.php')
    .then((fresh) => {
      saveSession(null, fresh)
      if (fresh.role !== user.role) location.replace(homeFor(fresh.role))
      document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = fresh.full_name))
    })
    .catch(() => {})

  drawFrame(user, active || location.pathname.split('/').pop() || homeFor(user.role))
  refreshUnread()
  return user
}

function drawFrame(user, active) {
  const page = $('#page')
  const isReporter = user.role === 'reporter'
  const links = isReporter ? REPORTER_LINKS : user.role === 'admin' ? ADMIN_LINKS : OFFICER_LINKS
  const nav = links
    .map(([href, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" ${href === active ? 'aria-current="page"' : ''}>${label}${href === 'notifications.html' ? '<span class="count-pill d-none" data-unread></span>' : ''}</a>`)
    .join('')

  const shell = document.createElement('div')
  if (isReporter) {
    shell.className = 'reporter-shell'
    shell.innerHTML = `
      <a class="skip-link" href="#page">Skip to content</a>
      <header class="topbar">
        <div class="container topbar-inner">
          <a href="home.html" class="text-decoration-none">${brand(true)}</a>
          <nav class="topnav" aria-label="Main">${nav}</nav>
          <div class="d-flex align-items-center gap-3">
            <span class="small text-white-50 d-none d-md-inline" data-user-name>${esc(user.full_name)}</span>
            <button class="btn btn-sm btn-outline-light" data-logout>Log out</button>
          </div>
        </div>
        <div class="lane-line" aria-hidden="true"></div>
      </header>`
    page.classList.add('container', 'py-4')
  } else {
    shell.className = 'staff-shell'
    shell.innerHTML = `
      <a class="skip-link" href="#page">Skip to content</a>
      <aside class="sidebar">
        <div class="px-3 pt-3 pb-4">
          <a href="${homeFor(user.role)}" class="text-decoration-none">${brand(true)}</a>
          <div class="small text-white-50 mt-2">${user.role === 'admin' ? 'Administrator' : 'Traffic officer'}</div>
        </div>
        <nav class="side-nav" aria-label="Main">${nav}</nav>
        <div class="sidebar-foot">
          <div class="small text-white mb-2 text-truncate" data-user-name>${esc(user.full_name)}</div>
          <button class="btn btn-sm btn-outline-light w-100" data-logout>Log out</button>
        </div>
      </aside>`
    page.classList.add('staff-main')
  }
  page.parentNode.insertBefore(shell, page)
  shell.append(page)
  page.hidden = false
  page.tabIndex = -1
  shell.querySelector('[data-logout]').addEventListener('click', logout)
}

/** Unread notification count in the menu. Pages can call it again after marking items read. */
export async function refreshUnread() {
  try {
    const d = await api('/notifications/list.php', { query: { unread: 1 } })
    document.querySelectorAll('[data-unread]').forEach((el) => {
      el.textContent = d.unread_count
      el.classList.toggle('d-none', !d.unread_count)
    })
  } catch {
    /* not important */
  }
}

/** For login, register and the landing page: skip them if already logged in. */
export function redirectIfLoggedIn() {
  const user = getSavedUser()
  if (getToken() && user) {
    location.replace(homeFor(user.role))
    return true
  }
  return false
}
