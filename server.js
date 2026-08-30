const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@expensemate.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      if (!existingUser.isAdmin) {
        existingUser.isAdmin = true;
        await existingUser.save();
        console.log(`Updated existing user to admin: ${adminEmail}`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: 'ExpenseMate Admin',
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true,
    });

    console.log(`Seeded admin account: ${adminEmail} / ${adminPassword}`);
  } catch (error) {
    console.error('Admin seeding failed:', error.message);
  }
};

connectDB().then(seedAdminUser);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
