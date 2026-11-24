import { enabled, authentication, createProduct, deleteProduct, listProducts } from './firebase-client.js';

const email = 'mrnobodyspreownedmarketplace@gmail.com';
const status = document.getElementById('status');
const login = document.getElementById('signin');
const logout = document.getElementById('signout');
const form = document.getElementById('listing');
const submit = form.querySelector('button');
const management = document.getElementById('manage');
const managementStatus = document.getElementById('manage-status');
const managementList = document.getElementById('manage-list');
const acceptedTypes = ['image/jpeg','image/png','image/webp'];

async function compressPhoto(file) {
  if (!acceptedTypes.includes(file.type) || !file.size || file.size > 5*1024*1024) {
    throw Error('請選擇 5 MB 以下的 JPG、PNG 或 WebP。');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 960/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width*ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height*ratio));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for (const quality of [0.82,0.62,0.42,0.25]) {
      const image = canvas.toDataURL('image/jpeg',quality);
      if (image.startsWith('data:image/jpeg;base64,') && image.length<=250000) return image;
    }
    throw Error('照片壓縮後仍太大，請先縮小照片。');
  } finally {
    bitmap.close();
  }
}

async function start() {
  if (!enabled) {
    status.textContent = '賣家登入尚未啟用。商店管理者完成一次 Firebase 設定後，即可使用 Google 登入。';
    return;
  }
  const {sdk,auth} = await authentication();
  const provider = new sdk.GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  let canPublish = false;
  let listRevision = 0;
  async function refreshProducts() {
    const revision = ++listRevision;
    managementStatus.textContent = '正在載入商品…';
    try {
      const products = await listProducts();
      if (revision !== listRevision || !canPublish) return;
      products.sort((a,b) => (b.created?.seconds ?? 0) - (a.created?.seconds ?? 0));
      managementList.replaceChildren();
      managementStatus.textContent = products.length ? '' : '目前尚無上架商品。';
      for (const product of products) {
        const row = document.createElement('li');
        row.append(product.name + ' ｜ NT$ ' + Number(product.price).toLocaleString('zh-TW') + ' ');
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cta';
        remove.textContent = '刪除';
        remove.setAttribute('aria-label','刪除 ' + product.name);
        remove.addEventListener('click', async () => {
          if (!canPublish || !window.confirm('確定永久刪除「' + product.name + '」？')) return;
          remove.disabled = true;
          managementStatus.textContent = '正在刪除商品…';
          try {
            await deleteProduct(product.id);
            if (canPublish) await refreshProducts();
          } catch(error) {
            if (canPublish) managementStatus.textContent = '刪除失敗（' + (error.code || '請稍後再試') + '）。';
          } finally {
            remove.disabled = false;
          }
        });
        row.append(remove);
        managementList.append(row);
      }
    } catch(error) {
      if (revision === listRevision && canPublish) {
        managementStatus.textContent = '無法載入商品（' + (error.code || '請稍後再試') + '）。';
      }
    }
  }
  sdk.onIdTokenChanged(auth, async user => {
    canPublish = false;
    listRevision++;
    management.hidden = true;
    managementList.replaceChildren();
    form.style.display = 'none';
    login.hidden = Boolean(user);
    login.disabled = Boolean(user);
    logout.hidden = !user;
    if (!user) {
      status.textContent = '請使用指定的賣家 Google 帳號登入。';
      return;
    }
    try {
      const token = await user.getIdTokenResult();
      if (auth.currentUser !== user) return;
      canPublish = token.signInProvider === 'google.com' && token.claims.email_verified === true &&
        token.claims.email?.toLowerCase() === email;
      form.style.display = canPublish ? 'grid' : 'none';
      management.hidden = !canPublish;
      if (canPublish) void refreshProducts();
      status.textContent = canPublish ? '已登入賣家帳號。' : '這個帳號沒有上架權限，請登出後切換帳號。';
    } catch {
      status.textContent = '無法確認登入狀態，請重新登入。';
    }
  });
  login.addEventListener('click', async () => {
    login.disabled = true;
    try { await sdk.signInWithPopup(auth,provider); }
    catch(error) { status.textContent = 'Google 登入失敗（'+(error.code || '請稍後再試')+'）。'; }
    finally { login.disabled = false; }
  });
  logout.addEventListener('click', async () => {
    try { await sdk.signOut(auth); }
    catch { status.textContent = '登出失敗，請再試一次。'; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!canPublish || submit.disabled) return;
    submit.disabled = true;
    status.textContent = '正在上架商品…';
    const fields = new FormData(form);
    try {
      const name = fields.get('name').trim();
      const description = fields.get('description').trim();
      if (!name || !description) throw Error('請輸入商品名稱和描述。');
      const photos = fields.getAll('photo');
      if (photos.length < 1 || photos.length > 3) throw Error('請選擇 1 到 3 張商品照片。');
      const images = [];
      for (const photo of photos) images.push(await compressPhoto(photo));
      const [image,...extraImages] = images;
      await createProduct({name,description,image,extraImages,price:Number(fields.get('price')),
        category:fields.get('category'),condition:fields.get('condition')});
      form.reset();
      status.textContent = '商品已上架。';
      if (canPublish) void refreshProducts();
    } catch(error) {
      status.textContent = '上架失敗。'+(error.code ? '請確認 Firebase 規則與連線設定（'+error.code+'）。' : error.message);
    } finally { submit.disabled = false; }
  });
}
start().catch(() => { status.textContent = '賣家中心無法載入，請確認 Firebase 設定。'; });
