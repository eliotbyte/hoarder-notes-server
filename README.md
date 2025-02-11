# Hoarder Notes Server

This project sets up a NestJS API server with a PostgreSQL database using Docker. It is configured for a Windows environment and includes support for TypeORM migrations.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (recommended version: 18.x)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install NestJS CLI globally:

```bash
npm install -g @nestjs/cli
```

- Set up a `.env` file: For security and configuration purposes, this project requires a `.env` file to store environment variables.
  - To generate a `JWT_SECRET` for the `.env` file, you can use the following command in Node.js:
    ```javascript
    require('crypto').randomBytes(32).toString('base64');
    ```

### 1. Install Dependencies

Install all the necessary packages by running:

```bash
npm install
```

### 2. Set Up Docker Containers

To run the application and PostgreSQL database using Docker, use the following command:

```bash
docker-compose up -d
```

This command will start both the NestJS application and PostgreSQL database in Docker containers. The database is accessible on port `5433`.

### 3. Run Migrations

To apply all existing migrations (included in the repository) to the database, use:

```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d ./data-source.ts
```

This command will create the necessary tables in the database.

## Development

### Generating New Migrations

If you need to create a new migration to update the database schema, use the following command, replacing `MigrationName` with a descriptive name for your migration:

```bash
npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migration/MigrationName -d ./data-source.ts
```

#### Important Steps if No Changes are Detected

1. **Ensure All Entities are Registered**: Verify that all entities are added in `data-source.ts` in the `entities` array. Example:

   ```typescript
   import { DataSource } from 'typeorm';
   import { User } from './src/entities/user.entity';
   import { Note } from './src/entities/note.entity';
   import { Tag } from './src/entities/tag.entity';
   import { NoteTag } from './src/entities/note_tag.entity';

   export const AppDataSource = new DataSource({
     type: 'postgres',
     host: 'localhost',
     port: 5433,
     username: 'postgres',
     password: 'postgres',
     database: 'hoarder_notes_db',
     entities: [User, Note, Tag, NoteTag],
     migrations: ['src/migration/*.ts'],
     synchronize: false,
   });
   ```

2. **Retry Migration Generation**: After verifying the entity registrations, rerun the migration generation command:

   ```bash
   npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/migration/MigrationName -d ./data-source.ts
   ```

## Additional Configuration

The database configuration can be found in `ormconfig.json` and `data-source.ts`. Ensure these files are properly set up for local development or adjust as needed.

## Notes

- **Docker Compose** is configured to use volumes for persistent data storage in PostgreSQL.
- **TypeORM CLI** commands are configured to work with TypeScript directly using `ts-node`.
