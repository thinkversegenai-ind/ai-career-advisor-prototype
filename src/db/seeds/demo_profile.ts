import { db } from '@/db';
import { userProfiles, assessments, recommendations, tasks, streaks, progress, ratings } from '@/db/schema';

async function main() {
    const demoUserId = 'demo-user-123';
    
    // User Profile
    const sampleUserProfiles = [
        {
            userId: demoUserId,
            name: 'Alex Johnson',
            language: 'en',
            skills: JSON.stringify({ tech: 8, analysis: 6, communication: 7, leadership: 5, creativity: 7 }),
            interests: JSON.stringify(['web-development', 'data-science', 'project-management', 'entrepreneurship', 'machine-learning']),
            profile: JSON.stringify({
                strengths: ['technical skills', 'problem solving', 'analytical thinking'],
                weaknesses: ['public speaking', 'time management'],
                career_match: 'Software Developer'
            })
        }
    ];

    // Assessments
    const sampleAssessments = [
        {
            userId: demoUserId,
            answers: JSON.stringify({
                q1: 'technical',
                q2: 'problem_solver',
                q3: 'team',
                q4: 'remote',
                q5: 'startup',
                q6: 'creative',
                q7: 'structured',
                q8: 'client_facing',
                q9: 'analysis',
                q10: 'leadership'
            }),
            result: JSON.stringify({
                career_match: 'Full Stack Developer',
                primary_skills: ['JavaScript', 'React', 'Node.js'],
                secondary_skills: ['Python', 'SQL', 'Git'],
                confidence: 8.5
            }),
            createdAt: new Date('2024-01-15').getTime(),
            updatedAt: new Date('2024-01-15').getTime(),
        },
        {
            userId: demoUserId,
            answers: JSON.stringify({
                q1: 'creative',
                q2: 'collaborator',
                q3: 'hybrid',
                q4: 'established_company',
                q5: 'technical',
                q6: 'organized',
                q7: 'back_end',
                q8: 'independent',
                q9: 'implementation',
                q10: 'mentor'
            }),
            result: JSON.stringify({
                career_match: 'DevOps Engineer',
                primary_skills: ['AWS', 'Docker', 'Kubernetes'],
                secondary_skills: ['Jenkins', 'Terraform', 'Python'],
                confidence: 9.2
            }),
            createdAt: new Date('2024-02-01').getTime(),
            updatedAt: new Date('2024-02-01').getTime(),
        },
        {
            userId: demoUserId,
            answers: JSON.stringify({
                q1: 'analytical',
                q2: 'team',
                q3: 'office',
                q4: 'startup',
                q5: 'business',
                q6: 'structured',
                q7: 'full_stack',
                q8: 'communication',
                q9: 'data',
                q10: 'manager'
            }),
            result: JSON.stringify({
                career_match: 'Technical Project Manager',
                primary_skills: ['Agile', 'Scrum', 'Communication'],
                secondary_skills: ['SQL', 'Jira', 'Excel'],
                confidence: 8.8
            }),
            createdAt: new Date('2024-02-20').getTime(),
            updatedAt: new Date('2024-02-20').getTime(),
        }
    ];

    // Recommendations
    const sampleRecommendations = [
        {
            userId: demoUserId,
            careers: JSON.stringify([
                { title: 'Full Stack Developer', match: 92, average_salary: 95000 },
                { title: 'Software Engineer', match: 88, average_salary: 90000 },
                { title: 'DevOps Engineer', match: 85, average_salary: 105000 },
                { title: 'Technical Project Manager', match: 82, average_salary: 98000 }
            ]),
            resources: JSON.stringify([
                { title: 'Complete Web Developer Course', url: '/resources/1', type: 'course' },
                { title: 'React Documentation', url: '/resources/2', type: 'documentation' },
                { title: 'Clean Code Book', url: '/resources/3', type: 'book' },
                { title: 'JavaScript Algorithms', url: '/resources/4', type: 'tutorial' }
            ]),
            createdAt: new Date('2024-02-25').getTime(),
            updatedAt: new Date('2024-02-25').getTime(),
        }
    ];

    // Tasks
    const sampleTasks = [
        {
            userId: demoUserId,
            label: 'Complete Advanced JavaScript Tutorial',
            skill: 'tech',
            done: true,
            dueDate: '2024-01-31',
            createdAt: new Date('2024-01-20').getTime(),
            updatedAt: new Date('2024-01-30').getTime(),
        },
        {
            userId: demoUserId,
            label: 'Practice System Design',
            skill: 'analysis',
            done: true,
            dueDate: '2024-02-10',
            createdAt: new Date('2024-01-25').getTime(),
            updatedAt: new Date('2024-02-08').getTime(),
        },
        {
            userId: demoUserId,
            label: 'Update Resume on LinkedIn',
            skill: 'communication',
            done: false,
            dueDate: '2024-03-01',
            createdAt: new Date('2024-02-01').getTime(),
            updatedAt: new Date('2024-02-01').getTime(),
        },
        {
            userId: demoUserId,
            label: 'Complete Python Data Analysis Course',
            skill: 'tech',
            done: false,
            dueDate: '2024-03-15',
            createdAt: new Date('2024-02-10').getTime(),
            updatedAt: new Date('2024-02-10').getTime(),
        },
        {
            userId: demoUserId,
            label: 'Write Technical Blog Post',
            skill: 'communication',
            done: false,
            dueDate: '2024-03-20',
            createdAt: new Date('2024-02-15').getTime(),
            updatedAt: new Date('2024-02-15').getTime(),
        },
        {
            userId: demoUserId,
            label: 'Prepare for Mock Interview',
            skill: 'analysis',
            done: false,
            dueDate: '2024-03-25',
            createdAt: new Date('2024-02-20').getTime(),
            updatedAt: new Date('2024-02-20').getTime(),
        }
    ];

    // Streaks
    const sampleStreaks = [
        {
            userId: demoUserId,
            currentStreak: 15,
            lastActiveDate: '2024-02-28',
            createdAt: new Date('2024-01-10').getTime(),
            updatedAt: new Date('2024-02-28').getTime(),
        }
    ];

    // Progress
    const sampleProgress = [
        {
            userId: demoUserId,
            resourceId: 1,
            completion: 75,
            createdAt: new Date('2024-01-15').getTime(),
            updatedAt: new Date('2024-02-25').getTime(),
        },
        {
            userId: demoUserId,
            resourceId: 2,
            completion: 100,
            createdAt: new Date('2024-01-20').getTime(),
            updatedAt: new Date('2024-02-10').getTime(),
        },
        {
            userId: demoUserId,
            resourceId: 3,
            completion: 30,
            createdAt: new Date('2024-02-01').getTime(),
            updatedAt: new Date('2024-02-15').getTime(),
        }
    ];

    // Ratings
    const sampleRatings = [
        {
            userId: demoUserId,
            resourceId: 1,
            rating: 5,
            comment: 'Excellent course with hands-on projects. Really helped me understand modern web development.',
            createdAt: new Date('2024-02-10').getTime(),
            updatedAt: new Date('2024-02-10').getTime(),
        },
        {
            userId: demoUserId,
            resourceId: 2,
            rating: 4,
            comment: 'Great documentation, comprehensive but sometimes overwhelming for beginners.',
            createdAt: new Date('2024-02-12').getTime(),
            updatedAt: new Date('2024-02-12').getTime(),
        },
        {
            userId: demoUserId,
            resourceId: 3,
            rating: 5,
            comment: 'Timeless principles that every developer should know. Changed my approach to coding.',
            createdAt: new Date('2024-02-18').getTime(),
            updatedAt: new Date('2024-02-18').getTime(),
        }
    ];

    await db.insert(userProfiles).values(sampleUserProfiles);
    await db.insert(assessments).values(sampleAssessments);
    await db.insert(recommendations).values(sampleRecommendations);
    await db.insert(tasks).values(sampleTasks);
    await db.insert(streaks).values(sampleStreaks);
    await db.insert(progress).values(sampleProgress);
    await db.insert(ratings).values(sampleRatings);
    
    console.log('✅ Demo profile seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});