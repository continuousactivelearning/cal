import pandas as pd
import requests
import random
import string
from tqdm import tqdm
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Define API endpoint for signup
SIGNUP_URL = "https://calm-lmse-production-339283531284.asia-south2.run.app/api/v1/auth/signup/"  

AUTH_TOKEN = os.getenv("AUTH_TOKEN")
if not AUTH_TOKEN:
    raise ValueError("No token found in the environment variables.")

# Function to generate a secure random password
def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "@"
    while True:
        password = ''.join(random.choices(chars, k=length))
        if (any(c.isupper() for c in password) and
            any(c.islower() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "@" for c in password)):
            return password

# Function to bulk signup users from CSV
def bulk_signup(csv_file):
    df = pd.read_csv(csv_file)
    required_columns = {"first_name", "last_name", "email"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"CSV must contain columns: {required_columns}")

    # Fill NaN values in relevant columns
    df.fillna("", inplace=True)

    df["password"] = df.apply(lambda _: generate_password(10), axis=1)
    updated_csv_file = "updated_" + csv_file
    df.to_csv(updated_csv_file, index=False)
    print(f"Updated CSV with passwords saved as: {updated_csv_file}")

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    success_count = 0
    failed_count = 0

    for _, row in tqdm(df.iterrows(), total=df.shape[0], desc="Processing Signups"):
        payload = {
            "first_name": str(row["first_name"]),
            "last_name": str(row["last_name"]),
            "email": str(row["email"]),
            "password": str(row["password"])
        }

        response = requests.post(SIGNUP_URL, json=payload, headers=headers)

        if response.status_code == 201:
            success_count += 1
        else:
            failed_count += 1
            print(f"Signup failed for {row['email']} - {response.status_code} - {response.text}")

    print(f"Signup Completed: {success_count} Success, {failed_count} Failed")
    return updated_csv_file  # Returning the updated file for further use

# Main execution
if __name__ == "__main__":
    csv_file = input("Enter the path to the CSV file: ")
    bulk_signup(csv_file)
