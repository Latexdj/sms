import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 3,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const basePrisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = basePrisma

/**
 * Creates a tenant-scoped Prisma client.
 * Auto-filters operations by school_id.
 */
export const tenantPrisma = (schoolId: string) => {
  return basePrisma.$extends({
    query: {
      user: {
        async findMany({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
        async findUnique({ args, query }) {
          const { where, ...rest } = args
          return basePrisma.user.findFirst({
            ...rest,
            where: { ...where, school_id: schoolId },
          }) as any
        },
        async update({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
        async updateMany({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
        async deleteMany({ args, query }) {
          args.where = { ...args.where, school_id: schoolId }
          return query(args)
        },
      },
    },
  })
}

export default basePrisma
