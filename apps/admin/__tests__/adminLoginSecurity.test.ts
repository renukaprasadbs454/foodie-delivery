import fs from 'fs';
import path from 'path';

describe('CTO REQUIREMENT — REMOVE VISIBLE ADMIN LOGIN CREDENTIALS', () => {
  const loginFormPath = path.join(__dirname, '../features/auth/AdminLoginForm.tsx');
  const sourceCode = fs.readFileSync(loginFormPath, 'utf8');

  it('default initial email and password props are empty strings', () => {
    expect(sourceCode).toContain("initialEmail = ''");
    expect(sourceCode).toContain("initialPassword = ''");
  });

  it('placeholder texts do not expose email or password values', () => {
    expect(sourceCode).toContain('placeholder="Enter admin email"');
    expect(sourceCode).toContain('placeholder="Enter password"');
  });

  it('no hardcoded admin email addresses exist in AdminLoginForm UI component', () => {
    expect(sourceCode).not.toContain('admin@foodie.local');
    expect(sourceCode).not.toContain('Financeadmin@foodie.local');
    expect(sourceCode).not.toContain('opsadmin@foodie.local');
    expect(sourceCode).not.toContain('manager@foodie.local');
    expect(sourceCode).not.toContain('support@foodie.local');
    expect(sourceCode).not.toContain('auditor@foodie.local');
    expect(sourceCode).not.toContain('darkstore@foodie.local');
  });

  it('no preset passwords exist in AdminLoginForm UI component', () => {
    expect(sourceCode).not.toContain('ChangeMe@123');
    expect(sourceCode).not.toContain('FoodieMinister@111');
    expect(sourceCode).not.toContain('FoodieOps@222');
    expect(sourceCode).not.toContain('FoodieManager@333');
    expect(sourceCode).not.toContain('FoodieSupport@444');
    expect(sourceCode).not.toContain('FoodieAuditor@555');
    expect(sourceCode).not.toContain('DarkstoreOps@123');
  });

  it('role selection handler does not populate email or password state', () => {
    expect(sourceCode).not.toContain('setEmail(target.email)');
    expect(sourceCode).not.toContain('setPassword(target.pass)');
  });
});
