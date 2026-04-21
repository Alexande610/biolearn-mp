const fs = require('fs');

const classData = {
  6: {
    name: "Lớp 6",
    chapters: [
      {
        id: 1, name: "Chương 1: Mở đầu về khoa học tự nhiên",
        color: "from-blue-400 to-indigo-600", icon: "🔬",
        lessons: [
          { id: 1, name: "Bài 1: Giới thiệu về khoa học tự nhiên" },
          { id: 2, name: "Bài 2: An toàn trong phòng thực hành" },
          { id: 3, name: "Bài 3: Sử dụng kính lúp và kính hiển vi" }
        ]
      },
      {
        id: 2, name: "Chương 2: Các cấp độ tổ chức trong thế giới sống",
        color: "from-green-400 to-emerald-600", icon: "🌱",
        lessons: [
          { id: 4, name: "Bài 4: Tế bào - Đơn vị cơ bản của sự sống" },
          { id: 5, name: "Bài 5: Từ tế bào đến cơ thể" }
        ]
      },
      {
        id: 3, name: "Chương 3: Sự đa dạng của thế giới sống",
        color: "from-orange-400 to-amber-600", icon: "🦎",
        lessons: [
          { id: 6, name: "Bài 6: Phân loại thế giới sống" },
          { id: 7, name: "Bài 7: Virus và vi khuẩn" },
          { id: 8, name: "Bài 8: Protozoa và Nấm" },
          { id: 9, name: "Bài 9: Thực vật" },
          { id: 10, name: "Bài 10: Động vật" }
        ]
      }
    ]
  },
  7: {
    name: "Lớp 7",
    chapters: [
      {
        id: 1, name: "Chương 1: Trao đổi chất và chuyển hóa năng lượng",
        color: "from-red-400 to-pink-600", icon: "⚡",
        lessons: [
          { id: 1, name: "Bài 1: Trao đổi chất và năng lượng" },
          { id: 2, name: "Bài 2: Quang hợp ở thực vật" },
          { id: 3, name: "Bài 3: Hô hấp tế bào" }
        ]
      },
      {
        id: 2, name: "Chương 2: Cảm ứng và tập tính",
        color: "from-purple-400 to-violet-600", icon: "🧠",
        lessons: [
          { id: 4, name: "Bài 4: Cảm ứng ở sinh vật" },
          { id: 5, name: "Bài 5: Tập tính ở động vật" }
        ]
      }
    ]
  },
  8: {
    name: "Lớp 8",
    chapters: [
      {
        id: 1, name: "Chương 1: Di truyền và biến dị",
        color: "from-cyan-400 to-blue-600", icon: "🧬",
        lessons: [
          { id: 1, name: "Bài 1: DNA và gene" },
          { id: 2, name: "Bài 2: Nhiễm sắc thể" },
          { id: 3, name: "Bài 3: Giảm phân" }
        ]
      }
    ]
  },
  9: {
    name: "Lớp 9",
    chapters: [
      {
        id: 1, name: "Chương 1: Tiến hóa",
        color: "from-emerald-400 to-green-600", icon: "🦖",
        lessons: [
          { id: 1, name: "Bài 1: Bằng chứng tiến hóa" },
          { id: 2, name: "Bài 2: Các học thuyết tiến hóa" }
        ]
      }
    ]
  },
  10: {
    name: "Lớp 10",
    chapters: [
      { id: 1, name: "Phần mở đầu", color: "from-blue-400 to-indigo-600", icon: "📚", lessons: [{ id: 1, name: "Bài 1: Giới thiệu khái quát môn Sinh học" }, { id: 2, name: "Bài 2: Phương pháp nghiên cứu và học tập" }, { id: 3, name: "Bài 3: Các cấp độ tổ chức thế giới sống" }] },
      { id: 2, name: "Chương 1: Thành phần hóa học của tế bào", color: "from-green-400 to-emerald-600", icon: "⚗️", lessons: [{ id: 4, name: "Bài 4: Các nguyên tố hóa học và nước" }, { id: 5, name: "Bài 5: Các phân tử sinh học" }, { id: 6, name: "Bài 6: Thực hành: Nhận biết phân tử sinh học" }] },
      { id: 3, name: "Chương 2: Cấu trúc tế bào", color: "from-cyan-400 to-blue-600", icon: "🔬", lessons: [{ id: 7, name: "Bài 7: Tế bào nhân sơ" }, { id: 8, name: "Bài 8: Tế bào nhân thực" }, { id: 9, name: "Bài 9: Thực hành: Quan sát tế bào" }] },
      { id: 4, name: "Chương 3: Trao đổi chất qua màng và truyền tin", color: "from-purple-400 to-violet-600", icon: "🔄", lessons: [{ id: 10, name: "Bài 10: Trao đổi chất qua màng tế bào" }, { id: 11, name: "Bài 11: Thực hành: Co và phản co nguyên sinh" }, { id: 12, name: "Bài 12: Truyền tin tế bào" }] },
      { id: 5, name: "Chương 4: Chuyển hóa năng lượng", color: "from-orange-400 to-red-600", icon: "⚡", lessons: [{ id: 13, name: "Bài 13: Khái quát về chuyển hóa vật chất" }, { id: 14, name: "Bài 14: Phân giải và tổng hợp các chất" }] },
      { id: 6, name: "Chương 5: Chu kì tế bào và phân bào", color: "from-pink-400 to-rose-600", icon: "🔁", lessons: [{ id: 16, name: "Bài 16: Chu kì tế bào và nguyên phân" }, { id: 17, name: "Bài 17: Giảm phân" }, { id: 19, name: "Bài 19: Công nghệ tế bào" }] },
      { id: 7, name: "Chương 6: Sinh học vi sinh vật", color: "from-teal-400 to-cyan-600", icon: "🦠", lessons: [{ id: 21, name: "Bài 21: Trao đổi chất và sinh sản vi sinh vật" }, { id: 22, name: "Bài 22: Vai trò và ứng dụng vi sinh vật" }] },
      { id: 8, name: "Chương 7: Virus", color: "from-red-400 to-pink-600", icon: "🔴", lessons: [{ id: 24, name: "Bài 24: Khái quát về virus" }, { id: 25, name: "Bài 25: Một số bệnh do virus" }] }
    ]
  },
  11: {
    name: "Lớp 11",
    chapters: [
      { id: 1, name: "Chương 1: Trao đổi chất và chuyển hóa năng lượng", color: "from-green-400 to-emerald-600", icon: "🌱", lessons: [{ id: 1, name: "Bài 1: Khái quát về trao đổi chất" }, { id: 2, name: "Bài 2: Trao đổi nước ở thực vật" }, { id: 4, name: "Bài 4: Quang hợp ở thực vật" }, { id: 6, name: "Bài 6: Hô hấp ở thực vật" }, { id: 8, name: "Bài 8: Dinh dưỡng ở động vật" }, { id: 9, name: "Bài 9: Hô hấp ở động vật" }, { id: 10, name: "Bài 10: Tuần hoàn ở động vật" }] },
      { id: 2, name: "Chương 2: Cảm ứng ở sinh vật", color: "from-blue-400 to-indigo-600", icon: "🎯", lessons: [{ id: 14, name: "Bài 14: Khái quát về cảm ứng" }, { id: 15, name: "Bài 15: Cảm ứng ở thực vật" }, { id: 17, name: "Bài 17: Cảm ứng ở động vật" }, { id: 18, name: "Bài 18: Tập tính ở động vật" }] },
      { id: 3, name: "Chương 3: Sinh trưởng và phát triển", color: "from-orange-400 to-amber-600", icon: "📈", lessons: [{ id: 19, name: "Bài 19: Khái quát về sinh trưởng" }, { id: 20, name: "Bài 20: Sinh trưởng ở thực vật" }, { id: 22, name: "Bài 22: Sinh trưởng ở động vật" }] },
      { id: 4, name: "Chương 4: Sinh sản ở sinh vật", color: "from-pink-400 to-rose-600", icon: "🌸", lessons: [{ id: 24, name: "Bài 24: Khái quát về sinh sản" }, { id: 25, name: "Bài 25: Sinh sản ở thực vật" }, { id: 27, name: "Bài 27: Sinh sản ở động vật" }] }
    ]
  },
  12: {
    name: "Lớp 12",
    chapters: [
      { id: 1, name: "Chương 1: Di truyền phân tử", color: "from-indigo-400 to-blue-600", icon: "🧬", lessons: [{ id: 1, name: "Bài 1: DNA và cơ chế tái bản" }, { id: 2, name: "Bài 2: Gene và quá trình truyền đạt thông tin" }, { id: 3, name: "Bài 3: Điều hòa biểu hiện gene" }, { id: 4, name: "Bài 4: Đột biến gene" }] },
      { id: 2, name: "Chương 2: Di truyền nhiễm sắc thể", color: "from-purple-400 to-violet-600", icon: "🔬", lessons: [{ id: 6, name: "Bài 6: Cấu trúc nhiễm sắc thể" }, { id: 7, name: "Bài 7: Học thuyết Mendel" }, { id: 10, name: "Bài 10: Di truyền giới tính" }, { id: 11, name: "Bài 11: Liên kết gene" }] },
      { id: 3, name: "Chương 3: Di truyền quần thể", color: "from-teal-400 to-cyan-600", icon: "👥", lessons: [{ id: 8, name: "Bài 8: Cấu trúc di truyền quần thể" }] },
      { id: 4, name: "Chương 4: Ứng dụng di truyền học", color: "from-green-400 to-emerald-600", icon: "🌾", lessons: [{ id: 12, name: "Bài 12: Công nghệ gen" }] }
    ]
  }
};

fs.writeFileSync('c:/TailieucuaMintPhut/sinh học/KL/NextGen/scratch/full_class_data.json', JSON.stringify(classData, null, 2));
console.log('✅ Synchronized metadata saved to scratch/full_class_data.json');
