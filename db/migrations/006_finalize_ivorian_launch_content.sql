-- Final production-content cleanup for the Côte d’Ivoire launch.
--
-- Every write below is guarded by the exact imported prototype fingerprint.
-- Real employer, editorial, or administrator-authored data is deliberately
-- left untouched. Source payloads and dependent rows remain intact, and each
-- changed record receives an audit entry.

WITH fingerprints (
  id, company_ref, title, description, location, salary
) AS (
  VALUES
    (
      'job1',
      'comp1',
      'Frontend Developer',
      'We are looking for a skilled Frontend Developer to join our team.',
      'Remote',
      'Competitive'
    ),
    (
      'job2',
      'comp2',
      'Marketing Specialist',
      'We are seeking a Marketing Specialist to help grow our brand.',
      'New York, NY',
      'Experience Dependent'
    )
),
closed AS (
  UPDATE jobs AS job
  SET status = 'closed'
  FROM fingerprints AS fingerprint
  WHERE job.id = fingerprint.id
    AND job.status = 'open'
    AND job.company_id IS NULL
    AND job.company_ref = fingerprint.company_ref
    AND job.company_name IS NULL
    AND job.title = fingerprint.title
    AND job.description = fingerprint.description
    AND job.location = fingerprint.location
    AND job.employment_type IS NULL
    AND job.application_url IS NULL
    AND job.source_payload ->> 'companyId' = fingerprint.company_ref
    AND job.source_payload ->> 'salary' = fingerprint.salary
  RETURNING job.id, job.title, job.location
)
INSERT INTO audit_logs (
  actor_user_id, action, target_type, target_id, metadata
)
SELECT
  NULL,
  'migration.close_legacy_seed_job',
  'job',
  id,
  jsonb_build_object(
    'reason', 'legacy Firebase demo seed',
    'title', title,
    'location', location
  )
FROM closed;

WITH localized AS (
  UPDATE pages
  SET data = jsonb_build_object(
    'aboutTitle', 'Faire du diplôme un vrai point de départ.',
    'aboutSubtitle', 'Yahnu rapproche les jeunes diplômés, les établissements et les employeurs pour que le talent ivoirien circule, se révèle et trouve sa place.',
    'storyTitle', 'Entre la fin des études et le premier emploi, le chemin ne devrait pas être invisible.',
    'storyContent1', '<p>À Abidjan comme à Bouaké, Korhogo, Yamoussoukro ou San-Pédro, de jeunes diplômés ont les compétences et l’envie d’avancer. Ce qui manque souvent, c’est un accès clair aux opportunités et aux personnes qui peuvent ouvrir une porte.</p>',
    'storyContent2', '<p>Yahnu construit ce pont numérique : un espace où chacun comprend sa prochaine action, où les candidatures restent humaines et où les établissements gardent un rôle actif dans l’insertion professionnelle.</p>',
    'missionTitle', 'Une orientation utile',
    'missionContent', '<p>Aider chaque jeune diplômé à présenter son potentiel avec confiance et à trouver une prochaine étape réaliste en Côte d’Ivoire.</p>',
    'visionTitle', 'Un réseau ancré ici',
    'visionContent', '<p>Créer des connexions professionnelles qui reflètent les villes, les secteurs et l’énergie de la Côte d’Ivoire, tout en ouvrant des passerelles vers le reste de l’Afrique.</p>',
    'valuesTitle', 'La dignité d’abord',
    'valuesContent', '<p>Concevoir une expérience simple, transparente et respectueuse pour chaque candidat, recruteur et établissement.</p>',
    'teamMembers', jsonb_build_array(
      jsonb_build_object(
        'name', 'Colombe Koffi',
        'role', 'about.team.roles.founder_ceo',
        'imageUrl', '/images/Colombe Koffi.jpeg'
      ),
      jsonb_build_object(
        'name', 'Joël K',
        'role', 'about.team.roles.head_of_product',
        'imageUrl', '/images/Joel K.jpeg'
      ),
      jsonb_build_object(
        'name', 'Bethel Touman',
        'role', 'about.team.roles.data_engineer',
        'imageUrl', '/images/Bethel_Touman.jpeg'
      )
    )
  )
  WHERE id = 'about-us'
    AND data = jsonb_build_object(
      'aboutTitle', 'About Yahnu',
      'aboutSubtitle', 'We are on a mission to bridge the gap between education and employment, creating a thriving ecosystem for talent to connect with opportunity in {country} and beyond.',
      'storyTitle', 'Our Story',
      'storyContent1', '<p>Founded by a team of educators and entrepreneurs, Yahnu was born from a shared vision: to unlock the immense potential of graduates by directly connecting them with the industries that need their skills. We saw a disconnect between the classroom and the workplace and set out to build the bridge.</p>',
      'storyContent2', '<p>Today, Yahnu is a dynamic platform that empowers students to launch their careers, helps companies find the right talent efficiently, and enables schools to forge meaningful industry partnerships. We believe in building futures, one connection at a time.</p>',
      'missionTitle', 'Our Mission',
      'missionContent', '<p>To empower graduates, companies, and schools by creating a seamless and efficient ecosystem for talent development and career growth.</p>',
      'visionTitle', 'Our Vision',
      'visionContent', '<p>To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success.</p>',
      'valuesTitle', 'Our Values',
      'valuesContent', '<p>Integrity, Innovation, Collaboration, and an unwavering commitment to the success of our users.</p>',
      'teamMembers', jsonb_build_array(
        jsonb_build_object('name', 'Colombe Koffi', 'role', 'Founder & CEO', 'imageUrl', ''),
        jsonb_build_object('name', 'Joël K', 'role', 'Head of Product & Lead Engineer', 'imageUrl', ''),
        jsonb_build_object('name', 'Bethel Touman', 'role', 'Data Engineer', 'imageUrl', '')
      )
    )
  RETURNING id
)
INSERT INTO audit_logs (
  actor_user_id, action, target_type, target_id, metadata
)
SELECT
  NULL,
  'migration.localize_legacy_about_page',
  'page',
  id,
  jsonb_build_object(
    'reason', 'replace generic prototype copy with Côte d’Ivoire launch content'
  )
FROM localized;

WITH fingerprints (id, title, author) AS (
  VALUES
    (
      'okXTCncxBSJrQIYAnIrm',
      'Entrepreneuriat numérique : Comment Yahnu soutient la nouvelle génération de créateurs en Afrique',
      'Yahnu Staff'
    ),
    (
      'nzi7LABXAQ8GHlRpFxiD',
      'L''avenir du travail en Afrique est à distance',
      'Yanhu Staff'
    )
),
localized AS (
  UPDATE blog_posts AS post
  SET
    content_html = replace(
      post.content_html,
      'Aïda, diplômée en informatique à Dakar',
      'Aïda, diplômée en informatique à Abidjan'
    ),
    author = CASE
      WHEN post.author = 'Yanhu Staff' THEN 'Yahnu Staff'
      ELSE post.author
    END
  FROM fingerprints AS fingerprint
  WHERE post.id = fingerprint.id
    AND post.title = fingerprint.title
    AND post.author = fingerprint.author
    AND post.status = 'published'
    AND position('Aïda, diplômée en informatique à Dakar' IN post.content_html) > 0
  RETURNING post.id, post.title
)
INSERT INTO audit_logs (
  actor_user_id, action, target_type, target_id, metadata
)
SELECT
  NULL,
  'migration.localize_legacy_blog_example',
  'blog_post',
  id,
  jsonb_build_object(
    'reason', 'move the fictional example into the Côte d’Ivoire context',
    'title', title
  )
FROM localized;
