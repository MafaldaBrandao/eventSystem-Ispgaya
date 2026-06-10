#!/bin/bash
# Test script for new soft-delete endpoints

BASE_URL="http://localhost:8000/api"
TOKEN="your-token-here"  # Replace with actual token

echo "Testing soft-delete endpoints..."

# Test Club deactivate
echo -e "\n1. Testing Club deactivate..."
curl -X POST "$BASE_URL/clubs/admin/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Club activate
echo -e "\n2. Testing Club activate..."
curl -X POST "$BASE_URL/clubs/admin/1/activate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Event deactivate
echo -e "\n3. Testing Event deactivate..."
curl -X POST "$BASE_URL/events/admin/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Event activate
echo -e "\n4. Testing Event activate..."
curl -X POST "$BASE_URL/events/admin/1/activate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test News deactivate
echo -e "\n5. Testing News deactivate..."
curl -X POST "$BASE_URL/news/admin/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test News activate
echo -e "\n6. Testing News activate..."
curl -X POST "$BASE_URL/news/admin/1/activate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Book deactivate
echo -e "\n7. Testing Book deactivate..."
curl -X POST "$BASE_URL/books/admin/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Book activate
echo -e "\n8. Testing Book activate..."
curl -X POST "$BASE_URL/books/admin/1/activate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Session deactivate
echo -e "\n9. Testing Session deactivate..."
curl -X POST "$BASE_URL/sessions/admin/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Session activate
echo -e "\n10. Testing Session activate..."
curl -X POST "$BASE_URL/sessions/admin/1/activate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test Club member deactivate
echo -e "\n11. Testing Club member deactivate..."
curl -X POST "$BASE_URL/clubs/admin/1/members/1/deactivate/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\nTests completed!"
