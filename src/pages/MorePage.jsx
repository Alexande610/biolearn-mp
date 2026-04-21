import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, BookOpen,
  ChevronRight, ChevronDown, ChevronUp, ExternalLink, X,
  Microscope, Gamepad2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Lesson data với tên chương đúng từ SGK và nội dung tóm tắt
const lessonsData = {
  6: {
    name: 'Lớp 6',
    color: 'from-green-400 to-emerald-600',
    chapters: [
      {
        id: 'V',
        name: 'Chương V: Tế bào',
        lectureFile: '/study/grade 6/Chương V-lớp 6.pptx',
        lessons: [
          { id: 1, name: 'Bài 17: Tế bào - Đơn vị cơ sở của sự sống', summary: 'Tìm hiểu cấu tạo và chức năng của tế bào - đơn vị cấu tạo và hoạt động sống cơ bản của sinh vật.' },
          { id: 2, name: 'Bài 18: Cấu tạo tế bào', summary: 'Màng sinh chất, tế bào chất, nhân tế bào và các bào quan. So sánh tế bào động vật và thực vật.' },
          { id: 3, name: 'Bài 19: Sự lớn lên và phân chia tế bào', summary: 'Quá trình sinh trưởng và phân bào. Ý nghĩa của sự phân chia tế bào.' },
        ]
      },
      {
        id: 'VI',
        name: 'Chương VI: Từ tế bào đến cơ thể',
        lectureFile: '/study/grade 6/Chương VI-lớp 6.pptx',
        lessons: [
          { id: 4, name: 'Bài 20: Từ tế bào đến mô', summary: 'Khái niệm mô. Các loại mô trong cơ thể sinh vật đa bào.' },
          { id: 5, name: 'Bài 21: Từ mô đến cơ quan', summary: 'Cơ quan được cấu tạo từ các mô. Ví dụ về các cơ quan.' },
          { id: 6, name: 'Bài 22: Từ cơ quan đến hệ cơ quan và cơ thể', summary: 'Hệ cơ quan và cơ thể hoàn chỉnh. Cơ thể đơn bào và đa bào.' },
        ]
      },
      {
        id: 'VII',
        name: 'Chương VII: Đa dạng thế giới sống',
        lectureFile: '/study/grade 6/Chương VII-lớp 6.pptx',
        lessons: [
          { id: 7, name: 'Bài 23: Phân loại thế giới sống', summary: 'Hệ thống phân loại sinh vật. Các giới sinh vật: Khởi sinh, Nguyên sinh, Nấm, Thực vật, Động vật.' },
          { id: 8, name: 'Bài 24-25: Virus và Vi khuẩn', summary: 'Đặc điểm virus - sinh vật không có cấu tạo tế bào. Vi khuẩn - sinh vật nhân sơ.' },
          { id: 9, name: 'Bài 26-27: Nguyên sinh vật', summary: 'Đặc điểm chung của giới Nguyên sinh. Trùng roi, trùng biến hình, trùng giày.' },
          { id: 10, name: 'Bài 28-30: Nấm', summary: 'Đặc điểm chung của nấm. Nấm đơn bào và đa bào. Vai trò của nấm.' },
          { id: 11, name: 'Bài 31-37: Thực vật', summary: 'Đa dạng thực vật: Rêu, Dương xỉ, Hạt trần, Hạt kín. Vai trò của thực vật.' },
          { id: 12, name: 'Bài 38-42: Động vật', summary: 'Đa dạng động vật: Không xương sống và Có xương sống. Đặc điểm và vai trò.' },
        ]
      },
    ]
  },
  7: {
    name: 'Lớp 7',
    color: 'from-blue-400 to-indigo-600',
    chapters: [
      {
        id: 'VII',
        name: 'Chương VII: Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
        lectureFile: '/study/grade 7/Chương VII-lớp 7.pptx',
        lessons: [
          { id: 1, name: 'Bài 1: Khái quát về trao đổi chất và chuyển hóa năng lượng', summary: 'Trao đổi chất và năng lượng là đặc trưng cơ bản của sự sống. Đồng hóa và dị hóa.' },
          { id: 2, name: 'Bài 2-3: Quang hợp ở thực vật', summary: 'Quang hợp là quá trình tổng hợp chất hữu cơ. Vai trò của ánh sáng và lục lạp.' },
          { id: 3, name: 'Bài 4-5: Hô hấp tế bào', summary: 'Hô hấp là quá trình phân giải chất hữu cơ. Ti thể và vai trò sản sinh ATP.' },
          { id: 4, name: 'Bài 6-8: Trao đổi chất và năng lượng ở thực vật', summary: 'Trao đổi nước và khoáng. Vận chuyển các chất trong cây.' },
          { id: 5, name: 'Bài 9-12: Trao đổi chất và năng lượng ở động vật', summary: 'Tiêu hóa, hô hấp, tuần hoàn ở động vật. So sánh các hệ cơ quan.' },
        ]
      },
      {
        id: 'VIII',
        name: 'Chương VIII: Cảm ứng ở sinh vật',
        lectureFile: '/study/grade 7/Chương VIII-lớp 7.pptx',
        lessons: [
          { id: 6, name: 'Bài 13: Khái quát về cảm ứng ở sinh vật', summary: 'Cảm ứng là khả năng phản ứng với kích thích từ môi trường.' },
          { id: 7, name: 'Bài 14-15: Cảm ứng ở thực vật', summary: 'Hướng động (hướng sáng, hướng trọng lực). Ứng động.' },
          { id: 8, name: 'Bài 16-17: Cảm ứng ở động vật', summary: 'Phản xạ không điều kiện và có điều kiện. Hệ thần kinh.' },
        ]
      },
      {
        id: 'IX',
        name: 'Chương IX: Sinh trưởng và phát triển ở sinh vật',
        lectureFile: '/study/grade 7/Chương IX-lớp 7.pptx',
        lessons: [
          { id: 9, name: 'Bài 18: Khái quát về sinh trưởng và phát triển', summary: 'Sinh trưởng là tăng kích thước. Phát triển là biến đổi về chất.' },
          { id: 10, name: 'Bài 19-20: Sinh trưởng và phát triển ở thực vật', summary: 'Mô phân sinh. Hormone thực vật. Các giai đoạn phát triển.' },
          { id: 11, name: 'Bài 21-22: Sinh trưởng và phát triển ở động vật', summary: 'Các giai đoạn phát triển. Biến thái hoàn toàn và không hoàn toàn.' },
        ]
      },
      {
        id: 'X',
        name: 'Chương X: Sinh sản ở sinh vật',
        lectureFile: '/study/grade 7/Chương X-lớp 7.pptx',
        lessons: [
          { id: 12, name: 'Bài 23-24: Sinh sản vô tính', summary: 'Sinh sản không có sự kết hợp giao tử. Các hình thức: phân đôi, nảy chồi, bào tử, sinh dưỡng.' },
          { id: 13, name: 'Bài 25-27: Sinh sản hữu tính ở thực vật', summary: 'Hoa và thụ phấn. Thụ tinh. Quả và hạt.' },
          { id: 14, name: 'Bài 28-29: Sinh sản hữu tính ở động vật', summary: 'Sinh sản hữu tính ở động vật. Thụ tinh trong và ngoài.' },
        ]
      },
    ]
  },
  8: {
    name: 'Lớp 8',
    color: 'from-purple-400 to-violet-600',
    chapters: [
      {
        id: 'VII',
        name: 'Chương VII: Sinh học cơ thể người',
        lectureFile: '/study/grade 8/Chương VII-lớp 8.pptx',
        lessons: [
          { id: 1, name: 'Bài 1-3: Giới thiệu cơ thể người', summary: 'Các cấp độ tổ chức cơ thể người. Tế bào, mô, cơ quan, hệ cơ quan.' },
          { id: 2, name: 'Bài 4-5: Hệ vận động', summary: 'Bộ xương và cơ. Chức năng nâng đỡ và vận động. Vệ sinh hệ vận động.' },
          { id: 3, name: 'Bài 6-9: Hệ tuần hoàn', summary: 'Tim và mạch máu. Máu và các thành phần. Miễn dịch. Vệ sinh hệ tuần hoàn.' },
          { id: 4, name: 'Bài 10-12: Hệ hô hấp', summary: 'Cấu tạo hệ hô hấp. Trao đổi khí ở phổi và mô. Vệ sinh hệ hô hấp.' },
          { id: 5, name: 'Bài 13-16: Hệ tiêu hóa', summary: 'Các cơ quan tiêu hóa. Tiêu hóa ở khoang miệng, dạ dày, ruột. Hấp thụ chất dinh dưỡng.' },
          { id: 6, name: 'Bài 17-18: Hệ bài tiết', summary: 'Cấu tạo thận. Quá trình tạo nước tiểu. Vệ sinh hệ bài tiết.' },
          { id: 7, name: 'Bài 19-21: Hệ thần kinh', summary: 'Neuron và dẫn truyền thần kinh. Não bộ và tủy sống. Phản xạ.' },
          { id: 8, name: 'Bài 22-23: Các giác quan', summary: 'Mắt và thị giác. Tai và thính giác. Vệ sinh các giác quan.' },
          { id: 9, name: 'Bài 24-26: Hệ nội tiết', summary: 'Tuyến nội tiết và hormone. Điều hòa hoạt động cơ thể.' },
          { id: 10, name: 'Bài 27-29: Da và điều hòa thân nhiệt', summary: 'Cấu tạo da. Chức năng bảo vệ và điều nhiệt.' },
          { id: 11, name: 'Bài 30-31: Hệ sinh dục', summary: 'Cơ quan sinh dục nam và nữ. Thụ tinh và phát triển phôi thai.' },
        ]
      },
      {
        id: 'VIII',
        name: 'Chương VIII: Sinh vật và môi trường',
        lectureFile: '/study/grade 8/Chương VIII-lớp 8.pptx',
        lessons: [
          { id: 12, name: 'Bài 32-33: Môi trường sống', summary: 'Các nhân tố sinh thái. Ảnh hưởng của môi trường đến sinh vật.' },
          { id: 13, name: 'Bài 34-35: Quần thể sinh vật', summary: 'Khái niệm quần thể. Đặc trưng của quần thể.' },
          { id: 14, name: 'Bài 36-37: Quần xã sinh vật', summary: 'Quần xã và các mối quan hệ. Diễn thế sinh thái.' },
          { id: 15, name: 'Bài 38-40: Hệ sinh thái và bảo vệ môi trường', summary: 'Chuỗi thức ăn, lưới thức ăn. Bảo vệ đa dạng sinh học.' },
        ]
      },
    ]
  },
  9: {
    name: 'Lớp 9',
    color: 'from-red-400 to-rose-600',
    chapters: [
      {
        id: 'XI',
        name: 'Chương XI: Di truyền học Mendel - Cơ sở phân tử của hiện tượng di truyền',
        lectureFile: '/study/grade 9/Chương XI-lớp 9.pptx',
        lessons: [
          { id: 1, name: 'Bài 1-2: Mendel và di truyền học', summary: 'Các thí nghiệm của Mendel. Định luật phân li và phân li độc lập.' },
          { id: 2, name: 'Bài 3-4: Gen và ADN', summary: 'Cấu trúc ADN xoắn kép. Gen là đơn vị di truyền.' },
          { id: 3, name: 'Bài 5-6: Nhân đôi ADN và phiên mã', summary: 'Quá trình nhân đôi ADN. ARN và quá trình phiên mã.' },
          { id: 4, name: 'Bài 7-8: Dịch mã và mã di truyền', summary: 'Protein và dịch mã. Mã di truyền và bảng mã.' },
        ]
      },
      {
        id: 'XII',
        name: 'Chương XII: Di truyền nhiễm sắc thể',
        lectureFile: '/study/grade 9/Chương XII-lớp 9.pptx',
        lessons: [
          { id: 5, name: 'Bài 9-10: Nhiễm sắc thể', summary: 'Cấu trúc NST. Bộ NST của loài. NST giới tính.' },
          { id: 6, name: 'Bài 11-12: Nguyên phân và giảm phân', summary: 'Các kỳ của nguyên phân và giảm phân. Ý nghĩa sinh học.' },
          { id: 7, name: 'Bài 13-14: Di truyền liên kết và hoán vị gen', summary: 'Gen liên kết trên cùng NST. Hoán vị gen và bản đồ gen.' },
        ]
      },
      {
        id: 'XIII',
        name: 'Chương XIII: Di truyền học với con người và đời sống',
        lectureFile: '/study/grade 9/Chương XIII-lớp 9.pptx',
        lessons: [
          { id: 8, name: 'Bài 15-16: Đột biến gen và NST', summary: 'Các dạng đột biến. Nguyên nhân và hậu quả của đột biến.' },
          { id: 9, name: 'Bài 17-18: Di truyền người', summary: 'Bệnh di truyền. Tư vấn di truyền và ứng dụng.' },
          { id: 10, name: 'Bài 19-20: Công nghệ gen', summary: 'Kỹ thuật di truyền. Sinh vật biến đổi gen. Đạo đức sinh học.' },
        ]
      },
      {
        id: 'XIV',
        name: 'Chương XIV: Tiến hóa',
        lectureFile: '/study/grade 9/Chương XIV-lớp 9.pptx',
        lessons: [
          { id: 11, name: 'Bài 21-22: Bằng chứng tiến hóa', summary: 'Bằng chứng giải phẫu so sánh, phôi sinh học, sinh học phân tử.' },
          { id: 12, name: 'Bài 23-24: Học thuyết tiến hóa', summary: 'Darwin và chọn lọc tự nhiên. Thuyết tiến hóa tổng hợp.' },
          { id: 13, name: 'Bài 25-26: Nguồn gốc sự sống và loài người', summary: 'Sự phát sinh sự sống. Nguồn gốc loài người.' },
        ]
      },
    ]
  },
  10: {
    name: 'Lớp 10',
    color: 'from-cyan-400 to-teal-600',
    parts: [
      {
        id: 'MD',
        name: 'Phần mở đầu',
        lectureFile: '/study/grade 10/Phần mở đầu.pptx',
        lessons: [
          { id: 1, name: 'Bài 1: Giới thiệu khái quát môn Sinh học', summary: 'Khái quát vai trò, đối tượng và định hướng học tập môn Sinh học.' },
          { id: 2, name: 'Bài 2: Phương pháp nghiên cứu và học tập môn Sinh học', summary: 'Rèn phương pháp nghiên cứu khoa học và cách học tập hiệu quả môn Sinh học.' },
          { id: 3, name: 'Bài 3: Các cấp tổ chức của thế giới sống', summary: 'Tìm hiểu các cấp tổ chức từ phân tử đến sinh quyển trong thế giới sống.' },
        ]
      },
      {
        id: 'I-1',
        name: 'Phần một: Sinh học tế bào (Chương I, II, III)',
        lectureFile: '/study/grade 10/Phần I-Chương I, II,III-lớp 10.pptx',
        chapters: [
          {
            id: 'I',
            name: 'Chương 1: Thành phần hóa học của tế bào',
            lessons: [
              { id: 4, name: 'Bài 4: Các nguyên tố hóa học và nước', summary: 'Vai trò của nguyên tố hóa học và nước trong cấu trúc, chức năng tế bào.' },
              { id: 5, name: 'Bài 5: Các phân tử sinh học', summary: 'Các nhóm phân tử sinh học và chức năng sinh học cơ bản trong tế bào.' },
              { id: 6, name: 'Bài 6: Thực hành - Nhận biết một số phân tử sinh học', summary: 'Thực hành nhận biết, quan sát và phân tích một số phân tử sinh học thông dụng.' },
            ]
          },
          {
            id: 'II',
            name: 'Chương 2: Cấu trúc tế bào',
            lessons: [
              { id: 7, name: 'Bài 7: Tế bào nhân sơ', summary: 'Đặc điểm cấu trúc, tổ chức và vai trò của tế bào nhân sơ.' },
              { id: 8, name: 'Bài 8: Tế bào nhân thực', summary: 'Thành phần, bào quan và sự chuyên hóa của tế bào nhân thực.' },
              { id: 9, name: 'Bài 9: Thực hành - Quan sát tế bào', summary: 'Thực hành quan sát mẫu tế bào và nhận diện các cấu trúc đặc trưng.' },
            ]
          },
          {
            id: 'III',
            name: 'Chương 3: Trao đổi chất qua màng và truyền tin tế bào',
            lessons: [
              { id: 10, name: 'Bài 10: Trao đổi chất qua màng tế bào', summary: 'Cơ chế vận chuyển thụ động, chủ động và nhập bào - xuất bào qua màng.' },
              { id: 11, name: 'Bài 11: Thực hành - Thí nghiệm co và phản co nguyên sinh', summary: 'Thực hành quan sát hiện tượng co - phản co nguyên sinh ở tế bào thực vật.' },
              { id: 12, name: 'Bài 12: Truyền tin tế bào', summary: 'Các con đường truyền tin giúp tế bào tiếp nhận và đáp ứng tín hiệu.' },
            ]
          },
        ]
      },
      {
        id: 'I-2',
        name: 'Phần một: Sinh học tế bào (Chương IV, V)',
        lectureFile: '/study/grade 10/Phần I-Chương IV, V-lớp 10.pptx',
        chapters: [
          {
            id: 'IV',
            name: 'Chương 4: Chuyển hóa năng lượng trong tế bào',
            lessons: [
              { id: 13, name: 'Bài 13: Khái quát về chuyển hóa vật chất và năng lượng', summary: 'Khái quát đồng hóa, dị hóa và dòng năng lượng trong tế bào.' },
              { id: 14, name: 'Bài 14: Phân giải và tổng hợp các chất trong tế bào', summary: 'Các quá trình phân giải, tổng hợp chất và vai trò enzyme.' },
              { id: 15, name: 'Bài 15: Thực hành - Thí nghiệm phân tích ảnh hưởng của một số yếu tố đến hoạt tính enzyme và kiểm tra hoạt tính enzyme amylase', summary: 'Thực hành khảo sát các yếu tố ảnh hưởng đến hoạt tính enzyme amylase.' },
            ]
          },
          {
            id: 'V',
            name: 'Chương 5: Chu kì tế bào và phân bào',
            lessons: [
              { id: 16, name: 'Bài 16: Chu kì tế bào và nguyên phân', summary: 'Các pha của chu kì tế bào và cơ chế nguyên phân.' },
              { id: 17, name: 'Bài 17: Giảm phân', summary: 'Diễn biến giảm phân và ý nghĩa trong di truyền, sinh sản.' },
              { id: 18, name: 'Bài 18: Thực hành - Làm và quan sát tiêu bản quá trình nguyên phân và giảm phân', summary: 'Thực hành làm tiêu bản và quan sát các kì phân bào.' },
              { id: 19, name: 'Bài 19: Công nghệ tế bào', summary: 'Ứng dụng công nghệ tế bào trong nghiên cứu và sản xuất.' },
            ]
          },
        ]
      },
      {
        id: 'II',
        name: 'Phần hai: Sinh học vi sinh vật và virus',
        lectureFile: '/study/grade 10/Phần II-Chương VI, VII-lớp 10.pptx',
        chapters: [
          {
            id: 'VI',
            name: 'Chương 6: Sinh học vi sinh vật',
            lessons: [
              { id: 20, name: 'Bài 20: Sự đa dạng và phương pháp nghiên cứu vi sinh vật', summary: 'Đa dạng vi sinh vật và các phương pháp nghiên cứu cơ bản.' },
              { id: 21, name: 'Bài 21: Trao đổi chất, sinh trưởng và sinh sản ở vi sinh vật', summary: 'Đặc điểm dinh dưỡng, sinh trưởng và hình thức sinh sản của vi sinh vật.' },
              { id: 22, name: 'Bài 22: Vai trò và ứng dụng của vi sinh vật', summary: 'Vai trò trong tự nhiên và ứng dụng vi sinh vật trong đời sống, công nghệ.' },
              { id: 23, name: 'Bài 23: Thực hành - Một số phương pháp nghiên cứu vi sinh vật thông dụng, tìm hiểu sản phẩm công nghệ vi sinh vật và làm một số sản phẩm lên men', summary: 'Thực hành nghiên cứu vi sinh vật và ứng dụng sản phẩm lên men.' },
            ]
          },
          {
            id: 'VII',
            name: 'Chương 7: Virus',
            lessons: [
              { id: 24, name: 'Bài 24: Khái quát về virus', summary: 'Cấu trúc, đặc điểm sống và chu trình nhân lên của virus.' },
              { id: 25, name: 'Bài 25: Một số bệnh do virus và các thành tựu nghiên cứu ứng dụng virus', summary: 'Bệnh do virus và ứng dụng virus trong y học, sinh học.' },
              { id: 26, name: 'Bài 26: Thực hành - Điều tra một số bệnh do virus và tuyên truyền phòng chống bệnh', summary: 'Thực hành điều tra, tổng hợp thông tin và tuyên truyền phòng chống bệnh do virus.' },
            ]
          },
        ]
      },
    ]
  },
  11: {
    name: 'Lớp 11',
    color: 'from-orange-400 to-amber-600',
    parts: [
      {
        id: 'III-1',
        name: 'Phần ba: Sinh học cơ thể (Chương I, II)',
        lectureFile: '/study/grade 11/Phần III-Chương I, II-lớp 11.pptx',
        chapters: [
          {
            id: 'I',
            name: 'Chương 1: Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
            lessons: [
              { id: 1, name: 'Bài 1: Khái quát về trao đổi chất và chuyển hóa năng lượng', summary: 'Khái quát vai trò của trao đổi chất và chuyển hóa năng lượng ở sinh vật.' },
              { id: 2, name: 'Bài 2: Trao đổi nước và khoáng ở thực vật', summary: 'Cơ chế hấp thụ, vận chuyển nước và ion khoáng ở thực vật.' },
              { id: 3, name: 'Bài 3: Thực hành - Trao đổi nước và khoáng ở thực vật', summary: 'Thực hành khảo sát hiện tượng trao đổi nước và khoáng ở cây.' },
              { id: 4, name: 'Bài 4: Quang hợp ở thực vật', summary: 'Cơ chế quang hợp và các yếu tố ảnh hưởng ở thực vật.' },
              { id: 5, name: 'Bài 5: Thực hành - Quang hợp ở thực vật', summary: 'Thực hành chứng minh vai trò các yếu tố trong quang hợp.' },
              { id: 6, name: 'Bài 6: Hô hấp ở thực vật', summary: 'Các con đường hô hấp và ý nghĩa sinh lí ở thực vật.' },
              { id: 7, name: 'Bài 7: Thực hành - Hô hấp ở thực vật', summary: 'Thực hành quan sát và đánh giá cường độ hô hấp ở thực vật.' },
              { id: 8, name: 'Bài 8: Dinh dưỡng và tiêu hóa ở động vật', summary: 'Các hình thức dinh dưỡng và tiêu hóa ở động vật.' },
              { id: 9, name: 'Bài 9: Hô hấp ở động vật', summary: 'Cơ chế trao đổi khí và thích nghi hô hấp ở các nhóm động vật.' },
              { id: 10, name: 'Bài 10: Tuần hoàn ở động vật', summary: 'Cấu trúc và cơ chế hoạt động của hệ tuần hoàn ở động vật.' },
              { id: 11, name: 'Bài 11: Thực hành - Một số thí nghiệm về hệ tuần hoàn', summary: 'Thực hành tìm hiểu hoạt động hệ tuần hoàn qua thí nghiệm.' },
              { id: 12, name: 'Bài 12: Miễn dịch ở động vật', summary: 'Các cơ chế bảo vệ cơ thể và miễn dịch ở động vật.' },
              { id: 13, name: 'Bài 13: Bài tiết và cân bằng nội môi', summary: 'Bài tiết và duy trì cân bằng nội môi trong cơ thể động vật.' },
            ]
          },
          {
            id: 'II',
            name: 'Chương 2: Cảm ứng ở sinh vật',
            lessons: [
              { id: 14, name: 'Bài 14: Khái quát về cảm ứng ở sinh vật', summary: 'Khái niệm cảm ứng và vai trò trong thích nghi của sinh vật.' },
              { id: 15, name: 'Bài 15: Cảm ứng ở thực vật', summary: 'Các dạng hướng động và ứng động ở thực vật.' },
              { id: 16, name: 'Bài 16: Thực hành - Cảm ứng ở thực vật', summary: 'Thực hành theo dõi và phân tích hiện tượng cảm ứng ở cây.' },
              { id: 17, name: 'Bài 17: Cảm ứng ở động vật', summary: 'Cơ chế cảm ứng, phản xạ và hệ thần kinh ở động vật.' },
              { id: 18, name: 'Bài 18: Tập tính động vật', summary: 'Các kiểu tập tính động vật và cơ sở hình thành tập tính.' },
            ]
          },
        ]
      },
      {
        id: 'III-2',
        name: 'Phần ba: Sinh học cơ thể (Chương III, IV, V)',
        lectureFile: '/study/grade 11/Phần III-Chương III, IV, V-lớp 11.pptx',
        chapters: [
          {
            id: 'III',
            name: 'Chương 3: Sinh trưởng và phát triển ở sinh vật',
            lessons: [
              { id: 19, name: 'Bài 19: Khái quát về sinh trưởng và phát triển ở sinh vật', summary: 'Phân biệt sinh trưởng, phát triển và các yếu tố điều hòa.' },
              { id: 20, name: 'Bài 20: Sinh trưởng và phát triển ở thực vật', summary: 'Sinh trưởng sơ cấp, thứ cấp và hormone điều hòa ở thực vật.' },
              { id: 21, name: 'Bài 21: Thực hành - Bấm ngọn, tỉa cành, tính tuổi cây', summary: 'Thực hành các kĩ thuật canh tác liên quan sinh trưởng thực vật.' },
              { id: 22, name: 'Bài 22: Sinh trưởng và phát triển ở động vật', summary: 'Đặc điểm sinh trưởng, phát triển và biến thái ở động vật.' },
              { id: 23, name: 'Bài 23: Thực hành - Quan sát quá trình biến thái ở động vật', summary: 'Thực hành quan sát các giai đoạn biến thái ở một số loài.' },
            ]
          },
          {
            id: 'IV',
            name: 'Chương 4: Sinh sản ở sinh vật',
            lessons: [
              { id: 24, name: 'Bài 24: Khái quát về sinh sản ở sinh vật', summary: 'Khái quát các hình thức sinh sản và ý nghĩa sinh học.' },
              { id: 25, name: 'Bài 25: Sinh sản ở thực vật', summary: 'Sinh sản vô tính, hữu tính và ứng dụng trong trồng trọt.' },
              { id: 26, name: 'Bài 26: Thực hành - Nhân giống vô tính và thụ phấn cho cây', summary: 'Thực hành kĩ thuật nhân giống và hỗ trợ thụ phấn ở cây trồng.' },
              { id: 27, name: 'Bài 27: Sinh sản ở động vật', summary: 'Các hình thức sinh sản và chiến lược sinh sản ở động vật.' },
            ]
          },
          {
            id: 'V',
            name: 'Chương 5: Mối quan hệ giữa các quá trình sinh lí trong cơ thể sinh vật và một số ngành nghề liên quan đến sinh học cơ thể',
            lessons: [
              { id: 28, name: 'Bài 28: Mối quan hệ giữa các quá trình sinh lí trong cơ thể sinh vật', summary: 'Phân tích mối liên hệ giữa các quá trình sinh lí trong cơ thể.' },
              { id: 29, name: 'Bài 29: Một số ngành nghề liên quan đến sinh học cơ thể', summary: 'Tìm hiểu định hướng nghề nghiệp liên quan lĩnh vực sinh học cơ thể.' },
            ]
          },
        ]
      },
    ]
  },
  12: {
    name: 'Lớp 12',
    color: 'from-pink-400 to-fuchsia-600',
    parts: [
      {
        id: 'IV',
        name: 'Phần bốn: Di truyền học',
        lectureFile: '/study/grade 12/Phần IV-Chương I, II, III, IV-lớp 12.pptx',
        chapters: [
          {
            id: 'I',
            name: 'Chương I: Di truyền phân tử',
            lessons: [
              { id: 1, name: 'Bài 1: DNA và cơ chế tái bản DNA', summary: 'Cấu trúc DNA và cơ chế tái bản đảm bảo ổn định thông tin di truyền.' },
              { id: 2, name: 'Bài 2: Gene, quá trình truyền đạt thông tin di truyền và hệ gene', summary: 'Khái niệm gene, biểu hiện gene và tổ chức hệ gene.' },
              { id: 3, name: 'Bài 3: Điều hòa biểu hiện gene', summary: 'Các cơ chế điều hòa biểu hiện gene ở sinh vật.' },
              { id: 4, name: 'Bài 4: Đột biến gene', summary: 'Nguyên nhân, dạng đột biến gene và ý nghĩa thực tiễn.' },
              { id: 5, name: 'Bài 5: Công nghệ di truyền', summary: 'Nền tảng và ứng dụng công nghệ di truyền trong đời sống.' },
              { id: 6, name: 'Bài 6: Thực hành - Tách chiết DNA', summary: 'Thực hành quy trình tách chiết DNA từ mẫu sinh học.' },
            ]
          },
          {
            id: 'II',
            name: 'Chương II: Di truyền nhiễm sắc thể',
            lessons: [
              { id: 7, name: 'Bài 7: Cấu trúc và chức năng của nhiễm sắc thể', summary: 'Tổ chức nhiễm sắc thể và vai trò trong truyền đạt thông tin di truyền.' },
              { id: 8, name: 'Bài 8: Học thuyết di truyền của Mendel', summary: 'Nội dung cốt lõi học thuyết Mendel và ứng dụng giải bài tập di truyền.' },
              { id: 9, name: 'Bài 9: Mở rộng học thuyết Mendel', summary: 'Các quy luật mở rộng như tương tác gene, trội không hoàn toàn.' },
              { id: 10, name: 'Bài 10: Di truyền giới tính và di truyền liên kết với giới tính', summary: 'Cơ chế xác định giới tính và di truyền tính trạng liên kết giới tính.' },
              { id: 11, name: 'Bài 11: Liên kết gene và hoán vị gene', summary: 'Hiện tượng liên kết, hoán vị gene và bản đồ di truyền.' },
              { id: 12, name: 'Bài 12: Đột biến nhiễm sắc thể', summary: 'Các dạng đột biến số lượng, cấu trúc nhiễm sắc thể và hậu quả.' },
              { id: 13, name: 'Bài 13: Di truyền học người và di truyền y học', summary: 'Ứng dụng di truyền học trong chẩn đoán và tư vấn di truyền người.' },
              { id: 14, name: 'Bài 14: Thực hành - Quan sát một số dạng đột biến nhiễm sắc thể', summary: 'Thực hành quan sát mẫu và nhận biết một số dạng đột biến NST.' },
            ]
          },
          {
            id: 'III',
            name: 'Chương III: Mở rộng học thuyết di truyền nhiễm sắc thể',
            lessons: [
              { id: 15, name: 'Bài 15: Di truyền gene ngoài nhân', summary: 'Đặc điểm di truyền ngoài nhân và ảnh hưởng đến kiểu hình.' },
              { id: 16, name: 'Bài 16: Tương tác giữa kiểu gene với môi trường và thành tựu chọn giống', summary: 'Ảnh hưởng môi trường lên biểu hiện gene và ứng dụng chọn giống.' },
              { id: 17, name: 'Bài 17: Thực hành - Thí nghiệm về thường biến ở cây trồng', summary: 'Thực hành đánh giá tác động môi trường lên biến dị kiểu hình.' },
            ]
          },
          {
            id: 'IV',
            name: 'Chương IV: Di truyền quần thể',
            lessons: [
              { id: 18, name: 'Bài 18: Di truyền quần thể', summary: 'Cấu trúc di truyền quần thể và các nhân tố làm biến đổi tần số alen.' },
            ]
          },
        ]
      },
      {
        id: 'V',
        name: 'Phần năm: Tiến hóa',
        lectureFile: '/study/grade 12/Phần V-Chương V-lớp 12.pptx',
        chapters: [
          {
            id: 'V',
            name: 'Chương V: Bằng chứng và các học thuyết tiến hóa',
            lessons: [
              { id: 19, name: 'Bài 19: Các bằng chứng tiến hóa', summary: 'Bằng chứng giải phẫu, phôi sinh, địa lí sinh vật và phân tử.' },
              { id: 20, name: 'Bài 20: Quan niệm của Darwin về chọn lọc tự nhiên và hình thành loài', summary: 'Nội dung học thuyết Darwin và cơ chế chọn lọc tự nhiên.' },
              { id: 21, name: 'Bài 21: Học thuyết tiến hóa tổng hợp hiện đại', summary: 'Quan điểm tiến hóa hiện đại dựa trên di truyền học quần thể.' },
              { id: 22, name: 'Bài 22: Tiến hóa lớn và quá trình phát sinh chủng loại', summary: 'Tiến hóa lớn và lịch sử phát sinh các nhóm sinh vật.' },
            ]
          },
        ]
      },
      {
        id: 'VI',
        name: 'Phần sáu: Sinh thái học và môi trường',
        lectureFile: '/study/grade 12/Phần VI-Chương VI, VII, VIII-lớp 12.pptx',
        chapters: [
          {
            id: 'VI',
            name: 'Chương VI: Môi trường và sinh thái học quần thể',
            lessons: [
              { id: 23, name: 'Bài 23: Môi trường và các nhân tố sinh thái', summary: 'Các nhân tố sinh thái và ảnh hưởng đến sinh vật.' },
              { id: 24, name: 'Bài 24: Sinh thái học quần thể', summary: 'Đặc trưng quần thể và các quá trình động thái quần thể.' },
              { id: 25, name: 'Bài 25: Thực hành - Xác định khu vực phân bố, kiểu phân bố cá thể và ước tính kích thước mật độ của quần thể', summary: 'Thực hành khảo sát phân bố và ước tính mật độ quần thể ngoài thực địa.' },
            ]
          },
          {
            id: 'VII',
            name: 'Chương VII: Sinh thái học quần xã',
            lessons: [
              { id: 26, name: 'Bài 26: Quần xã sinh vật', summary: 'Đặc trưng cấu trúc và quan hệ sinh thái trong quần xã.' },
              { id: 27, name: 'Bài 27: Thực hành - Tìm hiểu một số đặc trưng cơ bản của quần xã trong tự nhiên', summary: 'Thực hành khảo sát và nhận diện đặc trưng quần xã tự nhiên.' },
              { id: 28, name: 'Bài 28: Hệ sinh thái', summary: 'Cấu trúc, chức năng và thành phần của hệ sinh thái.' },
              { id: 29, name: 'Bài 29: Trao đổi vật chất và chuyển hóa năng lượng trong hệ sinh thái', summary: 'Dòng năng lượng và chu trình vật chất trong hệ sinh thái.' },
              { id: 30, name: 'Bài 30: Diễn thế', summary: 'Quá trình diễn thế sinh thái và các dạng diễn thế.' },
              { id: 31, name: 'Bài 31: Sinh quyển, khu sinh học và chu trình sinh - địa - hóa', summary: 'Khái quát sinh quyển, khu sinh học và chu trình sinh địa hóa.' },
              { id: 32, name: 'Bài 32: Thực hành - Thiết kế một hệ sinh thái nhân tạo', summary: 'Thực hành thiết kế mô hình hệ sinh thái nhân tạo phù hợp mục tiêu học tập.' },
            ]
          },
          {
            id: 'VIII',
            name: 'Chương VIII: Sinh thái học phục hồi, bảo tồn và phát triển bền vững',
            lessons: [
              { id: 33, name: 'Bài 33: Sinh thái học phục hồi và bảo tồn đa dạng', summary: 'Các nguyên tắc phục hồi hệ sinh thái và bảo tồn đa dạng sinh học.' },
              { id: 34, name: 'Bài 34: Phát triển bền vững', summary: 'Mối liên hệ giữa phát triển kinh tế - xã hội và bảo vệ môi trường.' },
              { id: 35, name: 'Bài 35: Dự án - Tìm hiểu thực trạng bảo tồn sinh thái tại địa phương và đề xuất giải pháp bảo tồn', summary: 'Triển khai dự án học tập gắn với thực tiễn bảo tồn tại địa phương.' },
            ]
          },
        ]
      },
    ]
  },
};

const ROOT_SCOPE = 'root';
const buildPartOverrideKey = (classId, partId) => `part|${classId}|${partId}`;
const buildChapterOverrideKey = (classId, partId, chapterId) => `chapter|${classId}|${partId || ROOT_SCOPE}|${chapterId}`;
const buildLessonOverrideKey = (classId, partId, chapterId, lessonId) => `lesson|${classId}|${partId || ROOT_SCOPE}|${chapterId || ROOT_SCOPE}|${lessonId}`;

const MorePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('menu');
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedPart, setExpandedPart] = useState(null);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [viewerLecture, setViewerLecture] = useState(null);
  const [studyOverrides, setStudyOverrides] = useState({});
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [savingOverrideKey, setSavingOverrideKey] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const adminId = user?.id || user?._id || user?.uid;
  const isAdmin = user?.role === 'admin';
  const isAdminLessonRoute = location.pathname === '/admin/lessons';
  const isAdminEditMode = isAdmin && (new URLSearchParams(location.search).get('adminEdit') === '1' || isAdminLessonRoute);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('section') === 'lessons' || isAdminLessonRoute) {
      setActiveSection('lessons');
    }
  }, [location.search, isAdminLessonRoute]);

  useEffect(() => {
    const fetchOverrides = async () => {
      setOverridesLoading(true);
      try {
        const res = await fetch('/api/lessons/study-content-overrides');
        const data = await res.json();
        if (data?.success && data.overrides && typeof data.overrides === 'object') {
          setStudyOverrides(data.overrides);
        } else {
          setStudyOverrides({});
        }
      } catch (error) {
        setStudyOverrides({});
      }
      setOverridesLoading(false);
    };

    fetchOverrides();
  }, []);

  const getOverrideValue = (key, field, fallbackValue = '') => {
    const value = studyOverrides?.[key]?.[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallbackValue;
  };

  const saveStudyOverride = async (key, patch) => {
    if (!isAdmin || !adminId) return;

    setSavingOverrideKey(key);
    setOverrideError('');
    try {
      const response = await fetch('/api/admin/study-content-overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminId,
        },
        body: JSON.stringify({ key, patch }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Không thể cập nhật nội dung bài học');
      }

      setStudyOverrides(data.overrides || {});
    } catch (error) {
      setOverrideError(error?.message || 'Không thể cập nhật nội dung bài học');
    }
    setSavingOverrideKey('');
  };

  const openLectureViewer = async (chapter) => {
    const lectureFileUrl = encodeURI(chapter.lectureFile);

    setViewerLecture({
      chapterName: chapter.name,
      lectureFile: lectureFileUrl,
      slidesHtml: [],
      currentSlide: 0,
      isLoading: true,
      error: '',
    });

    try {
      const [{ pptxToHtml }, response] = await Promise.all([
        import('@jvmr/pptx-to-html'),
        fetch(lectureFileUrl),
      ]);

      if (!response.ok) {
        throw new Error(`Không tải được file bài giảng (HTTP ${response.status}).`);
      }

      const pptBuffer = await response.arrayBuffer();
      const slidesHtml = await pptxToHtml(pptBuffer, {
        width: 1280,
        height: 720,
        scaleToFit: true,
        letterbox: true,
      });

      setViewerLecture((prev) => {
        if (!prev || prev.lectureFile !== lectureFileUrl) return prev;
        return {
          ...prev,
          isLoading: false,
          slidesHtml,
          currentSlide: 0,
          error: '',
        };
      });
    } catch (error) {
      setViewerLecture((prev) => {
        if (!prev || prev.lectureFile !== lectureFileUrl) return prev;
        return {
          ...prev,
          isLoading: false,
          error: error?.message || 'Không thể mở bài giảng trên thiết bị này.',
        };
      });
    }
  };

  const editPartContent = async (classId, part) => {
    if (!isAdminEditMode) return;
    const key = buildPartOverrideKey(classId, part.id);
    const currentName = getOverrideValue(key, 'name', part.name);
    const currentLectureFile = getOverrideValue(key, 'lectureFile', part.lectureFile || '');

    const nextName = window.prompt('Sửa tên phần/chuyên đề:', currentName);
    if (nextName === null) return;

    const nextLectureFile = window.prompt('Sửa đường dẫn PPT (ví dụ: /study/grade 10/ten-file.pptx):', currentLectureFile);
    if (nextLectureFile === null) return;

    await saveStudyOverride(key, { name: nextName, lectureFile: nextLectureFile });
  };

  const editChapterContent = async (classId, partId, chapter) => {
    if (!isAdminEditMode) return;
    const key = buildChapterOverrideKey(classId, partId, chapter.id);
    const currentName = getOverrideValue(key, 'name', chapter.name);
    const currentLectureFile = getOverrideValue(key, 'lectureFile', chapter.lectureFile || '');

    const nextName = window.prompt('Sửa tên chương:', currentName);
    if (nextName === null) return;

    const nextLectureFile = window.prompt('Sửa đường dẫn PPT (để trống nếu chương này dùng PPT của phần):', currentLectureFile);
    if (nextLectureFile === null) return;

    await saveStudyOverride(key, { name: nextName, lectureFile: nextLectureFile });
  };

  const editLessonContent = async (classId, partId, chapterId, lesson) => {
    if (!isAdminEditMode) return;
    const key = buildLessonOverrideKey(classId, partId, chapterId, lesson.id);
    const currentName = getOverrideValue(key, 'name', lesson.name);
    const currentSummary = getOverrideValue(key, 'summary', lesson.summary);

    const nextName = window.prompt('Sửa tiêu đề bài học:', currentName);
    if (nextName === null) return;

    const nextSummary = window.prompt('Sửa mô tả hiển thị:', currentSummary);
    if (nextSummary === null) return;

    await saveStudyOverride(key, { name: nextName, summary: nextSummary });
  };

  const renderMenu = () => (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/profile')}
        className="game-card w-full flex items-center gap-4 hover:bg-white/20 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-semibold">Hồ sơ</h3>
          <p className="text-gray-400 text-sm">Xem thông tin tài khoản và avatar</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => setActiveSection('lessons')}
        className="game-card w-full flex items-center gap-4 hover:bg-white/20 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-green-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-semibold">Bài học</h3>
          <p className="text-gray-400 text-sm">Tổng hợp bài học lớp 6-12</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => navigate('/biology3d')}
        className="game-card w-full flex items-center gap-4 hover:bg-white/20 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Microscope className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-semibold">Mô phỏng 3D</h3>
          <p className="text-gray-400 text-sm">Tế bào, ADN, Giải phẫu cơ thể người</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => navigate('/simulations')}
        className="game-card w-full flex items-center gap-4 hover:bg-white/20 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Gamepad2 className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-white font-semibold">Game 3D</h3>
          <p className="text-gray-400 text-sm">8 mini game sinh học tương tác</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );

  const renderLessons = () => {
    const selectedClassData = selectedClass ? lessonsData[selectedClass] : null;

    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            if (selectedClass) {
              setSelectedClass(null);
              setExpandedPart(null);
              setExpandedChapter(null);
            } else {
              if (isAdminEditMode) {
                navigate('/admin');
                return;
              }
              setActiveSection('menu');
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        {isAdminEditMode && (
          <div className="p-3 rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-100 text-sm">
            Đang ở chế độ quản trị bài học: bạn có thể sửa tên hiển thị, mô tả bài và đường dẫn PPT để học sinh cập nhật ngay.
          </div>
        )}

        {overrideError && (
          <div className="p-3 rounded-lg border border-red-400/40 bg-red-500/15 text-red-100 text-sm">
            {overrideError}
          </div>
        )}

        {overridesLoading && (
          <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-sm">
            Đang đồng bộ cấu hình nội dung bài học...
          </div>
        )}

        {!selectedClass ? (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Chọn lớp học</h2>

            <div className="mb-6">
              <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Trung học cơ sở</h3>
              <div className="grid grid-cols-2 gap-3">
                {[6, 7, 8, 9].map((classNum) => (
                  <button
                    key={classNum}
                    onClick={() => setSelectedClass(classNum)}
                    className="game-card hover:bg-white/20 transition-all p-4"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lessonsData[classNum].color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold text-xl">{classNum}</span>
                    </div>
                    <p className="text-white font-semibold text-center">Lớp {classNum}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm mb-3 uppercase tracking-wider">Trung học phổ thông</h3>
              <div className="grid grid-cols-2 gap-3">
                {[10, 11, 12].map((classNum) => (
                  <button
                    key={classNum}
                    onClick={() => setSelectedClass(classNum)}
                    className="game-card hover:bg-white/20 transition-all p-4"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lessonsData[classNum].color} flex items-center justify-center mx-auto mb-2`}>
                      <span className="text-white font-bold text-xl">{classNum}</span>
                    </div>
                    <p className="text-white font-semibold text-center">Lớp {classNum}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-4">
              Bài học {selectedClassData.name}
            </h2>

            <div className="space-y-3">
              {selectedClassData.parts ? (
                selectedClassData.parts.map((part) => {
                  const partOverrideKey = buildPartOverrideKey(selectedClass, part.id);
                  const partName = getOverrideValue(partOverrideKey, 'name', part.name);
                  const partLectureFile = getOverrideValue(partOverrideKey, 'lectureFile', part.lectureFile || '');

                  return (
                    <div key={part.id} className="game-card overflow-hidden">
                      <button
                        onClick={() => {
                          if (expandedPart === part.id) {
                            setExpandedPart(null);
                            setExpandedChapter(null);
                          } else {
                            setExpandedPart(part.id);
                            setExpandedChapter(null);
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedClassData.color} flex items-center justify-center`}>
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-semibold">{partName}</p>
                            <p className="text-gray-400 text-sm">
                              {part.chapters ? `${part.chapters.length} chương` : `${part.lessons.length} bài học`}
                            </p>
                          </div>
                        </div>
                        {expandedPart === part.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedPart === part.id && (
                        <div className="border-t border-white/10">
                          {part.chapters ? (
                            <>
                              {part.chapters.map((chapter) => {
                                const chapterOpenKey = `${part.id}-${chapter.id}`;
                                const chapterOverrideKey = buildChapterOverrideKey(selectedClass, part.id, chapter.id);
                                const chapterName = getOverrideValue(chapterOverrideKey, 'name', chapter.name);
                                const chapterLectureFile = getOverrideValue(chapterOverrideKey, 'lectureFile', chapter.lectureFile || '');

                                return (
                                  <div key={chapter.id} className="border-b border-white/10 last:border-b-0">
                                    <button
                                      onClick={() => setExpandedChapter(expandedChapter === chapterOpenKey ? null : chapterOpenKey)}
                                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition-all"
                                    >
                                      <div className="text-left">
                                        <p className="text-white font-semibold">{chapterName}</p>
                                        <p className="text-gray-400 text-sm">{chapter.lessons.length} bài học</p>
                                      </div>
                                      {expandedChapter === chapterOpenKey ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                      )}
                                    </button>

                                    {isAdminEditMode && (
                                      <div className="px-4 pb-3">
                                        <button
                                          type="button"
                                          onClick={() => editChapterContent(selectedClass, part.id, chapter)}
                                          disabled={savingOverrideKey === chapterOverrideKey}
                                          className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                        >
                                          {savingOverrideKey === chapterOverrideKey ? 'Đang lưu...' : 'Sửa chương/PPT'}
                                        </button>
                                      </div>
                                    )}

                                    {expandedChapter === chapterOpenKey && (
                                      <div className="border-t border-white/10">
                                        {chapter.lessons.map((lesson, idx) => {
                                          const lessonOverrideKey = buildLessonOverrideKey(selectedClass, part.id, chapter.id, lesson.id);
                                          const lessonName = getOverrideValue(lessonOverrideKey, 'name', lesson.name);
                                          const lessonSummary = getOverrideValue(lessonOverrideKey, 'summary', lesson.summary);

                                          return (
                                            <div
                                              key={lesson.id}
                                              className={`p-4 ${idx !== chapter.lessons.length - 1 ? 'border-b border-white/5' : ''}`}
                                            >
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                  <h4 className="text-white font-medium mb-2">{lessonName}</h4>
                                                  <p className="text-gray-400 text-sm leading-relaxed">{lessonSummary}</p>
                                                </div>
                                                {isAdminEditMode && (
                                                  <button
                                                    type="button"
                                                    onClick={() => editLessonContent(selectedClass, part.id, chapter.id, lesson)}
                                                    disabled={savingOverrideKey === lessonOverrideKey}
                                                    className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                                  >
                                                    {savingOverrideKey === lessonOverrideKey ? 'Đang lưu...' : 'Sửa'}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}

                                        {chapterLectureFile && (
                                          <div className="p-4 border-t border-white/10">
                                            <button
                                              type="button"
                                              onClick={() => openLectureViewer({ name: chapterName, lectureFile: chapterLectureFile })}
                                              className="text-emerald-300 hover:text-emerald-200 underline font-medium"
                                            >
                                              Bài giảng chương
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {(partLectureFile || isAdminEditMode) && (
                                <div className="p-4 border-t border-white/10 flex flex-wrap gap-2">
                                  {partLectureFile && (
                                    <button
                                      type="button"
                                      onClick={() => openLectureViewer({ name: partName, lectureFile: partLectureFile })}
                                      className="text-emerald-300 hover:text-emerald-200 underline font-medium"
                                    >
                                      Bài giảng
                                    </button>
                                  )}

                                  {isAdminEditMode && (
                                    <button
                                      type="button"
                                      onClick={() => editPartContent(selectedClass, part)}
                                      disabled={savingOverrideKey === partOverrideKey}
                                      className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                    >
                                      {savingOverrideKey === partOverrideKey ? 'Đang lưu...' : 'Sửa phần/PPT'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {part.lessons.map((lesson, idx) => {
                                const lessonOverrideKey = buildLessonOverrideKey(selectedClass, part.id, part.id, lesson.id);
                                const lessonName = getOverrideValue(lessonOverrideKey, 'name', lesson.name);
                                const lessonSummary = getOverrideValue(lessonOverrideKey, 'summary', lesson.summary);

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`p-4 ${idx !== part.lessons.length - 1 ? 'border-b border-white/5' : ''}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <h4 className="text-white font-medium mb-2">{lessonName}</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">{lessonSummary}</p>
                                      </div>
                                      {isAdminEditMode && (
                                        <button
                                          type="button"
                                          onClick={() => editLessonContent(selectedClass, part.id, part.id, lesson)}
                                          disabled={savingOverrideKey === lessonOverrideKey}
                                          className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                        >
                                          {savingOverrideKey === lessonOverrideKey ? 'Đang lưu...' : 'Sửa'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {(partLectureFile || isAdminEditMode) && (
                                <div className="p-4 border-t border-white/10 flex flex-wrap gap-2">
                                  {partLectureFile && (
                                    <button
                                      type="button"
                                      onClick={() => openLectureViewer({ name: partName, lectureFile: partLectureFile })}
                                      className="text-emerald-300 hover:text-emerald-200 underline font-medium"
                                    >
                                      Bài giảng
                                    </button>
                                  )}

                                  {isAdminEditMode && (
                                    <button
                                      type="button"
                                      onClick={() => editPartContent(selectedClass, part)}
                                      disabled={savingOverrideKey === partOverrideKey}
                                      className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                    >
                                      {savingOverrideKey === partOverrideKey ? 'Đang lưu...' : 'Sửa phần/PPT'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                selectedClassData.chapters.map((chapter) => {
                  const chapterOverrideKey = buildChapterOverrideKey(selectedClass, ROOT_SCOPE, chapter.id);
                  const chapterName = getOverrideValue(chapterOverrideKey, 'name', chapter.name);
                  const chapterLectureFile = getOverrideValue(chapterOverrideKey, 'lectureFile', chapter.lectureFile || '');

                  return (
                    <div key={chapter.id} className="game-card overflow-hidden">
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedClassData.color} flex items-center justify-center`}>
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-semibold">{chapterName}</p>
                            <p className="text-gray-400 text-sm">{chapter.lessons.length} bài học</p>
                          </div>
                        </div>
                        {expandedChapter === chapter.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedChapter === chapter.id && (
                        <div className="border-t border-white/10">
                          {chapter.lessons.map((lesson, idx) => {
                            const lessonOverrideKey = buildLessonOverrideKey(selectedClass, ROOT_SCOPE, chapter.id, lesson.id);
                            const lessonName = getOverrideValue(lessonOverrideKey, 'name', lesson.name);
                            const lessonSummary = getOverrideValue(lessonOverrideKey, 'summary', lesson.summary);

                            return (
                              <div
                                key={lesson.id}
                                className={`p-4 ${idx !== chapter.lessons.length - 1 ? 'border-b border-white/5' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium mb-2">{lessonName}</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">{lessonSummary}</p>
                                  </div>
                                  {isAdminEditMode && (
                                    <button
                                      type="button"
                                      onClick={() => editLessonContent(selectedClass, ROOT_SCOPE, chapter.id, lesson)}
                                      disabled={savingOverrideKey === lessonOverrideKey}
                                      className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                    >
                                      {savingOverrideKey === lessonOverrideKey ? 'Đang lưu...' : 'Sửa'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {(chapterLectureFile || isAdminEditMode) && (
                            <div className="p-4 border-t border-white/10 flex flex-wrap gap-2">
                              {chapterLectureFile && (
                                <button
                                  type="button"
                                  onClick={() => openLectureViewer({ name: chapterName, lectureFile: chapterLectureFile })}
                                  className="text-emerald-300 hover:text-emerald-200 underline font-medium"
                                >
                                  Bài giảng
                                </button>
                              )}

                              {isAdminEditMode && (
                                <button
                                  type="button"
                                  onClick={() => editChapterContent(selectedClass, ROOT_SCOPE, chapter)}
                                  disabled={savingOverrideKey === chapterOverrideKey}
                                  className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 disabled:opacity-60"
                                >
                                  {savingOverrideKey === chapterOverrideKey ? 'Đang lưu...' : 'Sửa chương/PPT'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative bg-transparent p-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (isAdminEditMode) {
              navigate('/admin');
              return;
            }
            if (user?.role === 'teacher') {
              navigate('/teacher');
              return;
            }
            navigate('/home');
          }}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {activeSection === 'menu' && 'Thêm'}
          {activeSection === 'lessons' && 'Bài học'}
        </h1>
      </div>

      {activeSection === 'menu' && renderMenu()}
      {activeSection === 'lessons' && renderLessons()}

      {viewerLecture && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-2 sm:p-4">
          <div className="h-full w-full bg-slate-950 rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">Bài giảng</p>
                <p className="text-gray-400 text-sm">{viewerLecture.chapterName}</p>
              </div>

              <div className="flex items-center gap-2">
                {!viewerLecture.isLoading && !viewerLecture.error && viewerLecture.slidesHtml.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewerLecture((prev) => ({
                        ...prev,
                        currentSlide: Math.max(prev.currentSlide - 1, 0),
                      }))}
                      disabled={viewerLecture.currentSlide === 0}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
                    >
                      Trước
                    </button>

                    <span className="text-xs sm:text-sm text-gray-300 px-1">
                      Slide {viewerLecture.currentSlide + 1}/{viewerLecture.slidesHtml.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewerLecture((prev) => ({
                        ...prev,
                        currentSlide: Math.min(prev.currentSlide + 1, prev.slidesHtml.length - 1),
                      }))}
                      disabled={viewerLecture.currentSlide >= viewerLecture.slidesHtml.length - 1}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm"
                    >
                      Sau
                    </button>
                  </>
                )}

                <a
                  href={viewerLecture.lectureFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở tab mới
                </a>

                <button
                  type="button"
                  onClick={() => setViewerLecture(null)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
                  aria-label="Đóng bài giảng"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 overflow-auto">
              {viewerLecture.isLoading && (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-300 px-4 text-center">
                  <div className="w-10 h-10 border-4 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Đang tải bài giảng...</p>
                  <p className="text-sm text-gray-400 mt-1">Hệ thống đang chuyển đổi PPTX để xem trực tiếp.</p>
                </div>
              )}

              {!viewerLecture.isLoading && viewerLecture.error && (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-300 px-4 text-center">
                  <p className="text-red-300 font-semibold mb-2">Không thể hiển thị bài giảng</p>
                  <p className="text-sm text-gray-400 max-w-xl">{viewerLecture.error}</p>
                  <a
                    href={viewerLecture.lectureFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở file bài giảng
                  </a>
                </div>
              )}

              {!viewerLecture.isLoading && !viewerLecture.error && viewerLecture.slidesHtml.length > 0 && (
                <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
                  <div className="w-full max-w-[1280px] aspect-video bg-white rounded-lg overflow-hidden shadow-[0_0_0_1px_rgba(148,163,184,0.3)]">
                    <div
                      className="w-full h-full overflow-auto"
                      dangerouslySetInnerHTML={{ __html: viewerLecture.slidesHtml[viewerLecture.currentSlide] }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                Bài giảng đang được hiển thị trực tiếp từ file PPTX trong trình duyệt. Nếu thiết bị gặp lỗi hiển thị, bấm "Mở tab mới" để mở bằng ứng dụng ngoài.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorePage;
