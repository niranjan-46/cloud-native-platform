# HireLink API Documentation

## Table of Contents
- [Authentication](#authentication)
- [User Management](#user-management)
- [Profile Management](#profile-management)
- [Education Management](#education-management)
- [Experience Management](#experience-management)
- [Document Management](#document-management)
- [Error Responses](#error-responses)
- [Postman Collection](#postman-collection)

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Google Login
```http
POST /api/auth/google-login/
```
**Request Body**
```json
{
    "token": "google_oauth_token"
}
```
**Response (200 OK)**
```json
{
    "refresh": "jwt_refresh_token",
    "access": "jwt_access_token",
    "user_type": "candidate"
}
```

#### Password Reset Request
```http
POST /api/auth/request-reset-password/
```
**Request Body**
```json
{
    "email": "user@example.com"
}
```

#### Password Reset
```http
POST /api/auth/reset-password/<uidb64>/<token>/
```
**Request Body**
```json
{
    "password": "new_password"
}
```

#### Email OTP Verification
```http
POST /api/send-otp/
```
**Request Body**
```json
{
    "email": "user@example.com"
}
```

```http
POST /api/verify-otp/
```
**Request Body**
```json
{
    "email": "user@example.com",
    "otp": "123456"
}
```

## User Management

### Update User Information
```http
PUT /api/update-user/
```
**Request Body**
```json
{
    "name": "John Doe",
    "phone": "1234567890"
}
```
**Response (200 OK)**
```json
{
    "status": "success",
    "message": "User information updated successfully",
    "data": {
        "name": "John Doe",
        "phone": "1234567890"
    }
}
```

## Profile Management

### Get User Profile
```http
GET /api/get/profile/
```
**Response (200 OK)**
```json
{
    "user": {
        "id": 1,
        "email": "user@example.com",
        "name": "John Doe",
        "phone": "1234567890",
        "user_type": "candidate"
    },
    "profile": {
        // Profile data based on user type
    },
    "education": [
        // Education records
    ],
    "experience": [
        // Experience records
    ]
}
```

### Update Profile Image
```http
POST /api/update-profile-image/
```
**Request Body (multipart/form-data)**
```
profile_image: <file>
```
**Response (200 OK)**
```json
{
    "profile_image": "https://cloudinary.com/image_url"
}
```

### Update Employer Profile
```http
PATCH /api/employer/profile/
```
**Request Body**
```json
{
    "company_name": "Tech Corp",
    "designation": "HR Manager",
    "industry": "Technology",
    "company_size": "50-100",
    "company_address": "123 Tech Street",
    "website_url": "https://techcorp.com",
    "phone_number": "1234567890"
}
```

### Update Consultancy Profile
```http
PATCH /api/consultancy/profile/
```
**Request Body**
```json
{
    "consultancy_name": "Tech Recruiters",
    "specialization": "IT Recruitment",
    "experience_years": 5,
    "office_address": "456 Recruit Street",
    "website": "https://techrecruiters.com",
    "consultancy_size": "10-50",
    "phone_number": "1234567890"
}
```

### Update Candidate Profile
```http
PATCH /api/candidate/profile/
```
**Request Body**
```json
{
    "skills": "Python, Django, React",
    "portfolio_website": "https://portfolio.com",
    "gender": "Male",
    "city": "New York",
    "preferenced_city": "New York, San Francisco",
    "bio": "Full-stack developer",
    "about": "Experienced developer with 5 years of experience"
}
```

## Education Management

### List All Education Records
```http
GET /api/educations/
```
**Response (200 OK)**
```json
[
    {
        "id": 1,
        "education_type": "bachelors",
        "school_name": "University of Example",
        "degree": "Bachelor of Science",
        "field_of_study": "Computer Science",
        "start_date": "2018-09-01",
        "end_date": "2022-05-15",
        "grade": "3.8",
        "created_at": "2024-03-06T10:00:00Z",
        "updated_at": "2024-03-06T10:00:00Z"
    }
]
```

### Create Education Record
```http
POST /api/educations/
```
**Request Body**
```json
{
    "education_type": "bachelors",
    "school_name": "University of Example",
    "degree": "Bachelor of Science",
    "field_of_study": "Computer Science",
    "start_date": "2018-09-01",
    "end_date": "2022-05-15",
    "grade": "3.8"
}
```

### Get Specific Education Record
```http
GET /api/educations/{id}/
```

### Update Education Record
```http
PATCH /api/educations/{id}/
```
**Request Body**
```json
{
    "grade": "3.9",
    "end_date": "2022-06-15"
}
```

### Delete Education Record
```http
DELETE /api/educations/{id}/
```

## Experience Management

### List All Experience Records
```http
GET /api/experiences/
```
**Response (200 OK)**
```json
[
    {
        "id": 1,
        "company_name": "Tech Corp",
        "designation": "Software Engineer",
        "job_type": "Full-time",
        "location": "New York",
        "currently_working": true,
        "job_description": "Developed and maintained web applications",
        "start_date": "2022-06-01",
        "end_date": null,
        "created_at": "2024-03-06T10:00:00Z",
        "updated_at": "2024-03-06T10:00:00Z"
    }
]
```

### Create Experience Record
```http
POST /api/experiences/
```
**Request Body**
```json
{
    "company_name": "Tech Corp",
    "designation": "Software Engineer",
    "job_type": "Full-time",
    "location": "New York",
    "currently_working": true,
    "job_description": "Developed and maintained web applications",
    "start_date": "2022-06-01",
    "end_date": null
}
```

### Get Specific Experience Record
```http
GET /api/experiences/{id}/
```

### Update Experience Record
```http
PATCH /api/experiences/{id}/
```
**Request Body**
```json
{
    "designation": "Senior Software Engineer",
    "job_description": "Lead developer for web applications"
}
```

### Delete Experience Record
```http
DELETE /api/experiences/{id}/
```

## Document Management

### Upload Documents
```http
POST /api/upload-documents/
```
**Request Body (multipart/form-data)**
```
For Employer/Consultancy:
- msme_or_incorporation_certificate: <file>
- gstin_certificate: <file>
- pan_card: <file>
- poc_document: <file>

For Candidate:
- resume: <file>
```

### Get Application Status
```http
POST /api/get-application-status/
```
**Request Body**
```json
{
    "email": "user@example.com"
}
```
**Response (200 OK)**
```json
{
    "email": "user@example.com",
    "user_type": "employer",
    "application_status": "verifying"
}
```

## Field Descriptions

### Education Fields
- `education_type`: One of ['primary', 'secondary', 'higher_secondary', 'bachelors', 'masters', 'phd', 'other']
- `school_name`: Name of the educational institution
- `degree`: Degree or qualification earned
- `field_of_study`: Major or specialization
- `start_date`: Start date of education (YYYY-MM-DD)
- `end_date`: End date of education (YYYY-MM-DD)
- `grade`: Grade or GPA achieved

### Experience Fields
- `company_name`: Name of the company
- `designation`: Job title or position
- `job_type`: Type of employment (e.g., 'Full-time', 'Part-time', 'Contract')
- `location`: Work location
- `currently_working`: Boolean indicating if currently employed
- `job_description`: Description of responsibilities and achievements
- `start_date`: Start date of employment (YYYY-MM-DD)
- `end_date`: End date of employment (YYYY-MM-DD), null if currently working

## Error Responses

### 400 Bad Request
```json
{
    "error": "Invalid data provided"
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

## Postman Collection

You can import the following collection into Postman:

```json
{
  "info": {
    "name": "HireLink API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Google Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/google-login/",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"token\": \"google_oauth_token\"\n}"
            }
          }
        },
        {
          "name": "Request Password Reset",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/request-reset-password/",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"email\": \"user@example.com\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Profile",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/get/profile/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Update Profile Image",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/update-profile-image/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "profile_image",
                  "type": "file",
                  "src": "/path/to/image.jpg"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Education",
      "item": [
        {
          "name": "List Education",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/educations/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Create Education",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/educations/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"education_type\": \"bachelors\",\n    \"school_name\": \"University of Example\",\n    \"degree\": \"Bachelor of Science\",\n    \"field_of_study\": \"Computer Science\",\n    \"start_date\": \"2018-09-01\",\n    \"end_date\": \"2022-05-15\",\n    \"grade\": \"3.8\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Experience",
      "item": [
        {
          "name": "List Experience",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/experiences/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Create Experience",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/experiences/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"company_name\": \"Tech Corp\",\n    \"designation\": \"Software Engineer\",\n    \"job_type\": \"Full-time\",\n    \"location\": \"New York\",\n    \"currently_working\": true,\n    \"job_description\": \"Developed and maintained web applications\",\n    \"start_date\": \"2022-06-01\",\n    \"end_date\": null\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "your_jwt_token_here",
      "type": "string"
    }
  ]
}
```

## Postman Ready Files

### Collection File
Save the following content as `hirelink-api-collection.json`:

```json
{
  "info": {
    "name": "HireLink API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Google Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/google-login/",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"token\": \"google_oauth_token\"\n}"
            }
          }
        },
        {
          "name": "Request Password Reset",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/request-reset-password/",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"email\": \"user@example.com\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Profile",
      "item": [
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/get/profile/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Update Profile Image",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/update-profile-image/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "profile_image",
                  "type": "file",
                  "src": "/path/to/image.jpg"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Education",
      "item": [
        {
          "name": "List Education",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/educations/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Create Education",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/educations/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"education_type\": \"bachelors\",\n    \"school_name\": \"University of Example\",\n    \"degree\": \"Bachelor of Science\",\n    \"field_of_study\": \"Computer Science\",\n    \"start_date\": \"2018-09-01\",\n    \"end_date\": \"2022-05-15\",\n    \"grade\": \"3.8\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Experience",
      "item": [
        {
          "name": "List Experience",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/experiences/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Create Experience",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/experiences/",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"company_name\": \"Tech Corp\",\n    \"designation\": \"Software Engineer\",\n    \"job_type\": \"Full-time\",\n    \"location\": \"New York\",\n    \"currently_working\": true,\n    \"job_description\": \"Developed and maintained web applications\",\n    \"start_date\": \"2022-06-01\",\n    \"end_date\": null\n}"
            }
          }
        }
      ]
    }
  ]
}
```

### Environment File
Save the following content as `hirelink-api-environment.json`:

```json
{
  "id": "your-environment-id",
  "name": "HireLink API Environment",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "type": "default",
      "enabled": true
    },
    {
      "key": "token",
      "value": "your_jwt_token_here",
      "type": "secret",
      "enabled": true
    }
  ],
  "_postman_variable_scope": "environment"
}
```

### How to Import

1. Download both files:
   - `hirelink-api-collection.json`
   - `hirelink-api-environment.json`

2. In Postman:
   - Click "Import" button
   - Drag and drop both files or click "Upload Files" to select them
   - Click "Import"

3. Set up the environment:
   - Click on "Environments" in the sidebar
   - Select "HireLink API Environment"
   - Update the `base_url` if needed
   - Update the `token` with your JWT token after authentication

4. Start using the collection:
   - All requests are organized in folders (Authentication, Profile, Education, Experience)
   - Each request is pre-configured with the correct headers and body format
   - Environment variables are automatically used in all requests

### Notes
- Make sure to authenticate first to get a valid JWT token
- Update the environment variables as needed
- All endpoints include trailing slashes to avoid Django's APPEND_SLASH issues
- For file uploads, you'll need to select the actual file in Postman before sending the request

#
# -----------------------------
# Automated Deactivation of Expired Subscriptions
# -----------------------------

## Automating Subscription Expiry with Cron

To ensure that expired user subscriptions are automatically deactivated, you can schedule a cron job to run the management command `deactivate_expired_subscriptions` at regular intervals.

### 1. Locate Your Python Path

If you are using a virtual environment, your Python path will look like:
```
/media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python
```

### 2. Open Your Crontab

Run the following command in your terminal:
```
crontab -e
```
This opens your user's crontab file for editing.

### 3. Add the Cron Job

#### For Testing (every 3 minutes):
```
*/3 * * * * cd /media/mrx/projects/Hirelink/django/hirelink-api && /media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python manage.py deactivate_expired_subscriptions >> /tmp/deactivate_subs.log 2>&1
```

#### For Production (every 1 hour):
```
0 * * * * cd /media/mrx/projects/Hirelink/django/hirelink-api && /media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python manage.py deactivate_expired_subscriptions >> /tmp/deactivate_subs.log 2>&1
```

- The `>> /tmp/deactivate_subs.log 2>&1` part appends all output (including errors) to a log file for debugging.
- You can comment/uncomment the appropriate line to switch between testing and production intervals.

### 4. Save and Exit
- Save the file and exit the editor. The cron job will now run at the specified interval.

### 5. Check the Log
- To view the output or errors from the cron job, check the log file:
```
tail -f /tmp/deactivate_subs.log
```

### 6. Manual Run (for testing)
You can also run the command manually to verify it works:
```
cd /media/mrx/projects/Hirelink/django/hirelink-api
/media/mrx/projects/Hirelink/django/hirelink-api/venv/bin/python manage.py deactivate_expired_subscriptions
```

---