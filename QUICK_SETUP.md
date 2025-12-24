# Quick Setup - Run the App

## You're already in psql! Just run these commands:

```sql
-- 1. Create the database
CREATE DATABASE attendance_db;

-- 2. Connect to it
\c attendance_db

-- 3. Run the schema (copy-paste the entire schema.sql file content)
\i /Users/anjanyelle/Desktop/lltattendance/src/config/schema.sql

-- 4. Verify tables were created
\dt

-- 5. Exit
\q
```

## Then update .env file:

Open `.env` and set your PostgreSQL password:
```
DB_PASSWORD=the_password_you_used_to_connect
```

## Finally, run the app:

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

