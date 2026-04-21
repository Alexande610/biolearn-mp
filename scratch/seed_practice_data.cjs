const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const practiceData = [
  {
    class_id: 6,
    chapter_id: 1,
    lesson_id: 'practice',
    level: 0,
    title: 'Thực hành: Kỹ năng phòng thí nghiệm & Kính hiển vi',
    game: {
      quizzes: [
        {
          type: 'ordering',
          question: 'Sắp xếp các bước sử dụng kính hiển vi quang học theo đúng thứ tự:',
          options: [
            'Chọn vật kính thích hợp (10x, 40x...)',
            'Điều chỉnh ánh sáng thích hợp',
            'Đặt tiêu bản lên bàn kính, dùng kẹp giữ',
            'Vặn ốc to để hạ vật kính gần sát tiêu bản',
            'Mắt nhìn thị kính, vặn ốc to để đưa vật kính lên đến khi thấy vật',
            'Vặn ốc nhỏ thật chậm để nhìn rõ nét'
          ],
          answer: [0, 1, 2, 3, 4, 5]
        },
        {
          type: 'matching',
          question: 'Nối các biển báo an toàn với ý nghĩa tương ứng:',
          pairs: [
            { left: 'Biển màu đỏ', right: 'Cấm thực hiện' },
            { left: 'Biển màu vàng', right: 'Cảnh báo nguy hiểm' },
            { left: 'Biển màu xanh', right: 'Bắt buộc thực hiện' },
            { left: 'Kí hiệu ngọn lửa', right: 'Chất dễ cháy' }
          ]
        },
        {
          type: 'quiz',
          question: 'Bộ phận nào của kính hiển vi là quan trọng nhất cho việc phóng đại?',
          options: ['Chân kính và thân kính', 'Hệ thống vật kính và thị kính', 'Đèn chiếu sáng', 'Ốc to và ốc nhỏ'],
          answer: 1
        }
      ]
    }
  },
  {
    class_id: 6,
    chapter_id: 1,
    lesson_id: 'practice',
    level: 1,
    title: 'Thực hành: Kỹ năng đo lường và báo cáo',
    game: {
      quizzes: [
        {
          type: 'ordering',
          question: 'Sắp xếp các bước đo chiều dài bằng thước:',
          options: [
            'Ước lượng chiều dài cần đo để chọn thước thích hợp',
            'Đặt thước dọc theo chiều dài, vạch số 0 ngang 1 đầu vật',
            'Mắt nhìn vuông góc với vạch chia của thước',
            'Đọc kết quả theo vạch chia gần nhất với đầu kia của vật',
            'Ghi kết quả đo theo ĐCNN của thước'
          ],
          answer: [0, 1, 2, 3, 4]
        },
        {
          type: 'fill-in-blank',
          question: 'Hoàn thành báo cáo thực hành đo độ dày quyển sách:',
          text: 'Để đo độ dày quyển sách KHTN 6, ta nên chọn thước có (1) ________ thích hợp. Đặt thước (2) ________ theo chiều cần đo. Khi đọc kết quả, mắt phải nhìn (3) ________ với vạch chia. Ghi kết quả theo (4) ________ của thước.',
          blanks: ['độ chia nhỏ nhất', 'dọc', 'vuông góc', 'ĐCNN']
        },
        {
          type: 'matching',
          question: 'Nối dụng cụ đo với đại lượng tương ứng:',
          pairs: [
            { left: 'Thước cuộn', right: 'Chiều dài' },
            { left: 'Cân đồng hồ', right: 'Khối lượng' },
            { left: 'Đồng hồ bấm giây', right: 'Thời gian' },
            { left: 'Nhiệt kế thủy ngân', right: 'Nhiệt độ' }
          ]
        }
      ]
    }
  }
];

async function seedPractice() {
  console.log("Seeding practice data...");
  
  // Clean up existing practice data for this chapter to avoid duplicates
  const { error: deleteError } = await supabase
    .from('lesson_questions')
    .delete()
    .eq('class_id', 6)
    .eq('chapter_id', 1)
    .eq('lesson_id', 'practice');

  if (deleteError) {
    console.warn("Could not delete old practice data:", deleteError);
  }

  const { error: insertError } = await supabase
    .from('lesson_questions')
    .insert(practiceData);

  if (insertError) {
    console.error("Error seeding practice data:", insertError);
  } else {
    console.log("Successfully seeded 2 practice levels for Chapter 1 Class 6.");
  }
}

seedPractice();
