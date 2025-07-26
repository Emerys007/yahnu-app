
import {
    User,
    Briefcase,
    GraduationCap,
    Users,
    Building,
    Calendar,
    Settings,
    LayoutGrid,
    BarChart,
    FileText,
    LifeBuoy,
    LogOut,
    Mail,
    MessageSquare,
    PlusCircle,
    UserPlus,
    Users2,
    Bell,
    CheckCircle2,
    Flag,
  } from 'lucide-react';
  
  export const teamMembers = [
    {
      name: 'Joël K',
      role: 'about.team.roles.founder_ceo',
      image: '/images/Joel K.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/joel-kotto',
        twitter: 'https://twitter.com/joel_kotto',
      },
    },
    {
      name: 'Béthel T',
      role: 'about.team.roles.product_manager',
      image: '/images/Bethel_Touman.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/bethel-touman',
        twitter: '#',
      },
    },
    {
      name: 'Colombe K',
      role: 'about.team.roles.community_manager',
      image: '/images/Colombe Koffi.jpeg',
      social: {
        linkedin: 'https://www.linkedin.com/in/colombekoffi',
        twitter: '#',
      },
    },
  ];
  
  export const allPosts = [
    {
      title: 'The Future of Work in Africa is Remote',
      slug: 'future-of-work-remote',
      author: 'blog_author',
      date: '2024-07-22',
      image: '/images/Blog/remote-work.jpg',
      brief: "The global shift towards remote work presents a massive opportunity for Africa's talented youth. Discover the trends, benefits, and challenges.",
      content: `
        <p class="lead mb-6">The global pandemic accelerated a trend that was already simmering: the rise of remote work. For Africa, this isn't just a passing phase; it's a paradigm shift that holds the potential to unlock unprecedented opportunities for its vibrant and youthful population.</p>
        
        <h3 class="text-2xl font-bold mt-8 mb-4">A World of Opportunity for Graduates</h3>
        <p class="mb-4">For the first time, a graduate in Lagos, Accra, or Nairobi can compete for a role in a company based in New York, London, or Tokyo without leaving their home city. This breaks down geographical barriers that have long limited career prospects. The benefits are immense:</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Access to Global Job Markets:</strong> Talented individuals are no longer restricted to their local job market, dramatically expanding their career options.</li>
          <li><strong>Competitive Salaries:</strong> Working for international companies often means access to better pay, boosting local economies.</li>
          <li><strong>Work-Life Balance:</strong> Eliminating the daily commute and offering flexible hours can lead to a significant improvement in quality of life.</li>
        </ul>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">A Strategic Advantage for Companies</h3>
        <p class="mb-4">The remote work revolution is a two-way street. Companies, both local and international, stand to gain significantly by embracing it:</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Vast Talent Pool:</strong> Businesses can now recruit from across the entire continent, finding the perfect skills for their needs without geographic limitation.</li>
          <li><strong>Reduced Costs:</strong> Less need for large office spaces translates to lower overhead costs, a critical advantage for startups and scaling businesses.</li>
          <li><strong>Increased Diversity and Productivity:</strong> Diverse teams are more innovative. Furthermore, many studies show that remote workers are often more focused and productive.</li>
        </ul>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">Navigating the Challenges</h3>
        <p class="mb-4">Of course, the transition is not without its hurdles. Challenges like reliable internet connectivity and consistent power supply are real concerns in many parts of the continent. However, these are rapidly improving. The rise of co-working spaces, solar power solutions, and expanding fiber optic networks are paving the way for a more connected future. Graduates, in turn, must cultivate self-discipline, proactivity, and excellent digital communication skills to thrive in a remote setting.</p>
        
        <p class="mt-6">The future of work in Africa is here, and it is flexible, distributed, and digital. At Yahnu, we are committed to equipping graduates with the skills and connections needed to succeed in this new era of opportunity.</p>
      `
    },
    {
      title: 'Bridging the Gap: How Yahnu Connects Graduates with Industry',
      slug: 'bridging-the-gap',
      author: 'blog_author',
      date: '2024-07-20',
      image: '/images/Blog/Yahnu-Connects-Graduates-with-Industry.jpg',
      brief: 'The "skills gap" is a major hurdle for graduates. Learn how Yahnu is building the bridge between education and the professional world.',
      content: `
        <p class="lead mb-6">In discussions about employment in Africa, one term comes up repeatedly: the "skills gap." It refers to the disconnect between the knowledge acquired in educational institutions and the practical, evolving skills demanded by the modern industry. This gap is a significant barrier, leaving talented graduates underemployed and companies struggling to find job-ready candidates. Yahnu was founded to be the bridge across this divide.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">The Core of the Problem</h3>
        <p class="mb-4">Universities provide essential theoretical foundations, but often curricula can't keep pace with the rapid technological and methodological shifts in the workplace. Graduates may leave with a degree but without hands-on experience in the latest software, an understanding of current industry workflows, or the specific "soft skills" that are critical for collaboration and innovation. The result is a frustrating cycle of rejection for graduates and a costly, time-consuming recruitment process for employers.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">Yahnu's Three-Pillar Solution</h3>
        <p class="mb-4">We tackle this problem by creating a symbiotic ecosystem that benefits all stakeholders: graduates, companies, and schools.</p>
        
        <h4 class="text-xl font-semibold mt-6 mb-2">1. Empowering Graduates</h4>
        <p class="mb-4">We provide graduates with the tools to showcase their true potential. A Yahnu profile is more than a CV; it's a dynamic portfolio. Through our platform, graduates can take industry-relevant skills assessments, earn certifications, and clearly demonstrate their capabilities to potential employers. This moves the focus from just having a degree to proving applicable skills.</p>
  
        <h4 class="text-xl font-semibold mt-6 mb-2">2. Equipping Companies</h4>
        <p class="mb-4">For companies, Yahnu is a talent pipeline of vetted candidates. Instead of sifting through hundreds of generic applications, recruiters can filter for specific, verified skills. Our platform provides rich data points on each candidate, drastically reducing the time and uncertainty of the hiring process. It's about finding not just a candidate, but the right candidate, efficiently.</p>
  
        <h4 class="text-xl font-semibold mt-6 mb-2">3. Engaging Schools</h4>
        <p class="mb-4">We close the loop by providing universities with valuable, data-driven insights. By seeing which skills are most in-demand by employers, schools can better tailor their curricula and career services. Yahnu facilitates meaningful partnerships between academia and industry, ensuring that education is truly aligned with the needs of the economy.</p>
  
        <p class="mt-6">By creating these connections, Yahnu is not just filling jobs. We are building futures, fostering a more agile and prepared workforce, and ensuring that the immense talent of Africa's youth is not just recognized, but fully realized.</p>
      `
    },
    {
      title: 'Top 5 In-Demand Skills for Graduates in 2025',
      slug: 'top-5-skills-2025',
      author: 'blog_author',
      date: '2024-07-18',
      image: '/images/Blog/jobs-2025.png',
      brief: 'The job market is evolving. Are you prepared? We break down the top 5 skills you need to cultivate for a successful career.',
      content: `
        <p class="lead mb-6">As the global economy continues to transform, the skills required to succeed are evolving faster than ever. For graduates entering the workforce, simply having a degree is no longer enough. To stand out and build a resilient career, it's crucial to focus on cultivating the skills that are most valued by modern employers. Here are the top 5 skills domains to focus on for 2025 and beyond.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">1. Digital Literacy & Fluency</h3>
        <p class="mb-4">This goes far beyond knowing how to use a word processor. True digital fluency means understanding the entire digital ecosystem. This includes social media marketing, content creation, SEO/SEM principles, and proficiency in digital collaboration tools like Slack, Trello, and Asana. Every company is now a tech company in some way, and they need employees who can navigate the digital world with confidence.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">2. Data Science & Analytics</h3>
        <p class="mb-4">Data is the new oil, and companies are desperate for people who can refine it. The ability to collect, analyze, and interpret data to make informed business decisions is one of the most sought-after skills across all industries, from finance and marketing to agriculture and healthcare. Learning tools like SQL, Python for data analysis, and visualization software like Tableau or Power BI can make you an invaluable asset.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">3. Software Development & AI</h3>
        <p class="mb-4">The demand for software developers continues to surge across Africa. Whether it's building websites, developing mobile applications, or working on complex enterprise software, coding skills remain a golden ticket. Furthermore, a foundational understanding of Artificial Intelligence (AI) and Machine Learning (ML) principles is becoming increasingly important as more companies integrate these technologies into their operations.</p>
        
        <h3 class="text-2xl font-bold mt-8 mb-4">4. Green Skills & Sustainability Management</h3>
        <p class="mb-4">As the world grapples with climate change, a new "green economy" is emerging. This has created a demand for professionals who understand sustainability practices, renewable energy, waste management, and environmental policy. Companies are increasingly looking for employees who can help them operate more sustainably, both to meet regulations and to appeal to environmentally-conscious consumers.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">5. Power Skills (Advanced Soft Skills)</h3>
        <p class="mb-4">Technical skills can get you an interview, but power skills will get you the job and help you grow in your career. These are the uniquely human skills that are difficult to automate:</p>
        <ul class="list-disc list-inside mb-4 space-y-2">
          <li><strong>Critical Thinking:</strong> The ability to analyze problems and devise effective solutions.</li>
          <li><strong>Communication:</strong> Clearly articulating ideas, both verbally and in writing.</li>
          <li><strong>Collaboration:</strong> Working effectively in a team, especially in a remote or hybrid environment.</li>
          <li><strong>Adaptability:</strong> The ability to learn quickly and pivot in a fast-changing world.</li>
          <li><strong>Emotional Intelligence:</strong> Understanding and managing your own emotions and recognizing them in others.</li>
        </ul>
  
        <p class="mt-6">The future belongs to those who commit to lifelong learning. By focusing on these five key areas, you can future-proof your career and position yourself for success in the dynamic African job market. Yahnu's skills assessments can help you identify your strengths and areas for growth on this journey.</p>
      `
    },
    {
      title: "The Importance of Internships for Career Success",
      slug: "importance-of-internships",
      author: "blog_author",
      date: "2024-06-15",
      image: "/images/Blog/internship.jpg",
      brief: "Internships are a crucial stepping stone from academia to a professional career. Learn why they are so valuable and how to make the most of the experience.",
      content: `
        <p class="lead mb-6">If your degree is the key that starts the engine, an internship is the map that shows you how to navigate the road to career success. For many graduates, the leap from the academic world to the professional one can be daunting. An internship is the single most effective tool for bridging this gap, transforming theoretical knowledge into tangible, career-building experience.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">Gain Real-World Experience</h3>
        <p class="mb-4">Classrooms teach you the 'what' and the 'why,' but internships teach you the 'how.' It's where you learn to apply theories to real-world problems, use industry-standard tools, and understand the day-to-day rhythm of a professional environment. This hands-on experience is what employers are looking for and what makes your CV stand out from the crowd.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">Build Your Professional Network</h3>
        <p class="mb-4">The people you meet during your internship—from fellow interns to senior managers—are the first connections in your professional network. A strong performance can lead to mentorship, glowing recommendations, and even a full-time job offer. These relationships can be invaluable throughout your career, providing advice, support, and new opportunities down the line.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">Test-Drive a Career Path</h3>
        <p class="mb-4">Are you unsure if marketing is the right fit for you? Is a career in finance as you imagined? An internship allows you to test-drive a career path with a relatively low commitment. It's a chance to explore your interests and discover what you're truly passionate about, helping you make more informed decisions about your long-term career goals.</p>
        
        <h3 class="text-2xl font-bold mt-8 mb-4">Develop Crucial Soft Skills</h3>
        <p class="mb-4">Beyond technical skills, internships are a training ground for the soft skills essential for workplace success: communication, teamwork, problem-solving, and time management. Mastering these in a professional context is a sign of maturity and readiness that employers value highly.</p>
  
        <p class="mt-6">Don't view an internship as just a summer job; see it as the first, most critical step in your professional journey. At Yahnu, we connect talented graduates with companies offering meaningful internship experiences. Start building your future today.</p>
      `
    },
    {
      title: "Networking in the Digital Age: A Guide for Graduates",
      slug: "digital-networking-guide",
      author: "blog_author",
      date: "2024-06-10",
      image: "https://images.pexels.com/photos/5989933/pexels-photo-5989933.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      brief: "Your network is your net worth. In today's digital world, building professional connections online is more important than ever. Here's how to do it effectively.",
      content: `
        <p class="lead mb-6">The old adage, "It's not what you know, it's who you know," has been supercharged in the digital era. Your professional network is one of your most valuable career assets, and platforms like LinkedIn have made it possible to connect with industry leaders across the globe. For a recent graduate, mastering digital networking isn't just an option—it's essential.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">1. Your LinkedIn Profile is Your Digital Handshake</h3>
        <p class="mb-4">Before you do anything else, make your profile shine. This is your digital storefront. Ensure you have a professional headshot, a compelling headline that says more than just "Student," and a summary that tells your story and highlights your aspirations. Detail your experiences, both academic and professional, and list your skills. A complete profile is a credible profile.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">2. Personalize Your Connection Requests</h3>
        <p class="mb-4">Never send a generic connection request. A blank request is easily ignored. Take 30 seconds to add a personal note. Mention a mutual connection, a shared interest, or a piece of their work you admire. For example: "Hello [Name], I'm a recent Computer Science graduate and was very impressed by the work your team at [Company] is doing in AI. I'd be honored to connect and follow your work."</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">3. Engage Authentically</h3>
        <p class="mb-4">Networking is not just about collecting connections. It's about building relationships. Follow companies you're interested in and engage with the content posted by people in your target industry. A thoughtful comment on a post can be more effective than a dozen connection requests. Share articles relevant to your field with your own insights. This positions you as a passionate and engaged member of the community.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">4. The Power of the Informational Interview</h3>
        <p class="mb-4">Once connected, don't be afraid to ask for a brief, 15-minute "informational interview." This is not a job interview; it's a chance to ask for advice. People are often happy to share their story and offer guidance to those starting out. Be respectful of their time, come prepared with smart questions, and always send a thank-you note afterward.</p>
  
        <h3 class="text-2xl font-bold mt-8 mb-4">5. Look Beyond LinkedIn</h3>
        <p class="mb-4">While LinkedIn is key, don't ignore other platforms. Join industry-specific groups on Facebook, follow thought leaders on X (formerly Twitter), and participate in virtual events and webinars. Every interaction is an opportunity to learn and connect.</p>
  
        <p class="mt-6">Digital networking is a marathon, not a sprint. It's about consistently planting seeds, providing value to others, and building a community of professional contacts. Start today, and you'll reap the rewards for years to come.</p>
      `
    }
  ];
  
  export const dashboardNavItems = {
    graduate: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'My Profile', href: '/dashboard/profile', icon: User },
      { label: 'Job Applications', href: '/dashboard/applications', icon: Briefcase },
      { label: 'Assessments', href: '/dashboard/assessments', icon: CheckCircle2 },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Events', href: '/dashboard/events', icon: Calendar },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    company: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'Company Profile', href: '/dashboard/company-profile', icon: Building },
      { label: 'Job Postings', href: '/dashboard/job-postings', icon: PlusCircle },
      { label: 'Applicants', href: '/dashboard/applicants', icon: Users },
      { label: 'Talent Pool', href: '/dashboard/talent-pool', icon: Users2 },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    school: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { label: 'School Profile', href: '/dashboard/school-profile', icon: GraduationCap },
      { label: 'Graduate Management', href: '/dashboard/graduate-management', icon: Users },
      { label: 'Partnerships', href: '/dashboard/partnerships', icon: Users2 },
      { label: 'Analytics', href: '/dashboard/reports', icon: BarChart },
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      { label: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ],
    admin: [
      { label: 'Overview', href: '/dashboard/admin/overview', icon: LayoutGrid },
      { label: 'User Management', href: '/dashboard/admin/user-management', icon: Users },
      { label: 'Content Moderation', href: '/dashboard/admin/content-moderation', icon: Flag },
      { label: 'Announcements', href: '/dashboard/admin/announcements', icon: Bell },
      { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart },
      { label: 'System Health', href: '/dashboard/admin/system-health', icon: CheckCircle2 },
      { label: 'Team', href: '/dashboard/admin/team', icon: Users2 },
    ],
  };
  