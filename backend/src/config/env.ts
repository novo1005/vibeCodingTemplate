import { z } from 'zod'

/**
 * Environment variable schema. Validated once at process start; downstream
 * code imports the parsed `env` object and gets full TypeScript types.
 */
const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    DB_DIALECT: z.enum(['sqlite', 'postgres']).default('sqlite'),
    DB_SQLITE_FILE: z.string().default('./data/dev.db'),
    DATABASE_URL: z.string().url().optional(),

    AI_GATEWAY_BASE_URL: z
      .string()
      .url()
      .default('https://ops-ai-gateway.yc345.tv/v1/chat/completions'),
    AI_GATEWAY_API_KEY: z.string().optional(),
    AI_GATEWAY_MODELS: z.string().default('local'),
    AI_GATEWAY_DEFAULT_MODEL: z.string().default('local'),
    AI_GATEWAY_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    AI_GATEWAY_REPAIR_ATTEMPTS: z.coerce.number().int().min(0).max(1).default(1),
  })
  .superRefine((value, ctx) => {
    if (value.DB_DIALECT === 'postgres' && !value.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required when DB_DIALECT=postgres',
      })
    }
  })

export type Env = z.infer<typeof EnvSchema>

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment configuration:')
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
  }
  return parsed.data
}

export const env: Env = loadEnv()
