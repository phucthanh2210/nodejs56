import { readFile, writeFile } from 'node:fs/promises';

const spec = JSON.parse(await readFile(new URL('../docs/swagger.json', import.meta.url), 'utf8'));
const collection = {
  info: { name: 'Movie API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'token', value: '' }],
  item: [],
};
const formValues = {
  maPhim: '1', tenPhim: 'Hành trình vũ trụ', trailer: '', moTa: 'Hành trình khám phá không gian.',
  maNhom: 'GP01', ngayKhoiChieu: '20/12/2030', danhGia: '8', hot: 'false',
  dangChieu: 'true', sapChieu: 'false', thoiLuong: '120',
};

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const params = operation.parameters || [];
    const query = params.filter(p => p.in === 'query').map(p => ({ key: p.name, value: String(p.default ?? (p.type === 'integer' ? 1 : p.name === 'maHeThongRap' ? 'BHDStar' : '')) }));
    const request = {
      method: method.toUpperCase(), header: [],
      url: { raw: `{{baseUrl}}${path}${query.length ? '?' + query.map(p => `${p.key}=${p.value}`).join('&') : ''}`, host: ['{{baseUrl}}'], path: path.slice(1).split('/'), query },
    };
    if (operation.security) request.auth = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
    const body = params.find(p => p.in === 'body');
    if (body) {
      request.header.push({ key: 'Content-Type', value: 'application/json' });
      const example = spec.definitions[body.schema.$ref.split('/').at(-1)].example;
      request.body = { mode: 'raw', raw: JSON.stringify(example || {}, null, 2), options: { raw: { language: 'json' } } };
    }
    const fields = params.filter(p => p.in === 'formData');
    if (fields.length) request.body = { mode: 'formdata', formdata: fields.map(p => p.type === 'file'
      ? { key: p.name, type: 'file', src: [], disabled: !p.required }
      : { key: p.name, value: formValues[p.name] ?? String(p.default ?? ''), type: 'text' }) };
    const item = { name: operation.operationId, request };
    if (path.endsWith('/DangNhap')) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: [
      'const body = pm.response.json();',
      "if (body.content?.accessToken) pm.collectionVariables.set('token', body.content.accessToken);",
    ] } }];
    collection.item.push(item);
  }
}

await writeFile(new URL('../docs/movie.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2) + '\n');
console.log(`Đã tạo collection Postman với ${collection.item.length} requests.`);
