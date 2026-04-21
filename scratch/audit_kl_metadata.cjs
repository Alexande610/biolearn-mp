const path = require('path');
const fs = require('fs');

const klPath = 'c:/TailieucuaMintPhut/sinh học/KL/areas/Sinhhoc';
const classIds = [6, 7, 8, 9, 10, 11, 12];

const results = {};

classIds.forEach(classId => {
  try {
    const indexPath = path.join(klPath, `class${classId}`, 'index.cjs');
    if (!fs.existsSync(indexPath)) return;

    const classModule = require(indexPath);
    
    // Resolve chapters and lessons
    let chapters = classModule.chapters || [];
    let lessons = [];
    
    if (classModule.lessons) {
      lessons = classModule.lessons;
    } else if (classModule.curriculums && classModule.curriculums.ketnoi) {
      lessons = classModule.curriculums.ketnoi.lessons;
    }

    // Map lessons to chapters
    const structuredChapters = chapters.map(ch => {
      const chapterLessons = lessons
        .filter(l => l.chapterId === (ch.chapterId || ch.id))
        .map(l => {
          let numericId = l.lessonId;
          if (typeof l.lessonId === 'string') {
            const matched = l.lessonId.match(/\d+/);
            numericId = matched ? parseInt(matched[0]) + 1000 : 9999;
          }
          return { id: numericId, name: l.title };
        });

      return {
        id: (ch.chapterId || ch.id),
        name: (ch.chapterName || ch.name),
        color: 'from-green-400 to-emerald-600', // Default, can be refined
        icon: ch.icon || '📚',
        lessons: chapterLessons
      };
    });

    results[classId] = {
      name: `Lớp ${classId}`,
      chapters: structuredChapters
    };
  } catch (err) {
    console.error(`Error auditing Class ${classId}:`, err.message);
  }
});

fs.writeFileSync('c:/TailieucuaMintPhut/sinh học/KL/NextGen/scratch/full_class_data.json', JSON.stringify(results, null, 2));
console.log('✅ Audit complete. Saved to scratch/full_class_data.json');
