
export const users = [
  // Graduate Users
  {
    id: 'grad1',
    role: 'graduate',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    schoolId: 'school1',
    profile: {
      bio: 'Recent computer science graduate with a passion for web development.',
      skills: ['React', 'Node.js', 'TypeScript'],
      education: [
        {
          school: 'University of Example',
          degree: 'B.S. in Computer Science',
          year: 2023,
        },
      ],
      experience: [
        {
          title: 'Software Engineer Intern',
          company: 'Tech Corp',
          years: '2022',
          description: 'Worked on the frontend of the main application using React.',
        },
      ],
    },
  },
  {
    id: 'grad2',
    role: 'graduate',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    schoolId: 'school2',
    profile: {
      bio: 'Marketing graduate with an interest in digital marketing.',
      skills: ['SEO', 'Google Analytics', 'Content Marketing'],
      education: [
        {
          school: 'Another University',
          degree: 'B.A. in Marketing',
          year: 2023,
        },
      ],
      experience: [],
    },
  },
  // Company Users
  {
    id: 'comp1',
    role: 'company',
    email: 'hr@techcorp.com',
    companyName: 'Tech Corp',
    profile: {
      website: 'https://techcorp.com',
      description: 'A leading technology company.',
      industry: 'Technology',
    },
  },
  {
    id: 'comp2',
    role: 'company',
    email: 'info@innovate.io',
    companyName: 'Innovate Inc.',
    profile: {
      website: 'https://innovate.io',
      description: 'A startup focused on innovation.',
      industry: 'Technology',
    },
  },
  // School Users
  {
    id: 'school1',
    role: 'school',
    email: 'admin@universityofexample.edu',
    schoolName: 'University of Example',
    profile: {
      website: 'https://universityofexample.edu',
      description: 'A well-regarded university.',
    },
  },
  {
    id: 'school2',
    role: 'school',
    email: 'contact@anotheruniversity.edu',
    schoolName: 'Another University',
    profile: {
        website: 'https://anotheruniversity.edu',
        description: 'A modern university with a focus on practical skills.',
    },
  },
];
