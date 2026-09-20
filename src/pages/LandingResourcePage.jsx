import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import GalaxyBackground from '../components/GalaxyBackground';
import { LandingFooter, LandingHeader } from './LandingPage';

const GUIDE_ITEMS = [
  ['Bắt đầu với BioLearn', 'Tạo tài khoản hoặc đăng nhập, sau đó chọn lớp học phù hợp. Học sinh có thể bắt đầu từ Trang chủ, chọn Map và hoàn thành lần lượt các màn để lưu tiến trình.'],
  ['Điều hướng trong hệ thống', 'Trang chủ tập hợp các lối tắt chính. Map là lộ trình học lớp 6–12; Trạm sinh học là chuỗi nhiệm vụ khám phá; Bài học chứa tài liệu và video; Mô phỏng cung cấp mô hình và trò chơi 3D.'],
  ['Học và chơi trong Map', 'Chọn lớp, chương, bài và màn. Hoàn thành chính xác màn hiện tại để mở tiến trình tiếp theo. Màn thực hành và thử thách học vượt có nội dung, điều kiện và phần thưởng riêng.'],
  ['Năng lượng, điểm và phần thưởng', 'Một số hoạt động tiêu hao năng lượng. Năng lượng phục hồi theo thời gian. Điểm, xu và phần thưởng chỉ được ghi nhận khi hệ thống xác nhận hoàn thành hợp lệ.'],
  ['Theo dõi tiến độ và thành tựu', 'Mở Hồ sơ để xem cấp độ, EXP, tiến trình từng lớp, avatar và bộ sưu tập thành tựu. Thành tựu đã mở khóa có thể được trang bị cạnh avatar.'],
  ['Đấu trường và bảng xếp hạng', 'Vào Đấu trường để chơi PvP. Hai người nhận cùng trạng thái trận đấu theo thời gian thực. Bảng xếp hạng hiển thị tổng điểm hoặc điểm theo kỳ; tài khoản kiểm thử không xuất hiện trên bảng.'],
  ['Trạm sinh học và mô phỏng', 'Trạm sinh học gồm các ngày khám phá và trò chơi kiến thức. Khu Mô phỏng hỗ trợ quan sát mô hình 3D và các game tương tác theo từng lớp. Nội dung đang bảo trì sẽ có thông báo rõ ràng.'],
  ['Dành cho giáo viên', 'Giáo viên dùng khu quản lý để tạo phòng Quiz, chuẩn bị câu hỏi, chia sẻ mã phòng và theo dõi kết quả học sinh theo thời gian thực.']
];

const FAQ_ITEMS = [
  ['BioLearn là gì?', 'BioLearn là nền tảng học Sinh học tương tác dành cho học sinh phổ thông, kết hợp Map bài học, trò chơi, Trạm sinh học, mô phỏng 3D, thành tựu và PvP.'],
  ['Làm thế nào để tạo tài khoản?', 'Chọn Đăng nhập trên Landing, chuyển sang Đăng ký và nhập thông tin được yêu cầu. Tài khoản giáo viên cần hoàn thành quy trình xác minh của hệ thống.'],
  ['BioLearn có miễn phí không?', 'Bạn có thể sử dụng những chức năng được mở cho tài khoản của mình. Nếu có thay đổi về phạm vi dịch vụ, BioLearn sẽ thông báo trực tiếp trong hệ thống.'],
  ['Tiến độ học có được lưu tự động không?', 'Có. Tiến độ và phần thưởng được lưu sau khi máy chủ xác nhận bạn hoàn thành hoạt động hợp lệ. Không nên đóng trang khi thao tác lưu vẫn đang diễn ra.'],
  ['Vì sao một màn hoặc mô phỏng không mở được?', 'Nội dung có thể chưa được mở theo tiến trình, chưa có dữ liệu hoặc đang tạm khóa để bảo trì. Hệ thống sẽ hiển thị lý do tương ứng.'],
  ['Năng lượng phục hồi như thế nào?', 'Năng lượng tự phục hồi theo thời gian đến giới hạn của tài khoản. Thời gian còn lại và lượng năng lượng hiện có được hiển thị trên Trang chủ.'],
  ['Tại sao điểm chưa xuất hiện trên bảng xếp hạng?', 'Hãy tải lại bảng sau khi hoạt động được xác nhận. Điểm không hợp lệ, phần thưởng đã nhận trước đó và tài khoản chuyên kiểm thử sẽ không được tính vào bảng xếp hạng.'],
  ['Tôi mất kết nối trong trận PvP thì sao?', 'Hệ thống giữ trạng thái trận trong khoảng kết nối lại. Hãy mở lại đúng phòng càng sớm càng tốt và tránh dùng nút quay lại hoặc đóng trình duyệt giữa trận.'],
  ['Tôi quên mật khẩu phải làm gì?', 'Sử dụng chức năng khôi phục mật khẩu tại trang đăng nhập. Nếu không nhận được hướng dẫn, hãy liên hệ supportbiolearn@gmail.com.'],
  ['Giáo viên có thể sử dụng BioLearn không?', 'Có. Tài khoản giáo viên sau khi được xác minh có thể tạo và quản lý phòng Quiz cho học sinh.']
];

const PRIVACY_SECTIONS = [
  ['1. Phạm vi chính sách', 'Chính sách này giải thích cách BioLearn xử lý dữ liệu khi bạn sử dụng tài khoản, bài học, trò chơi, Trạm sinh học, mô phỏng, Quiz và các chức năng liên quan.'],
  ['2. Thông tin được thu thập', 'BioLearn có thể lưu thông tin tài khoản như tên hiển thị, email, vai trò và avatar; dữ liệu học tập như tiến độ, điểm, EXP, xu, năng lượng, thành tựu; cùng dữ liệu kỹ thuật cần thiết để vận hành và bảo vệ hệ thống.'],
  ['3. Mục đích sử dụng', 'Dữ liệu được dùng để xác thực tài khoản, lưu tiến độ, cung cấp nội dung phù hợp, vận hành bảng xếp hạng và PvP, hỗ trợ giáo viên, phòng chống gian lận và xử lý lỗi.'],
  ['4. Lưu trữ và bảo vệ', 'BioLearn sử dụng cơ chế xác thực, phân quyền và Row Level Security của cơ sở dữ liệu. Quyền quản trị được tách khỏi quyền học sinh và giáo viên. Không có biện pháp nào loại bỏ hoàn toàn mọi rủi ro, vì vậy hệ thống được rà soát và cập nhật định kỳ.'],
  ['5. Chia sẻ thông tin', 'BioLearn không công khai email hoặc thông tin đăng nhập trên bảng xếp hạng. Tên hiển thị, avatar, điểm và thành tựu có thể xuất hiện ở những khu vực cộng đồng cần thiết cho chức năng học tập và thi đấu.'],
  ['6. Cookie và bộ nhớ trình duyệt', 'Hệ thống có thể dùng phiên đăng nhập và localStorage để ghi nhớ các lựa chọn như giao diện sáng hoặc tối, âm lượng và trạng thái cần thiết cho trải nghiệm người dùng.'],
  ['7. Quyền của người dùng', 'Bạn có thể chỉnh một số thông tin hồ sơ và yêu cầu hỗ trợ về tài khoản hoặc dữ liệu qua kênh liên hệ chính thức. Một số dữ liệu phải được giữ trong thời gian cần thiết để bảo vệ tính toàn vẹn của tiến trình và giao dịch phần thưởng.'],
  ['8. Tài khoản học sinh', 'Người học cần giữ bí mật thông tin đăng nhập và không chia sẻ tài khoản. Phụ huynh hoặc người giám hộ có thể liên hệ BioLearn khi cần hỗ trợ liên quan đến tài khoản học sinh.'],
  ['9. Thay đổi chính sách', 'Khi nội dung chính sách thay đổi đáng kể, ngày cập nhật sẽ được điều chỉnh và thông tin phù hợp sẽ được công bố trong hệ thống.'],
  ['10. Liên hệ', 'Các câu hỏi về tài khoản và quyền riêng tư có thể gửi tới supportbiolearn@gmail.com hoặc số điện thoại (+84) 83 8667 369.']
];

const PAGE_CONFIG = {
  '/guide': { title: 'Hướng dẫn sử dụng', subtitle: 'Làm quen và sử dụng BioLearn hiệu quả', icon: BookOpen, items: GUIDE_ITEMS, accordion: true },
  '/faq': { title: 'Câu hỏi thường gặp', subtitle: 'Giải đáp các thắc mắc phổ biến về BioLearn', icon: HelpCircle, items: FAQ_ITEMS, accordion: true },
  '/privacy': { title: 'Chính sách bảo mật', subtitle: 'Cập nhật lần cuối: Tháng 9, 2026', icon: ShieldCheck, items: PRIVACY_SECTIONS, accordion: false }
};

export default function LandingResourcePage() {
  const location = useLocation();
  const config = PAGE_CONFIG[location.pathname] || PAGE_CONFIG['/guide'];
  const [openItem, setOpenItem] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="landing-page landing-resource-page min-h-screen relative overflow-x-hidden">
      <GalaxyBackground />
      <LandingHeader />
      <main className="relative z-10 max-w-4xl mx-auto px-4 pt-[132px] pb-14">
        <div className="text-center mb-8">
          <h1 className="resource-title">{config.title}</h1>
          <p className="resource-subtitle mt-3">{config.subtitle}</p>
        </div>
        <div className="space-y-4">
          {config.items.map(([title, content], index) => {
            const isOpen = openItem?.path === location.pathname && openItem.index === index;
            return config.accordion ? (
            <article
              key={title}
              className="resource-card overflow-hidden"
              onMouseEnter={() => setOpenItem({ path: location.pathname, index })}
              onMouseLeave={() => setOpenItem(null)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpenItem(null);
              }}
            >
              <button onClick={() => setOpenItem(isOpen ? null : { path: location.pathname, index })} className="w-full flex items-center justify-between gap-4 p-5 text-left" aria-expanded={isOpen}>
                <h2 className="resource-card-title">{title}</h2><ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`resource-accordion-content ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
                <div><p className="resource-card-text px-5 pb-5 leading-7">{content}</p></div>
              </div>
            </article>
          ) : (
            <article key={title} className="resource-card p-6"><h2 className="resource-card-title mb-3">{title}</h2><p className="resource-card-text leading-7">{content}</p></article>
          );})}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
