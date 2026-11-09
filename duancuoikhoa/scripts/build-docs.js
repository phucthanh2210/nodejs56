import { readFile, writeFile } from 'node:fs/promises';

// The checked-in Swagger snapshot is derived from the Movie specification in the PDF.
const url = new URL('../docs/swagger.json', import.meta.url);
const spec = JSON.parse(await readFile(url, 'utf8'));
spec.info = { title: 'Movie API - Dự án cuối khóa NodeJS', version: '1.0.0', description: 'API Movie theo đề capstone CyberSoft. Không cần TokenCybersoft. Đăng nhập và nhập Bearer <accessToken> vào Authorize. Ngày dd/MM/yyyy hoặc ISO; giờ không có múi giờ được hiểu là giờ Việt Nam (UTC+7). Các API ghi quản lý phim, lịch chiếu và người dùng yêu cầu QuanTri.' };
delete spec.host;
delete spec.schemes;
spec.basePath = '/';
spec.consumes = ['application/json'];
spec.produces = ['application/json'];
spec.securityDefinitions = { Bearer: { type: 'apiKey', name: 'Authorization', in: 'header', description: 'Bearer <accessToken> nhận từ DangNhap' } };
const exampleUser = { taiKhoan: 'khachhang01', matKhau: 'Movie@123456', email: 'khachhang01@example.com', soDt: '0901234567', maNhom: 'GP01', hoTen: 'Nguyễn Văn An' };
const examples = {
  NguoiDung_VM: exampleUser,
  NguoiDungVM: { ...exampleUser, maLoaiNguoiDung: 'KhachHang' },
  ThongTinDangNhapVM: { taiKhoan: 'admin', matKhau: 'Xem ADMIN_PASSWORD trong .env' },
  LichChieuInsert: { maPhim: 1, maRap: '1', ngayChieuGioChieu: '20/12/2030 19:00:00', giaVe: 75000 },
  DanhSachVeDat: { maLichChieu: 1, danhSachVe: [{ maGhe: 1, giaVe: 75000 }] },
};
for (const [name, example] of Object.entries(examples)) {
  spec.definitions[name].example = example;
  spec.definitions[name].required = Object.keys(example);
}
const movieFields = [
  { name: 'tenPhim', type: 'string' }, { name: 'trailer', type: 'string' },
  { name: 'moTa', type: 'string' }, { name: 'maNhom', type: 'string', default: 'GP01' },
  { name: 'ngayKhoiChieu', type: 'string', description: 'dd/MM/yyyy hoặc yyyy-MM-dd' },
  { name: 'danhGia', type: 'integer', minimum: 0, maximum: 10 },
  ...['hot', 'dangChieu', 'sapChieu'].map(name => ({ name, type: 'boolean' })),
  { name: 'thoiLuong', type: 'integer', default: 120, minimum: 1, maximum: 600 },
  { name: 'File', type: 'file', description: 'PNG/JPEG/WebP; tối đa 5 MB' },
];
const protectedNames = new Set(['DatVe','TaoLichChieu','ThongTinTaiKhoan','LayThongTinNguoiDung','ThemNguoiDung','CapNhatThongTinNguoiDung','XoaNguoiDung','ThemPhimUploadHinh','CapNhatPhimUpload','XP','XoaPhim','QuanLyPhim']);
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const name = path.split('/').at(-1);
    operation.operationId = `${method}_${name}`;
    operation.summary ||= name;
    operation.parameters = (operation.parameters || []).filter(p => !['Authorization', 'TokenCybersoft'].includes(p.name));
    if (protectedNames.has(name)) operation.security = [{ Bearer: [] }];
    for (const p of operation.parameters) if (p.in === 'body') p.required = true;
    if (['ThemPhimUploadHinh', 'CapNhatPhimUpload'].includes(name)) {
      const updating = name === 'CapNhatPhimUpload';
      operation.consumes = ['multipart/form-data'];
      operation.parameters = movieFields.map(field => ({ ...field, in: 'formData', required: !updating && ['tenPhim','moTa','ngayKhoiChieu'].includes(field.name) }));
      if (updating) operation.parameters.unshift({ name: 'maPhim', in: 'formData', type: 'integer', required: true });
    }
    if (path === '/api/QuanLyPhim') operation.consumes = ['multipart/form-data'];
    operation.responses = {
      [method === 'post' && ['DangKy','ThemNguoiDung','ThemPhimUploadHinh','TaoLichChieu','DatVe'].includes(name) ? '201' : '200']: { description: 'Thành công: {statusCode, message, content, dateTime}' },
      400: { description: 'Dữ liệu không hợp lệ' },
      ...(operation.security ? { 401: { description: 'Chưa đăng nhập / token hết hạn' }, 403: { description: 'Không có quyền' } } : {}),
      404: { description: 'Không tìm thấy dữ liệu' },
      409: { description: 'Dữ liệu trùng hoặc xung đột nghiệp vụ' },
    };
  }
}
await writeFile(url, JSON.stringify(spec, null, 2) + '\n');

const collection = { info: { name: 'Movie Capstone API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' }, variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'token', value: '' }], item: [] };
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const params = operation.parameters || [];
    const query = params.filter(p => p.in === 'query').map(p => ({ key: p.name, value: String(p.default ?? (p.type === 'integer' ? 1 : p.name.toLowerCase().includes('hethong') ? 'BHDStar' : '')) }));
    const request = { method: method.toUpperCase(), header: [], url: { raw: `{{baseUrl}}${path}${query.length ? '?' + query.map(p => `${p.key}=${p.value}`).join('&') : ''}`, host: ['{{baseUrl}}'], path: path.slice(1).split('/'), query } };
    if (operation.security) request.auth = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
    const body = params.find(p => p.in === 'body');
    if (body) {
      request.header.push({ key: 'Content-Type', value: 'application/json' });
      request.body = { mode: 'raw', raw: JSON.stringify(spec.definitions[body.schema.$ref.split('/').at(-1)].example || {}, null, 2), options: { raw: { language: 'json' } } };
    }
    const fields = params.filter(p => p.in === 'formData');
    if (fields.length) request.body = { mode: 'formdata', formdata: fields.map(p => p.type === 'file' ? { key: p.name, type: 'file', src: [] } : { key: p.name, value: String(p.default ?? (p.type === 'integer' ? 1 : p.type === 'boolean' ? false : p.name === 'ngayKhoiChieu' ? '20/12/2030' : 'Phim demo')), type: 'text' }) };
    const item = { name: operation.operationId, request };
    if (path.endsWith('/DangNhap')) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ["const body = pm.response.json();", "if (body.content?.accessToken) pm.collectionVariables.set('token', body.content.accessToken);"] } }];
    collection.item.push(item);
  }
}
await writeFile(new URL('../docs/movie.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2) + '\n');
console.log(`Đã tạo Swagger và Postman cho ${collection.item.length} endpoints.`);
