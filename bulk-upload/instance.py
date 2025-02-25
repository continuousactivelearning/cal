import requests
import os
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define API endpoints
COURSES_URL = "https://calm-lmse-production-339283531284.asia-south2.run.app/api/v1/course/course-instances"
USER_COURSE_INSTANCE_URL = "https://calm-lmse-production-339283531284.asia-south2.run.app/api/v1/users/user-course-instances/"
FETCH_USER_URL = "https://calm-lmse-production-339283531284.asia-south2.run.app/api/v1/users/users/by-email"

AUTH_TOKEN = os.getenv("AUTH_TOKEN")
if not AUTH_TOKEN:
    raise ValueError("No token found in the environment variables.")

# Function to fetch available course instances
def fetch_courses():
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    response = requests.get(COURSES_URL, headers=headers)

    if response.status_code == 200:
        data = response.json()
        course_instances = data.get("results", [])

        if not course_instances:
            print("No course instances available.")
            return None

        print("Available Course Instances:")
        for idx, instance in enumerate(course_instances, start=1):
            print(f"{idx}. {instance['course']['name']} (Instance ID: {instance['id']}, Course ID: {instance['course']['id']})")

        while True:
            try:
                choice = int(input("Select a course instance by number: "))
                if 1 <= choice <= len(course_instances):
                    return course_instances[choice - 1]["id"]
                else:
                    print("Invalid selection. Please choose a valid instance number.")
            except ValueError:
                print("Invalid input. Please enter a number.")
    else:
        print(f"Failed to fetch course instances: {response.status_code} - {response.text}")
        return None

# Function to fetch a user's Firebase UUID by email
def fetch_user_firebase_uuid(email):
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    response = requests.get(f"{FETCH_USER_URL}?email={email}", headers=headers)
    
    if response.status_code == 200:
        user_data = response.json()
        if user_data and "firebase_uid" in user_data:
            return user_data["id"]
    print(f"Failed to fetch Firebase UUID for {email} - {response.status_code} - {response.text}")
    return None

# Function to assign users to a course instance
def assign_users_to_course(csv_file, course_instance_id):
    df = pd.read_csv(csv_file)

    required_columns = {"email"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"CSV must contain the column: {required_columns}")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    success_count = 0
    failed_count = 0

    for _, row in df.iterrows():
        email = str(row["email"])
        firebase_uuid = fetch_user_firebase_uuid(email)
        
        if firebase_uuid:
            payload = {
                "user": firebase_uuid,
                "course": course_instance_id
            }
            response = requests.post(USER_COURSE_INSTANCE_URL, json=payload, headers=headers)
            
            if response.status_code == 201:
                success_count += 1
                print(f"Assigned {email} to course instance {course_instance_id}.")
            else:
                failed_count += 1
                print(f"Failed to assign {email} - {response.status_code} - {response.text}")
        else:
            failed_count += 1

    print(f"Assignment Completed: {success_count} Success, {failed_count} Failed")

# Main execution
if __name__ == "__main__":
    course_instance_id = fetch_courses()
    if course_instance_id:
        csv_file = input("Enter the path to the CSV file with emails: ")
        assign_users_to_course(csv_file, course_instance_id)
