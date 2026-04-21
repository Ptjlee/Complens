-- ============================================================
-- Migration 028: Add 3 new dimension columns to level tables
-- Knowledge & Expertise, Communication & Influence,
-- Autonomy & Decision Rights
-- ============================================================

-- Add 3 new dimension columns to level_definitions
ALTER TABLE level_definitions
ADD COLUMN IF NOT EXISTS knowledge_expertise TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS communication_influence TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS autonomy_decision_rights TEXT DEFAULT NULL;

-- Add same columns to default_level_definitions (template)
ALTER TABLE default_level_definitions
ADD COLUMN IF NOT EXISTS knowledge_expertise TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS communication_influence TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS autonomy_decision_rights TEXT DEFAULT NULL;

-- Backfill the default_level_definitions with dimensional data
UPDATE default_level_definitions SET
    problem_solving = 'Solves routine, well-defined problems using documented procedures and close guidance',
    accountability = 'Accountable for completing assigned tasks accurately and on time. Errors are caught by supervision',
    people_management = 'No direct reports. Receives mentoring from more senior colleagues',
    knowledge_expertise = 'Foundational knowledge; actively learning core concepts and tools of the domain',
    communication_influence = 'Communicates within immediate team. Asks questions, reports progress',
    autonomy_decision_rights = 'Works under close supervision with detailed instructions. Escalates all non-routine decisions'
WHERE level = 'L1';

UPDATE default_level_definitions SET
    problem_solving = 'Solves straightforward problems within established frameworks with some guidance',
    accountability = 'Accountable for own task delivery within defined timelines and quality standards',
    people_management = 'No direct reports. Collaborates with peers',
    knowledge_expertise = 'Developing knowledge of core domain. Applies learned concepts under guidance',
    communication_influence = 'Communicates within team. Shares updates and asks for clarification',
    autonomy_decision_rights = 'Works with regular check-ins. Follows established processes with limited deviation'
WHERE level = 'L2';

UPDATE default_level_definitions SET
    problem_solving = 'Solves moderately complex problems within established frameworks. Identifies issues and proposes solutions',
    accountability = 'Accountable for own work output and quality. Contributes to team-level deliverables',
    people_management = 'No direct reports. May informally guide junior colleagues or interns',
    knowledge_expertise = 'Solid working knowledge of core domain. Applies standard practices confidently',
    communication_influence = 'Communicates across team and with adjacent stakeholders. Presents work to peers and manager',
    autonomy_decision_rights = 'Works independently on defined tasks. Exercises judgement within guidelines; escalates exceptions'
WHERE level = 'L3';

UPDATE default_level_definitions SET
    problem_solving = 'Analyses complex problems across related domains; develops and evaluates multiple solution approaches',
    accountability = 'Accountable for project outcomes and quality standards within discipline. Decisions affect team output',
    people_management = 'May mentor 1-3 junior staff. Provides technical guidance and code/work reviews',
    knowledge_expertise = 'Deep expertise in core domain with solid understanding of adjacent areas',
    communication_influence = 'Communicates across teams and with mid-level stakeholders. Influences technical decisions',
    autonomy_decision_rights = 'Works independently; makes tactical decisions within guidelines. Sets own priorities'
WHERE level = 'L4';

UPDATE default_level_definitions SET
    problem_solving = 'Tackles complex, cross-functional problems. Develops new approaches when existing methods fall short',
    accountability = 'Accountable for workstream or project outcomes. Decisions affect team productivity and quality',
    people_management = 'May lead a small team (2-5) or act as technical lead without formal reports. Mentors and coaches',
    knowledge_expertise = 'Deep expertise in core domain with solid understanding of adjacent areas. Recognised internally as expert',
    communication_influence = 'Communicates across functions and with senior stakeholders. Influences technical and process decisions',
    autonomy_decision_rights = 'Drives own agenda within strategic direction. Makes independent decisions on approach and methodology'
WHERE level = 'L5';

UPDATE default_level_definitions SET
    problem_solving = 'Solves complex problems spanning multiple teams or domains. Balances competing priorities and trade-offs',
    accountability = 'Accountable for team-level outcomes, budgets, and talent development',
    people_management = 'Manages a team of 5-15 professionals. Hires, develops, and performance-manages direct reports',
    knowledge_expertise = 'Broad expertise across domain. Understands organisational context and business implications',
    communication_influence = 'Communicates with senior leadership and cross-functional peers. Negotiates resources and priorities',
    autonomy_decision_rights = 'Operates with significant autonomy within departmental strategy. Makes hiring and resource allocation decisions'
WHERE level = 'L6';

UPDATE default_level_definitions SET
    problem_solving = 'Addresses strategic problems with organisational implications. Anticipates risks and develops contingency plans',
    accountability = 'Accountable for multiple teams or a function. Owns significant budget and headcount decisions',
    people_management = 'Manages 15-30 staff including team leads. Develops next-generation managers',
    knowledge_expertise = 'Expert across multiple domains. Contributes to industry best practices and standards',
    communication_influence = 'Communicates with executives and external partners. Shapes departmental narrative and strategy',
    autonomy_decision_rights = 'Sets functional priorities autonomously. Makes decisions with significant financial and organisational impact'
WHERE level = 'L7';

UPDATE default_level_definitions SET
    problem_solving = 'Addresses ambiguous, multi-stakeholder problems with significant financial and organisational impact',
    accountability = 'Accountable for department-level P&L, strategic outcomes, and talent development pipeline',
    people_management = 'Leads 30-80+ staff across multiple teams. Hires, develops, and promotes managers',
    knowledge_expertise = 'Expert across multiple domains. External thought leader. Shapes industry practices',
    communication_influence = 'Presents to C-suite and board. Represents the organisation externally. Shapes company positioning',
    autonomy_decision_rights = 'Sets department direction autonomously. Makes binding commitments for the organisation'
WHERE level = 'L8';

UPDATE default_level_definitions SET
    problem_solving = 'Solves enterprise-level strategic challenges. Navigates regulatory, market, and competitive complexity',
    accountability = 'Accountable for business unit or major functional outcomes. Shapes multi-year strategy',
    people_management = 'Leads 80-300+ staff across multiple departments. Shapes organisational design',
    knowledge_expertise = 'Thought leader with deep and broad expertise. Advises on industry direction',
    communication_influence = 'Board-level communication. Investor and regulator-facing. Defines functional narrative',
    autonomy_decision_rights = 'Full executive authority within mandate. Makes strategic bets with long-term consequences'
WHERE level = 'L9';

UPDATE default_level_definitions SET
    problem_solving = 'Defines which problems the organisation should solve. Navigates geopolitical, market, and regulatory complexity',
    accountability = 'Accountable for enterprise-level outcomes: revenue, market position, compliance, culture',
    people_management = 'Leads entire functions or business units (100-1000+ staff). Shapes organisational design',
    knowledge_expertise = 'Visionary expertise. Sets the standard for the industry. Advises boards and regulators',
    communication_influence = 'Board-level communication. Media, investor, and regulator-facing. Defines company narrative',
    autonomy_decision_rights = 'Full executive authority within mandate. Reports to board/CEO. Makes irreversible strategic bets'
WHERE level = 'L10';
