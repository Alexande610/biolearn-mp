import fs from 'node:fs';

export const writeStation = ({ grade, station, title, book, notes, stages }) => {
  if (stages.length !== 10) throw new Error('Mỗi trạm phải có đúng 10 ải.');
  const source = (lesson) => [{ source: book, publisher: 'Nhà xuất bản Giáo dục Việt Nam', lesson }];
  const gamesFor = (stage, dayIndex) => {
    const common = `Dựa vào kiến thức của ải ${dayIndex}.`;
    const [question, options, answerIndex, hint, explanation] = stage.quiz;
    const [categories, categoryPairs] = stage.category;
    const [textWithBlanks, bankWords, correctWord] = stage.drag;
    return [
      { type: 'quiz', title: 'Chọn đáp án chính xác', data: { question, options, answerIndex, hint, explanation } },
      { type: 'match', title: 'Nối khái niệm với đặc điểm', data: { pairs: stage.match.map(([left, right]) => ({ left, right })), hint: common, explanation: stage.match.map(([left, right]) => `${left}: ${right}`).join('; ') + '.' } },
      { type: 'fill', title: 'Hoàn thiện kiến thức', data: { sentence: stage.fill[0], correctAnswer: stage.fill[1], hint: common, explanation: `Từ cần điền là “${stage.fill[1]}”.` } },
      { type: 'category', title: 'Phân loại đúng nhóm', data: { categories, items: categoryPairs.map(([name, catIndex]) => ({ name, catIndex })), hint: common, explanation: categoryPairs.map(([name, catIndex]) => `${name} thuộc nhóm ${categories[catIndex]}`).join('; ') + '.' } },
      { type: 'dragdrop', title: 'Kéo từ hoàn thành câu', data: { textWithBlanks, bankWords, correctWord, hint: common, explanation: `Từ đúng là “${correctWord}”.` } },
    ];
  };
  const suffix = String(station).padStart(2, '0');
  const document = {
    schemaVersion: 1,
    releaseVersion: `g${grade}-st${station}-2026.1`,
    grade,
    stationId: `g${grade}_st${station}`,
    title: `Lớp ${grade} - Trạm ${station}: ${title}`,
    status: 'draft',
    notes,
    stages: stages.map((stage, index) => ({
      dayIndex: index + 1,
      learningObjective: stage.objective,
      sourceRefs: source(stage.lesson),
      games: gamesFor(stage, index + 1),
    })),
  };
  const directory = `content/stations/grade-${String(grade).padStart(2, '0')}`;
  fs.mkdirSync(directory, { recursive: true });
  const output = `${directory}/station-${suffix}.json`;
  fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Đã tạo ${output}`);
};
