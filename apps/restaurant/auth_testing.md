# Emergent Auth Testing Playbook

## Step 1: Create Test User & Session
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Step 3: Browser Testing (Playwright cookie injection)
```
await page.context.add_cookies([{
  "name": "session_token",
  "value": "YOUR_SESSION_TOKEN",
  "domain": "<your-preview-domain>",
  "path": "/",
  "httpOnly": True,
  "secure": True,
  "sameSite": "None"
}]);
```

## Checklist
- User has `user_id` field (custom UUID)
- Session `user_id` matches user's `user_id`
- All queries use `{"_id": 0}` projection
- `/api/auth/me` returns user, not 401
- Callback detection uses `useLocation().hash`
- `session_token` cookie set with `httpOnly, secure, samesite=none`

## Success Indicators
- `/api/auth/me` returns user data
- Dashboard loads without redirect after callback

## Failure Indicators
- 401 Unauthorized responses
- Redirect back to /login after successful Google auth
