import os

filepath = r'c:\TailieucuaMintPhut\sinh học\KL\NextGen\src\pages\MapPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_marker = '  // Xử lý học vượt chương'
end_marker = '  const renderChapterReview = (chapter, isLeft, completed) => {'

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if start_marker in line:
        start_idx = i
    if end_marker in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_code = [
        '  // Xử lý học vượt chương\n',
        '  const handleSkipChapter = async () => {\n',
        '    if (skipLoading || !user) return;\n',
        '    \n',
        '    const chapterToSkip = selectedChapterForSkip;\n',
        '    if (!chapterToSkip) return;\n',
        '    \n',
        '    setSkipLoading(true);\n',
        '    try {\n',
        '      // Chuyển hướng đến màn thử thách thay vì cộng thưởng ngay\n',
        '      setShowSkipModal(false);\n',
        '      const firstLessonId = chapterToSkip.lessons[0]?.id || 1;\n',
        '      \n',
        '      // Chế độ "skip-challenge" sẽ yêu cầu trả lời đúng 5 câu hỏi nâng cao\n',
        '      navigate(`/play/${normalizedClassId}/${chapterToSkip.id}/${firstLessonId}?type=skip-challenge&mode=challenge`);\n',
        '      \n',
        '      setSelectedChapterForSkip(null);\n',
        '    } catch (err) {\n',
        '      console.error("Error skipping chapter:", err);\n',
        '    }\n',
        '    setSkipLoading(false);\n',
        '  };\n',
        '\n'
    ]
    
    lines[start_idx:end_idx] = new_code
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("✅ Patch successful!")
else:
    print(f"❌ Could not find markers: start={start_idx}, end={end_idx}")
