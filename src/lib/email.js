import emailjs from '@emailjs/browser';

const readEmailJsConfig = () => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim().replace(/['"]/g, '');
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim().replace(/['"]/g, '');
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim().replace(/['"]/g, '');

  const missing = [
    ['VITE_EMAILJS_SERVICE_ID', serviceId],
    ['VITE_EMAILJS_TEMPLATE_ID', templateId],
    ['VITE_EMAILJS_PUBLIC_KEY', publicKey]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Thiếu cấu hình ${missing.join(', ')}. Hãy thêm biến môi trường rồi build/deploy lại ứng dụng.`);
  }

  return { serviceId, templateId, publicKey };
};

const formatEmailJsError = (error) => {
  const status = Number(error?.status) || null;
  const rawMessage = (
    (typeof error === 'string' && error) ||
    error?.text ||
    error?.message ||
    'Không nhận được nội dung lỗi từ EmailJS'
  ).trim();

  const hints = {
    400: 'Kiểm tra Service ID, Template ID và trường “To Email” trong template (nên là {{to_email}}).',
    401: 'Kiểm tra Public Key trong EmailJS Account.',
    403: 'Kiểm tra Public Key, danh sách domain được cho phép và quyền của email service.',
    404: rawMessage.toLowerCase().includes('account not found')
      ? 'Public Key không thuộc tài khoản EmailJS; hãy dùng nút sao chép trong Account → General để tránh nhầm I, l hoặc 1.'
      : 'Không tìm thấy service hoặc template; hãy sao chép lại đúng ID từ EmailJS Dashboard.',
    429: 'Đã vượt giới hạn gửi của EmailJS; vui lòng chờ rồi thử lại.'
  };

  const prefix = status ? `EmailJS ${status}` : 'EmailJS';
  const hint = status ? hints[status] : '';
  return {
    status,
    message: `${prefix}: ${rawMessage}${hint ? ` ${hint}` : ''}`
  };
};

/**
 * Gửi email chứa mã xác thực cho giáo viên qua EmailJS.
 * Trả về kết quả để giao diện admin hiển thị đúng lỗi từ EmailJS.
 */
export const sendAutoTeacherCodeEmail = async ({
  teacherEmail,
  teacherName,
  approvedCode,
  expiresAtFormatted
}) => {
  const cleanEmail = teacherEmail?.trim().toLowerCase();
  const cleanCode = approvedCode?.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Thiếu địa chỉ email giáo viên' };
  }

  if (!cleanCode) {
    return { success: false, error: 'Thiếu mã xác thực giáo viên' };
  }

  try {
    const { serviceId, templateId, publicKey } = readEmailJsConfig();
    const expiresAt = expiresAtFormatted || '60 phút kể từ khi mã được cấp';
    const displayName = teacherName?.trim() || 'Thầy/Cô';

    // Tên biến phải trùng với biến dùng trong EmailJS template.
    const templateParams = {
      to_email: cleanEmail,
      to_name: displayName,
      approved_code: cleanCode,
      verification_code: cleanCode,
      expires_at: expiresAt,
      subject: 'Mã xác thực tài khoản giáo viên BioLearn',
      message: `Mã xác thực của bạn là ${cleanCode}. Mã hết hạn lúc ${expiresAt}.`,
      from_name: 'BioLearn Support',
      reply_to: 'supportbiolearn@gmail.com'
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      { publicKey }
    );

    return {
      success: true,
      status: response.status,
      responseText: response.text
    };
  } catch (error) {
    const details = formatEmailJsError(error);
    console.error('Không thể gửi email xác thực giáo viên:', details.message);
    return { success: false, error: details.message, status: details.status };
  }
};
