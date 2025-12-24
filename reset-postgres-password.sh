#!/bin/bash

echo "=== PostgreSQL Password Reset Script ==="
echo ""

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@14
    sleep 2
fi

echo "Choose an option:"
echo "1. Try to connect with empty password"
echo "2. Reset postgres user password (requires stopping PostgreSQL)"
echo "3. Create a new database user with your macOS username"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Trying to connect with empty password..."
        echo "If it works, you can set a password with: ALTER USER postgres WITH PASSWORD 'yourpassword';"
        psql -U postgres -d postgres
        ;;
    2)
        echo ""
        echo "Stopping PostgreSQL..."
        brew services stop postgresql@14
        sleep 1
        
        echo "Starting in single-user mode..."
        echo "When you see 'PostgreSQL stand-alone backend', type:"
        echo "  ALTER USER postgres WITH PASSWORD 'yourpassword';"
        echo "  \q"
        echo ""
        read -p "Press Enter to continue..."
        
        postgres --single -D /opt/homebrew/var/postgresql@14 postgres
        
        echo ""
        echo "Restarting PostgreSQL..."
        brew services start postgresql@14
        echo "Done! You can now use the password you set."
        ;;
    3)
        echo ""
        read -p "Enter password for new user: " newpass
        USERNAME=$(whoami)
        
        echo "Creating user $USERNAME..."
        # Try to connect and create user
        PGPASSWORD="" psql -U postgres -d postgres -c "CREATE USER $USERNAME WITH SUPERUSER PASSWORD '$newpass';" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "User created successfully!"
            echo ""
            echo "Update your .env file with:"
            echo "DB_USER=$USERNAME"
            echo "DB_PASSWORD=$newpass"
        else
            echo "Failed to create user. You may need to reset postgres password first (option 2)."
        fi
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

