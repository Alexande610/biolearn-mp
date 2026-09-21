import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validatePublishedStage } from '../src/utils/stationContent.js';

const root = path.resolve('content/stations');
const files = fs.existsSync(root)
  ? fs.readdirSync(root, { recursive: true })
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(root, name))
  : [];

if (files.length === 0) {
  console.error('Không tìm thấy tệp nội dung nào trong content/stations.');
  process.exitCode = 1;
} else {
  const errors = [];
  let stageCount = 0;
  let gameCount = 0;

  for (const file of files) {
    let document;
    try {
      document = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      errors.push(`${file}: JSON không hợp lệ (${error.message}).`);
      continue;
    }

    if (document.schemaVersion !== 1) errors.push(`${file}: schemaVersion phải bằng 1.`);
    if (!Array.isArray(document.stages) || document.stages.length !== 10) {
      errors.push(`${file}: một trạm phải có đúng 10 ải.`);
      continue;
    }

    const dayIndexes = new Set();
    for (const stage of document.stages) {
      stageCount += 1;
      gameCount += Array.isArray(stage.games) ? stage.games.length : 0;
      dayIndexes.add(stage.dayIndex);
      if (!stage.learningObjective?.trim()) errors.push(`${file} ngày ${stage.dayIndex}: thiếu mục tiêu học tập.`);
      if (!Array.isArray(stage.sourceRefs) || stage.sourceRefs.length === 0) errors.push(`${file} ngày ${stage.dayIndex}: thiếu nguồn.`);
      validatePublishedStage({
        grade: document.grade,
        stationId: document.stationId,
        dayIndex: stage.dayIndex,
        games: stage.games,
      }).forEach((error) => errors.push(`${file} ngày ${stage.dayIndex}: ${error}`));
    }
    if (dayIndexes.size !== 10 || [...dayIndexes].some((day) => day < 1 || day > 10)) errors.push(`${file}: dayIndex phải đủ từ 1 đến 10.`);
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Đã kiểm tra ${files.length} tệp, ${stageCount} ải và ${gameCount} trò chơi: hợp lệ.`);
  }
}
