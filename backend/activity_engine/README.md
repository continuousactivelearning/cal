# Full Installation Guide
This is the activity engine developed in Node.js using TypeScript. We are using Prisma for interaction between the backend and the database.
Follow these steps to set up and run the project:

## Setup Instructions

1. Install dependencies:
    ```bash
    npm install
    ```
2. (Optional) Setup environment variables:
    ```bash
    cp .env.example .env
    ```
3. Build the project:
    ```bash
    npm run build
    ```
4. Run database migrations:
    Make sure the .env file (located in the project root) has a proper DATABASE_URL pointing to your PostgreSQL database. Also, check your Prisma schema (prisma/schema.prisma) for accuracy. Here's the steps for the migration step:

    
    
    Run the Prisma migration to update the database schema
     ```bash
    npx prisma migrate dev
    ```
     Generate the Prisma Client if needed
     ```bash
    npx prisma generate
    ```
     If an error occurs, double-check your Prisma configuration in the .env and prisma/schema.prisma files.
    
5. Start the development server:
    ```bash
    npm run dev
    ```

### Database Configuration

To set up your database in this application, you need to create a `.env` file in the root directory of your project. In this file, define the `DATABASE_URL` with your PostgreSQL database URL:

```
DATABASE_URL="your_postgres_database_url"

```
To get PostgreSQL First, you need to get your PostgreSQL connection string from Supabase.

1. Log in to your Supabase account, create a new project and remember password.
2. Open Project, Go to the Project settings.
3. Navigate to Database >  select connect option From top bar.
4. Copy the PostgreSQL connection string from "Direct connection" and paste it into the URL where the password field is located.
5. In the .env file, add the database connection string: DATABASE_URL="your_postgres_database_url"

#### Google Authentication

To implement Google authentication, follow these steps:

1. Create a credentials file in JSON format (e.g., `file.json`) containing all your Google Auth Firebase Admin credentials.
2. Add the path to your credentials file in the `.env` file:

```
FIREBASE_ADMIN_SDK_PATH=path_to_your_credentials_file.json
```

##### Folder Structure

```
backened
    └── activity_engine/  
        ├── src/  
        │   ├── config/              # Configured to log various levels of information  
        │   ├── controller/          # Contains different controllers for each API call functionality  
        │   ├── middleware/          # Contains Google authentication middleware responsible for verifying users  
        │   ├── routes/              # Contains various route files for backend API endpoints  
        │   ├── repositories/        # Stores all repository files for database interactions  
        │   ├── services/            # Includes business logic services for each functionality (like course progress)  
        │   ├── types/               # Defines TypeScript types for various elements  
        │   ├── constant.ts          # Stores the URL of the LM engine  
        │   └── server.ts            # Configures and initializes the Express server  
        └── prisma/  
            ├── migrations/          # Contains all migrations  
            └── schema.prisma        # Contains the Prisma schema for data storage  

```