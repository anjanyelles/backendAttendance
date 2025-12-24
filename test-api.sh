#!/bin/bash

# API Testing Script for Gatnix
# Base URL
BASE_URL="http://localhost:3000"

echo "=== Gatnix API Tests ==="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${BLUE}1. Testing Health Check...${NC}"
curl -s "$BASE_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/health"
echo -e "\n"

# 2. Login
echo -e "${BLUE}2. Logging in as Admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Could not extract token. Make sure login was successful.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained: ${TOKEN:0:50}...${NC}\n"

# 3. Get Office Settings
echo -e "${BLUE}3. Getting Office Settings (Admin)...${NC}"
curl -s -X GET "$BASE_URL/api/admin/office-settings" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || \
curl -s -X GET "$BASE_URL/api/admin/office-settings" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 4. Get All Employees
echo -e "${BLUE}4. Getting All Employees (Admin)...${NC}"
curl -s -X GET "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || \
curl -s -X GET "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

# 5. Create an Employee
echo -e "${BLUE}5. Creating a Test Employee...${NC}"
EMPLOYEE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/employees" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "employee123",
    "role": "EMPLOYEE"
  }')

echo "$EMPLOYEE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EMPLOYEE_RESPONSE"
echo ""

# 6. Login as Employee
echo -e "${BLUE}6. Logging in as Employee...${NC}"
EMP_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"employee123"}')

echo "$EMP_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$EMP_LOGIN"
echo ""

EMP_TOKEN=$(echo "$EMP_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 7. Get My Attendance (as Employee)
echo -e "${BLUE}7. Getting My Attendance (Employee)...${NC}"
curl -s -X GET "$BASE_URL/api/attendance/my" \
  -H "Authorization: Bearer $EMP_TOKEN" | python3 -m json.tool 2>/dev/null || \
curl -s -X GET "$BASE_URL/api/attendance/my" \
  -H "Authorization: Bearer $EMP_TOKEN"
echo -e "\n"

echo -e "${GREEN}✅ API Tests Completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Create more employees/managers via Admin API"
echo "2. Configure office settings (latitude, longitude, IP)"
echo "3. Test punch in/out (requires valid location and IP)"
echo "4. Test leave and regularization workflows"

