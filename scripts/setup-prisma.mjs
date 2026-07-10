// Script untuk auto-switch Prisma provider berdasarkan DATABASE_URL
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");
const targetProvider = isPostgres ? "postgresql" : "sqlite";

console.log(`🔍 DATABASE_URL detected: ${dbUrl ? dbUrl.substring(0, 30) + "..." : "(empty)"}`);
console.log(`🎯 Target Prisma provider: ${targetProvider}`);

let schema = fs.readFileSync(schemaPath, "utf8");

const datasourceRegex = /datasource db \{[^}]*\}/s;
const match = schema.match(datasourceRegex);
if (!match) {
  console.error("❌ Cannot find datasource block in schema.prisma");
  process.exit(1);
}

const newDatasource = `datasource db {
  provider = "${targetProvider}"
  url      = env("DATABASE_URL")
}`;

schema = schema.replace(datasourceRegex, newDatasource);
fs.writeFileSync(schemaPath, schema);

console.log(`✅ Updated prisma/schema.prisma → provider = "${targetProvider}"`);
