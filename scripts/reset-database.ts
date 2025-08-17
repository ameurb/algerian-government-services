import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🗑️ Dropping all collections...')
  
  try {
    // Delete all data in order (respecting foreign key constraints)
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.post.deleteMany()
    await prisma.eventRegistration.deleteMany()
    await prisma.event.deleteMany()
    await prisma.healthRecord.deleteMany()
    await prisma.certificate.deleteMany()
    await prisma.enrollment.deleteMany()
    await prisma.course.deleteMany()
    await prisma.jobApplication.deleteMany()
    await prisma.job.deleteMany()
    await prisma.chatMessage.deleteMany()
    await prisma.session.deleteMany()
    await prisma.governmentService.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ All collections dropped successfully!')
    
    // Generate new Prisma client with updated schema
    console.log('🔄 Generating new Prisma client...')
    
  } catch (error) {
    console.error('❌ Error resetting database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()
