# PostgreSQL Password Setup Guide

## Option 1: Reset PostgreSQL Password (Recommended)

### Step 1: Stop PostgreSQL
```bash
brew services stop postgresql@14
# OR if using different version:
# brew services stop postgresql
```

### Step 2: Start PostgreSQL in single-user mode
```bash
postgres --single -D /opt/homebrew/var/postgresql@14
# OR if different version:
# postgres --single -D /opt/homebrew/var/postgresql
```

### Step 3: In the postgres prompt, run:
```sql
ALTER USER postgres WITH PASSWORD 'newpassword123';
\q
```

### Step 4: Restart PostgreSQL normally
```bash
brew services start postgresql@14
```

---

## Option 2: Use Your macOS Username (Easier)

If you want to avoid password issues, you can use your macOS username as the database user:

### Step 1: Create a database user with your username
```bash
# First, try to connect (might work without password)
psql -d postgres

# If that works, create a superuser:
CREATE USER anjanyelle WITH SUPERUSER PASSWORD 'your_password';
\q
```

### Step 2: Update your .env file:
```env
DB_USER=anjanyelle
DB_PASSWORD=your_password
```

---

## Option 3: Reset Password via pg_hba.conf (Advanced)

1. Find pg_hba.conf:
```bash
find /opt/homebrew -name pg_hba.conf 2>/dev/null
```

2. Temporarily change authentication method to `trust`:
```
# Change this line:
host    all             all             127.0.0.1/32            scram-sha-256
# To:
host    all             all             127.0.0.1/32            trust
```

3. Restart PostgreSQL:
```bash
brew services restart postgresql@14
```

4. Connect and set password:
```bash
psql -U postgres
ALTER USER postgres WITH PASSWORD 'newpassword123';
\q
```

5. Change pg_hba.conf back to `scram-sha-256` and restart.

---

## Option 4: Quick Test - Try Common Defaults

Sometimes the password might be empty or a common default. Try these:

```bash
# Try empty password (just press Enter)
psql -U postgres

# Try common passwords
PGPASSWORD=postgres psql -U postgres
PGPASSWORD=admin psql -U postgres
PGPASSWORD=password psql -U postgres
```

---

## After Setting Password

Once you have your password, update the `.env` file:

```env
DB_PASSWORD=your_actual_password_here
```

Then test the connection:
```bash
psql -U postgres -d postgres -c "SELECT 1;"
```

