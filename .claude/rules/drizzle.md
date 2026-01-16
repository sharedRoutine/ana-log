## Drizzle

- Always use `drizzle-kit generate --config ./drizzle.config.ts` for generating migration files
- NEVER write migration SQL files manually - always let drizzle-kit generate them
- If drizzle-kit requires interactive input (e.g., for renames vs creates), create a custom migration.
- For complex migrations requiring custom SQL (data transformations, etc.), use drizzle-kit's custom migration feature:
  - Run `drizzle-kit generate --custom --config ./drizzle.config.ts` to create an empty migration file
  - Then add custom SQL to the generated file
- After schema changes, always run drizzle-kit generate before modifying application code
