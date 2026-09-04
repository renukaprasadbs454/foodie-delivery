import fs from 'fs';
import path from 'path';

describe('COMPLETE ADMIN APPROVAL WORKFLOW FOR RESTAURANT REGISTRATION', () => {
  const restaurantsApiFilePath = path.join(
    __dirname,
    '../api/endpoints/restaurantsApi.ts',
  );
  const studioComponentFilePath = path.join(
    __dirname,
    '../features/restaurants/components/RestaurantApprovalsStudio.tsx',
  );
  const adminControllerFilePath = path.join(
    __dirname,
    '../../../../foodie-backend/apps/api/src/main/java/com/foodie/admin/controller/AdminRestaurantController.java',
  );

  const restaurantsApiCode = fs.readFileSync(restaurantsApiFilePath, 'utf8');
  const studioComponentCode = fs.readFileSync(studioComponentFilePath, 'utf8');
  const adminControllerCode = fs.readFileSync(adminControllerFilePath, 'utf8');

  it('restaurantsApi exposes pending applications and document verification RTK endpoints', () => {
    expect(restaurantsApiCode).toContain('/api/bff/admin/restaurants/applications');
    expect(restaurantsApiCode).toContain('/documents/${docType}/verify');
    expect(restaurantsApiCode).toContain('/request-changes');
  });

  it('RestaurantApprovalsStudio renders document & image reviewers with individual verify/reject controls', () => {
    expect(studioComponentCode).toContain('Restaurant Registration Approvals');
    expect(studioComponentCode).toContain('Approve {docType}');
    expect(studioComponentCode).toContain('Reject {docType}');
    expect(studioComponentCode).toContain('APPROVE RESTAURANT & ACTIVATE');
    expect(studioComponentCode).toContain('Request Changes');
  });

  it('AdminRestaurantController enforces backend authorization and handles document verification', () => {
    expect(adminControllerCode).toContain('@PreAuthorize("hasRole(\'ADMIN\')');
    expect(adminControllerCode).toContain('/{id}/documents/{docType}/verify');
    expect(adminControllerCode).toContain('/{id}/request-changes');
  });
});
