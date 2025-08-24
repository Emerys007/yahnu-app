
import { db } from '@/lib/firebase'; // Assuming you have a firebase config file
import { collection, doc, setDoc } from 'firebase/firestore';
import { users } from './users';
import { jobs } from './jobs';
import { applications } from './applications';
import { partnerships } from './partnerships';

async function seedDatabase() {
  console.log('Starting to seed the database...');

  // Seed users
  for (const user of users) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`Added user: ${user.firstName || user.companyName || user.schoolName}`);
    } catch (e) {
      console.error('Error adding user: ', e);
    }
  }

  // Seed jobs
  for (const job of jobs) {
    try {
      await setDoc(doc(db, 'jobs', job.id), job);
      console.log(`Added job: ${job.title}`);
    } catch (e) {
      console.error('Error adding job: ', e);
    }
  }

  // Seed applications
  for (const application of applications) {
    try {
      await setDoc(doc(db, 'applications', application.id), application);
      console.log(`Added application: ${application.id}`);
    } catch (e) {
      console.error('Error adding application: ', e);
    }
  }

    // Seed partnerships
  for (const partnership of partnerships) {
    try {
      await setDoc(doc(db, 'partnerships', partnership.id), partnership);
      console.log(`Added partnership: ${partnership.id}`);
    } catch (e) {
      console.error('Error adding partnership: ', e);
    }
  }

  console.log('Database seeding completed.');
}

// You can run this function from a script or a secure API endpoint
// For example, you could create a script in your package.json:
// "scripts": {
//   "seed": "node -r ts-node/register src/lib/data/seed.ts"
// }
// and then run `npm run seed` or `yarn seed`
seedDatabase();
