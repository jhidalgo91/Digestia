const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    const prisma = new PrismaClient();
    try {
        const email = process.env.ADMIN_EMAIL || 'admin@localhost';
        const password = process.env.ADMIN_PASSWORD || '1234!';
        const name = process.env.ADMIN_NAME || 'Admin';

        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                name,
                password: hashed,
                role: 'ADMIN',
                emailVerified: new Date(),
            },
            create: {
                name,
                email,
                password: hashed,
                role: 'ADMIN',
                emailVerified: new Date(),
            },
        });

        console.log('Admin creado/actualizado:', user.id, user.email);
        console.log('Si usaste la contraseña por defecto, cámbiala cuanto antes.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
