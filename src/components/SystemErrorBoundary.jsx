import { Component } from 'react';
import { reportSystemError } from '../lib/observability';

export default class SystemErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reportAccepted: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    reportSystemError(error, {
      action: 'react_render_error',
      component: errorInfo?.componentStack?.split('\n')?.[1]?.trim() || 'React tree',
      operation: 'render',
      source: 'error_boundary',
      severity: 'critical',
    }).then(accepted => this.setState({ reportAccepted: accepted }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-slate-950 text-white">
          <section className="w-full max-w-lg rounded-3xl border border-red-300/25 bg-white/10 p-6 text-center backdrop-blur-xl">
            <h1 className="text-2xl font-bold mb-2">BioLearn vừa gặp sự cố hiển thị</h1>
            <p className="text-white/75 mb-5">
              {this.state.reportAccepted === true
                ? 'Lỗi đã được ghi nhận. Bạn có thể tải lại trang để tiếp tục.'
                : this.state.reportAccepted === false
                  ? 'Chưa xác nhận lưu được lỗi. Bạn có thể tải lại trang để thử lại.'
                  : 'Đang gửi thông tin lỗi. Bạn có thể tải lại trang để tiếp tục.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
            >
              Tải lại trang
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
