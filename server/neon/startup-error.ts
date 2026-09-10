// Only fixed diagnostics leave the process. Driver messages/details may contain credentials.
const diagnostics = new Map<string, readonly [string, string]>([
  [
    '28P01',
    [
      'AUTH_FAILED',
      'Neon không chấp nhận mật khẩu của role. Copy lại toàn bộ kết nối moi_ngay_runtime từ đúng branch vào DATABASE_URL rồi Save and deploy.',
    ],
  ],
  [
    '28000',
    [
      'LOGIN_DENIED',
      'Neon từ chối đăng nhập. Kiểm tra role có LOGIN, đúng branch và chính sách truy cập của project.',
    ],
  ],
  [
    '3D000',
    [
      'DATABASE_MISSING',
      'Database trong DATABASE_URL không tồn tại trên endpoint đang chọn. Lấy lại kết nối đúng database/branch từ Neon Connect.',
    ],
  ],
  [
    '0P000',
    [
      'ROLE_MISSING',
      'Role ứng dụng chưa tồn tại trên branch này. Chạy db/neon/check_setup.sql bằng owner để kiểm tra trước khi áp migration.',
    ],
  ],
  [
    '42501',
    [
      'PERMISSION_DENIED',
      'Thiếu quyền SET ROLE moi_ngay_api hoặc đọc schema_version. Chạy db/neon/check_setup.sql bằng owner để kiểm tra role và grants.',
    ],
  ],
  [
    '42P01',
    [
      'SCHEMA_MISSING',
      'Chưa tìm thấy bảng moi_ngay.schema_version trong database này. Kiểm tra đúng project/branch/database và migration 001_initial.sql.',
    ],
  ],
  [
    '3F000',
    [
      'SCHEMA_MISSING',
      'Schema ứng dụng chưa tồn tại trong database này. Kiểm tra migration trên đúng project/branch/database.',
    ],
  ],
  [
    '42703',
    [
      'SCHEMA_INVALID',
      'Bảng kiểm tra thiếu cột version. Đối chiếu migration; không xóa hoặc chạy lại SQL mù khi schema đã có.',
    ],
  ],
  [
    'APP_SCHEMA_VERSION',
    [
      'SCHEMA_VERSION',
      'Bảng schema_version phải có đúng một dòng version=1. Kiểm tra migration; không reset dữ liệu để vượt lỗi.',
    ],
  ],
  [
    '53300',
    [
      'CONNECTION_LIMIT',
      'Neon đã đạt giới hạn kết nối. Kiểm tra các kết nối đang mở và dùng URL có pooling.',
    ],
  ],
  [
    '57P03',
    [
      'NOT_READY',
      'Neon chưa sẵn sàng nhận kết nối. Kiểm tra compute và trạng thái dịch vụ rồi deploy lại.',
    ],
  ],
  [
    '57014',
    [
      'QUERY_TIMEOUT',
      'Truy vấn kiểm tra DB bị hủy hoặc quá thời gian. Kiểm tra compute và các khóa đang chờ.',
    ],
  ],
  [
    'ENOTFOUND',
    [
      'DNS',
      'Không phân giải được endpoint Neon. Lấy lại hostname từ Connect và kiểm tra DNS/trạng thái dịch vụ.',
    ],
  ],
  [
    'EAI_AGAIN',
    ['DNS', 'DNS tạm thời không trả lời. Kiểm tra endpoint/trạng thái mạng rồi deploy lại.'],
  ],
  [
    'ETIMEDOUT',
    [
      'CONNECT_TIMEOUT',
      'Kết nối DB quá thời gian. Kiểm tra compute, endpoint và giới hạn truy cập mạng của Neon.',
    ],
  ],
  [
    'PG_CONNECT_TIMEOUT',
    [
      'CONNECT_TIMEOUT',
      'Kết nối DB quá thời gian. Kiểm tra compute, endpoint và giới hạn truy cập mạng của Neon.',
    ],
  ],
  [
    'ECONNREFUSED',
    [
      'CONNECTION_REFUSED',
      'Endpoint từ chối kết nối PostgreSQL. Kiểm tra compute/hostname/port trong Neon Connect.',
    ],
  ],
  [
    'ECONNRESET',
    [
      'CONNECTION_RESET',
      'Kết nối PostgreSQL bị ngắt. Kiểm tra compute và trạng thái mạng rồi deploy lại.',
    ],
  ],
  ...[
    'CERT_HAS_EXPIRED',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'ERR_TLS_CERT_ALTNAME_INVALID',
  ].map(
    (code) =>
      [
        code,
        [
          'TLS',
          'Không xác minh được chứng chỉ TLS Neon. Kiểm tra endpoint/chứng chỉ; giữ rejectUnauthorized=true.',
        ],
      ] as const,
  ),
])

const poolTimeouts = new Set([
  'Connection terminated due to connection timeout',
  'timeout exceeded when trying to connect',
  'timeout expired',
])
export function databaseStartupMessage(error: unknown): string {
  let current = error
  // pg-pool can wrap a Node error as cause. Bound traversal to handle cycles safely.
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth++) {
    const item = current as { code?: unknown; message?: unknown; cause?: unknown }
    const code = typeof item.code === 'string' ? item.code : ''
    const diagnostic = diagnostics.get(code)
    if (diagnostic) return `[NEON_DB_${diagnostic[0]}] (${code}) ${diagnostic[1]}`
    if (typeof item.message === 'string' && poolTimeouts.has(item.message)) {
      const timeout = diagnostics.get('PG_CONNECT_TIMEOUT')!
      return `[NEON_DB_${timeout[0]}] ${timeout[1]}`
    }
    current = item.cause
  }
  return '[NEON_DB_UNKNOWN] Kiểm tra DB/role/schema chưa thành công; mã lỗi chưa được nhận diện. Chạy db/neon/check_setup.sql bằng owner và gửi kết quả không có mật khẩu để kiểm tra tiếp.'
}
