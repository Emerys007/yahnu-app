import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRoleDashboardHome,
  resolveRolePostLoginDestination,
  resolveRoleDashboardDestination,
  safeAppReturnTo,
  safeDashboardReturnTo,
} from '../../src/lib/auth-navigation.ts';

test('role homes send privileged staff directly to their workspaces', () => {
  assert.equal(getRoleDashboardHome('super_admin'), '/dashboard/admin/overview');
  assert.equal(getRoleDashboardHome('admin'), '/dashboard/admin/overview');
  assert.equal(getRoleDashboardHome('content_manager'), '/dashboard/content');
  assert.equal(getRoleDashboardHome('content_moderator'), '/dashboard/content');
  assert.equal(getRoleDashboardHome('support_staff'), '/dashboard/support/center');
  assert.equal(getRoleDashboardHome('graduate'), '/dashboard');
});

test('dashboard return paths preserve safe query strings and fragments', () => {
  assert.equal(
    safeDashboardReturnTo('/dashboard/admin/user-management?status=pending#results'),
    '/dashboard/admin/user-management?status=pending#results',
  );
  assert.equal(safeDashboardReturnTo('/dashboard'), '/dashboard');
});

test('ordinary sign-in preserves safe public opportunity destinations', () => {
  assert.equal(safeAppReturnTo('/opportunities/developpeur-full-stack'), '/opportunities/developpeur-full-stack');
  assert.equal(safeAppReturnTo('/jobs/abc?source=homepage'), '/jobs/abc?source=homepage');
});

test('dashboard return paths reject external, ambiguous and non-dashboard values', () => {
  const invalidValues = [
    'https://attacker.example/dashboard',
    '//attacker.example/dashboard',
    '/dashboard\\admin',
    '/dashboard/%2f%2fattacker.example',
    '/dashboard/%5cadmin',
    '/dashboard/%0d%0aLocation:evil',
    '/%2e%2e//attacker.example',
    `/${'a'.repeat(2_049)}`,
  ];

  for (const value of invalidValues) {
    assert.equal(safeAppReturnTo(value), null, value);
  }

  assert.equal(safeDashboardReturnTo('/jobs/abc'), null);
});

test('post-login resolution preserves public destinations without weakening dashboard role checks', () => {
  const canAccess = (pathname, role) => (
    pathname === '/dashboard/settings'
    || (pathname.startsWith('/dashboard/admin/') && (role === 'admin' || role === 'super_admin'))
  );

  assert.equal(
    resolveRolePostLoginDestination('graduate', '/opportunities/developpeur-full-stack', canAccess),
    '/opportunities/developpeur-full-stack',
  );
  assert.equal(
    resolveRolePostLoginDestination('graduate', '/jobs/abc', canAccess),
    '/jobs/abc',
  );
  assert.equal(
    resolveRolePostLoginDestination('graduate', '/dashboard/admin/overview', canAccess),
    '/dashboard',
  );
});

test('post-login resolution uses the role home for defaults and denied routes', () => {
  const canAccess = (pathname, role) => (
    pathname === '/dashboard/settings'
    || (pathname.startsWith('/dashboard/admin/') && (role === 'admin' || role === 'super_admin'))
  );

  assert.equal(
    resolveRoleDashboardDestination('super_admin', '/dashboard', canAccess),
    '/dashboard/admin/overview',
  );
  assert.equal(
    resolveRoleDashboardDestination('super_admin', '/dashboard/admin/user-management?status=pending', canAccess),
    '/dashboard/admin/user-management?status=pending',
  );
  assert.equal(
    resolveRoleDashboardDestination('graduate', '/dashboard/admin/overview', canAccess),
    '/dashboard',
  );
  assert.equal(
    resolveRoleDashboardDestination('support_staff', 'https://attacker.example', canAccess),
    '/dashboard/support/center',
  );
});
