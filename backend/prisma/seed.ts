import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const demoPassword = await bcrypt.hash('password123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ai-mood-journal.com' },
    update: {},
    create: {
      email: 'demo@ai-mood-journal.com',
      password: demoPassword,
      name: 'Demo User',
      timezone: 'America/New_York',
      preferences: {
        create: {
          theme: 'auto',
          language: 'en',
          notifications: {
            dailyReminder: true,
            reminderTime: '09:00',
            emailNotifications: true,
            insights: true,
            weeklyReport: true,
            monthlyReport: true,
          },
          privacy: {
            dataRetention: 24,
            shareInsights: false,
            anonymizeData: true,
          },
        },
      },
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample tags
  const tags = await Promise.all([
    { name: 'work', color: '#3b82f6' },
    { name: 'personal', color: '#10b981' },
    { name: 'family', color: '#f59e0b' },
    { name: 'health', color: '#ef4444' },
    { name: 'gratitude', color: '#8b5cf6' },
    { name: 'goals', color: '#ec4899' },
    { name: 'reflection', color: '#6b7280' },
    { name: 'stress', color: '#f97316' },
    { name: 'joy', color: '#eab308' },
    { name: 'meditation', color: '#14b8a6' },
  ].map(tag =>
    prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  ));

  console.log(`✅ Created ${tags.length} tags`);

  // Create sample entries for the demo user
  const entries = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip some random days to make it more realistic
    if (Math.random() > 0.8) continue;

    const stress = 3 + Math.random() * 5;
    const happiness = 4 + Math.random() * 5;
    const clarity = 4 + Math.random() * 4;
    const energy = 3 + Math.random() * 6;
    const emotionalStability = 5 + Math.random() * 4;
    const overall = (stress + happiness + clarity + energy + emotionalStability) / 5;

    const entry = await prisma.entry.create({
      data: {
        userId: demoUser.id,
        date,
        transcript: generateSampleTranscript(i),
        duration: Math.floor(30 + Math.random() * 90), // 30-120 seconds
        isPublic: false,
        moodScores: {
          create: {
            stress: Math.round(stress * 10) / 10,
            happiness: Math.round(happiness * 10) / 10,
            clarity: Math.round(clarity * 10) / 10,
            energy: Math.round(energy * 10) / 10,
            emotionalStability: Math.round(emotionalStability * 10) / 10,
            overall: Math.round(overall * 10) / 10,
          },
        },
        analysis: {
          create: {
            sentiment: {
              score: -0.2 + Math.random() * 0.8,
              label: Math.random() > 0.3 ? 'positive' : 'neutral',
              confidence: 0.7 + Math.random() * 0.3,
            },
            emotions: {
              primary: getRandomEmotion(),
              secondary: Math.random() > 0.5 ? getRandomEmotion() : null,
              all: generateEmotionScores(),
            },
            tone: {
              energy: Math.random(),
              valence: Math.random(),
              tension: Math.random(),
            },
            cognitive: {
              clarity: Math.random(),
              focus: Math.random(),
              cognitiveLoad: Math.random(),
            },
            keywords: generateKeywords(),
            confidence: 0.75 + Math.random() * 0.2,
          },
        },
      },
    });

    // Add random tags
    const numTags = Math.floor(Math.random() * 3) + 1;
    const selectedTags = tags.sort(() => Math.random() - 0.5).slice(0, numTags);

    await Promise.all(
      selectedTags.map(tag =>
        prisma.entryTag.create({
          data: {
            entryId: entry.id,
            tagId: tag.id,
          },
        })
      )
    );

    entries.push(entry);
  }

  console.log(`✅ Created ${entries.length} sample entries`);

  // Create sample insights
  const insights = [
    {
      type: 'pattern',
      title: 'Weekend Mood Improvement',
      description: 'Your mood scores tend to be 20% higher on weekends compared to weekdays.',
      confidence: 0.85,
      actionItems: [
        'Consider what contributes to your better weekend mood',
        'Try to incorporate weekend activities into weekdays',
      ],
    },
    {
      type: 'trend',
      title: 'Stress Levels Decreasing',
      description: 'Your stress levels have decreased by 30% over the past month.',
      confidence: 0.78,
      actionItems: [
        'Continue with your current stress management techniques',
        'Share what\'s working in your next entry',
      ],
    },
    {
      type: 'advice',
      title: 'Morning Energy Boost',
      description: 'Your energy levels are lowest in morning entries. Consider starting your day with meditation or light exercise.',
      confidence: 0.72,
      actionItems: [
        'Try a 5-minute morning meditation',
        'Consider a short walk before starting your day',
      ],
    },
    {
      type: 'anomaly',
      title: 'Unusual Stress Spike Detected',
      description: 'Your stress was unusually high three days ago. Consider what might have caused this.',
      confidence: 0.80,
      actionItems: [
        'Review your entry from that day',
        'Identify triggers and plan coping strategies',
      ],
    },
  ];

  await Promise.all(
    insights.map(insight =>
      prisma.insight.create({
        data: {
          userId: demoUser.id,
          ...insight,
        },
      })
    )
  );

  console.log(`✅ Created ${insights.length} sample insights`);

  // Create reminder for demo user
  await prisma.reminder.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      time: '09:00',
      timezone: 'America/New_York',
      isEnabled: true,
    },
  });

  console.log('✅ Created daily reminder');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Demo login credentials:');
  console.log('   Email: demo@ai-mood-journal.com');
  console.log('   Password: password123');
}

// Helper functions
function generateSampleTranscript(dayOffset: number): string {
  const transcripts = [
    "Today was a pretty good day. I had a productive morning at work and managed to finish all my tasks. Feeling quite accomplished.",
    "I'm feeling a bit stressed today with all the deadlines coming up. Had to skip my meditation session, which I regret.",
    "Great day! Spent quality time with family and we went for a nice walk in the park. The weather was perfect.",
    "Feeling tired and a bit overwhelmed today. Didn't get enough sleep last night. Need to prioritize rest tomorrow.",
    "Productive day at work. Had a good workout session in the evening which really helped clear my mind.",
    "Meditation really helped today. Feeling centered and calm. Grateful for the little moments of peace.",
    "Challenging day at work but I handled it well. Proud of how I stayed calm under pressure.",
    "Feeling joyful today! Received good news about a project I've been working on. All the hard work paid off.",
    "A bit of an emotional day. Missing some old friends. But grateful for the memories and the people in my life now.",
    "Good balance today. Work was manageable, had time for hobbies, and connected with a friend in the evening.",
  ];

  return transcripts[dayOffset % transcripts.length] +
    " " +
    "Looking forward to tomorrow and hoping to maintain this positive energy.";
}

function getRandomEmotion(): string {
  const emotions = ['joy', 'calm', 'excited', 'grateful', 'confident', 'hopeful', 'anxious', 'tired', 'frustrated', 'neutral'];
  return emotions[Math.floor(Math.random() * emotions.length)];
}

function generateEmotionScores(): Array<{emotion: string, score: number}> {
  const emotions = ['joy', 'calm', 'excited', 'grateful', 'confident', 'hopeful', 'anxious', 'tired', 'frustrated'];
  return emotions.map(emotion => ({
    emotion,
    score: Math.random(),
  })).sort((a, b) => b.score - a.score).slice(0, 5);
}

function generateKeywords(): string[] {
  const allKeywords = [
    'work', 'family', 'friends', 'health', 'exercise', 'meditation', 'stress', 'joy',
    'grateful', 'accomplished', 'tired', 'energy', 'focus', 'deadline', 'project',
    'success', 'challenge', 'peace', 'calm', 'happy', 'productive', 'rest', 'sleep'
  ];
  const numKeywords = Math.floor(Math.random() * 4) + 3;
  return allKeywords.sort(() => Math.random() - 0.5).slice(0, numKeywords);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });