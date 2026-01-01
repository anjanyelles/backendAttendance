# 🚀 Run This Command Now!

Copy and paste this command into your terminal:

```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@switchyard.proxy.rlwy.net:52622/railway" node setup-database.js
```

**Note:** I'm using `DATABASE_PUBLIC_URL` (the public connection string) because you're connecting from your local machine, not from within Railway's network.

---

## What Should Happen

After running the command, you should see:

```
🔌 Connecting to database...
📄 Schema file loaded
🚀 Creating database tables...
✅ Database schema created successfully!

📊 Tables created:
  - employees
  - attendance
  - leave_requests
  - regularization_requests
  - office_settings

✅ Verification: Found 5 tables
   - attendance
   - employees
   - leave_requests
   - office_settings
   - regularization_requests
```

---

## If You Get Connection Errors

If you get connection errors, try using the internal DATABASE_URL instead (but this usually only works from within Railway):

```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway" node setup-database.js
```

---

## After Success

Once the tables are created:
1. Your database is ready! ✅
2. Your Railway backend should work perfectly
3. You can test it by checking the deployment logs

**Run the command now!** 🎉

