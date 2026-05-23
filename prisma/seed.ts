import 'dotenv/config';
import { PrismaClient, Role, CourseLevel, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  console.log('Starting seed...');

  // 1. Create SuperAdmin User
  await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      first_name: 'Admin',
      last_name: 'Super',
      email: 'admin@crm.com',
      phone: '+998901234567',
      password: password,
      role: Role.SUPERADMIN,
      address: 'Tashkent',
      status: Status.active,
    }
  });

  // 2. Create Courses
  const c1 = await prisma.course.upsert({
    where: { name: 'Frontend Development' },
    update: {},
    create: {
      name: 'Frontend Development',
      description: 'React, Next.js, TailwindCSS',
      price: 1500000,
      duration_month: 6,
      duration_hours: 144,
      level: CourseLevel.intermediate,
      status: Status.active,
    }
  });

  const c2 = await prisma.course.upsert({
    where: { name: 'Backend Development' },
    update: {},
    create: {
      name: 'Backend Development',
      description: 'Node.js, NestJS, Prisma, PostgreSQL',
      price: 1800000,
      duration_month: 7,
      duration_hours: 168,
      level: CourseLevel.advanced,
      status: Status.active,
    }
  });

  // 3. Create Rooms
  const r1 = await prisma.room.upsert({
    where: { name: 'Room 101' },
    update: {},
    create: {
      name: 'Room 101',
      capacity: 20,
      status: Status.active,
    }
  });

  const r2 = await prisma.room.upsert({
    where: { name: 'Room 202' },
    update: {},
    create: {
      name: 'Room 202',
      capacity: 15,
      status: Status.active,
    }
  });

  // 4. Create Teachers
  const t1 = await prisma.teacher.upsert({
    where: { email: 'teacher1@najotedu.uz' },
    update: {},
    create: {
      full_name: 'John Doe',
      email: 'teacher1@najotedu.uz',
      password: password,
      phone: '+998901112233',
      address: 'Tashkent',
      status: Status.active,
    }
  });

  const t2 = await prisma.teacher.upsert({
    where: { email: 'teacher2@najotedu.uz' },
    update: {},
    create: {
      full_name: 'Jane Smith',
      email: 'teacher2@najotedu.uz',
      password: password,
      phone: '+998904445566',
      address: 'Samarkand',
      status: Status.active,
    }
  });

  // 5. Create Students
  const s1 = await prisma.student.upsert({
    where: { email: 'student1@gmail.com' },
    update: {},
    create: {
      full_name: 'Alex Johnson',
      email: 'student1@gmail.com',
      password: password,
      phone: '+998931110011',
      address: 'Tashkent',
      birth_date: new Date('2005-05-15'),
      status: Status.active,
    }
  });

  // 6. Create Groups
  await prisma.group.upsert({
    where: { name: 'FE-101' },
    update: {},
    create: {
      name: 'FE-101',
      course_id: c1.id,
      teacher_id: t1.id,
      room_id: r1.id,
      start_date: new Date(),
      start_time: '14:00',
      week_day: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      max_student: 20,
      status: Status.active,
    }
  });

  console.log('Seed data created successfully!');
  console.log('Login: +998901234567 / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
