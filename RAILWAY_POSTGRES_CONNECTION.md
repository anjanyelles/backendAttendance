# 🔗 How to Connect PostgreSQL to Your Backend (Railway)

Based on Railway's connection instructions, follow these exact steps:

## Step-by-Step Connection

### 1. Find Your PostgreSQL Service Name
- Look at your PostgreSQL service in Railway
- Note the service name (e.g., "Postgres", "PostgreSQL", or whatever you named it)

### 2. Go to Your Backend Service
- Click on your **backend service** (the one running your Node.js code)
- Go to the **"Variables"** tab

### 3. Create the DATABASE_URL Variable
- Click **"New Variable"** button
- **Variable Name:** `DATABASE_URL`
- **Variable Value:** `${{ Postgres.DATABASE_URL }}`
  - ⚠️ **Important:** Replace `Postgres` with your actual PostgreSQL service name!
  - For example, if your service is named "PostgreSQL", use: `${{ PostgreSQL.DATABASE_URL }}`
- Click **"Add"** or **"Save"**

### 4. Verify
- You should see `DATABASE_URL` in your variables list
- The value should show as `${{ Postgres.DATABASE_URL }}` (or your service name)
- Railway will automatically replace this with the actual connection string when your app runs

---

## Example

If your PostgreSQL service is named **"Postgres"**:
```
Variable Name: DATABASE_URL
Variable Value: ${{ Postgres.DATABASE_URL }}
```

If your PostgreSQL service is named **"PostgreSQL"**:
```
Variable Name: DATABASE_URL
Variable Value: ${{ PostgreSQL.DATABASE_URL }}
```

If your PostgreSQL service is named **"MyDatabase"**:
```
Variable Name: DATABASE_URL
Variable Value: ${{ MyDatabase.DATABASE_URL }}
```

---

## How It Works

- Railway uses the `${{ ServiceName.VARIABLE }}` syntax to reference variables from other services
- When your app starts, Railway automatically replaces `${{ Postgres.DATABASE_URL }}` with the actual PostgreSQL connection string
- Your code in `src/config/database.js` will automatically detect and use `DATABASE_URL`

---

## Troubleshooting

### ❌ Variable not working?
- Make sure the service name matches exactly (case-sensitive)
- Check that your PostgreSQL service is running
- Verify the variable name is exactly `DATABASE_URL` (all caps)

### ❌ Still getting database errors?
- Check the deployment logs to see if `DATABASE_URL` is being set
- Verify the PostgreSQL service is active
- Make sure you've run the database schema (see Step 6 in DEPLOYMENT_GUIDE.md)

---

**That's it!** Once you add this variable, your backend will automatically connect to PostgreSQL. 🎉

