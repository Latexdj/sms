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

const TENANT_MODELS = [
  'User', 'Class', 'Student', 'FeeStructure', 'Invoice', 'SmsLog', 'Attendance',
  'Subject', 'Exam', 'Assignment', 'Timetable', 'TeacherProfile', 'BusRoute',
  'CafeteriaItem', 'StudentWallet', 'CafeteriaTransaction', 'Account',
  'LedgerTransaction', 'Book', 'Asset'
];

/**
 * Creates a tenant-scoped Prisma client.
 * Auto-filters operations by school_id.
 */
export const tenantPrisma = (schoolId: string) => {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            const { where, ...rest } = args as any;
            const modelDelegate = (basePrisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            return modelDelegate.findFirst({
              ...rest,
              where: { ...where, school_id: schoolId },
            });
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId } as any
          }
          return query(args)
        },
        async delete({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId } as any
          }
          return query(args)
        },
        async updateMany({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        },
        async count({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        },
        async aggregate({ model, args, query }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...args.where, school_id: schoolId }
          }
          return query(args)
        }
      },
    },
  })
}

export default basePrisma
