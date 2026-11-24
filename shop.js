
import { enabled, listProducts } from './firebase-client.js';
const byId = id => document.getElementById(id);
const currency = value => 'NT$ ' + Number(value).toLocaleString('zh-TW');
const grid = byId('grid');
const query = byId('query');
query.value = new URLSearchParams(location.search).get('q') || '';
const sort = byId('sort');
const tabs = [...byId('categories').querySelectorAll('button')];
let items = [];
let category = tabs[0].textContent;
let loaded = false;
function showProduct(product){
  const photos = [product.image, ...(product.extraImages ?? [])];
  const gallery = byId('gallery');
  gallery.replaceChildren();
  gallery.hidden = photos.length < 2;
  byId('photo').src = photos[0];
  if (photos.length > 1) {
    photos.forEach((url,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '照片 ' + (index + 1);
      button.setAttribute('aria-pressed',String(index === 0));
      button.addEventListener('click',() => {
        byId('photo').src = url;
        for (const item of gallery.children) {
          item.setAttribute('aria-pressed',String(item === button));
        }
      });
      gallery.append(button);
    });
  }
  byId('photo').alt = product.name;
  byId('name').textContent = product.name;
  byId('price').textContent = currency(product.price);
  byId('description').textContent = [product.category,product.condition,product.description].filter(Boolean).join(String.fromCharCode(10,10));
  byId('detail').showModal();
}
function render(){
  if(!loaded)return;
  const keyword = query.value.trim().toLowerCase();
  const results = items.filter(p => (category === tabs[0].textContent || p.category === category) && [p.name,p.category,p.description].join(' ').toLowerCase().includes(keyword));
  results.sort((a,b) => sort.value === 'asc' ? a.price-b.price : sort.value === 'desc' ? b.price-a.price : (b.created?.seconds ?? 0)-(a.created?.seconds ?? 0));
  byId('category-title').textContent = category;
  byId('count').textContent = '共 ' + results.length + ' 件商品';
  grid.replaceChildren();
  if(!results.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = items.length ? '找不到符合條件的商品。' : '目前尚無上架商品。';
    grid.append(empty);
  }
  for(const product of results){
    const card = document.createElement('button');
    card.className='card';
    const img = document.createElement('img');
    img.src=product.image; img.alt=''; img.loading='lazy';
    const copy=document.createElement('span');copy.className='copy';
    const label=document.createElement('small');label.textContent=product.category+' ｜ '+product.condition;
    const name=document.createElement('strong');name.textContent=product.name;
    const price=document.createElement('span');price.className='price';price.textContent=currency(product.price);
    copy.append(label,name,price);card.append(img,copy);
    card.addEventListener('click',()=>showProduct(product));grid.append(card);
  }
}
tabs.forEach(tab=>tab.addEventListener('click',()=>{
  category=tab.textContent;
  tabs.forEach(other=>other.setAttribute('aria-pressed',String(other===tab)));
  render();
}));
byId('search').addEventListener('submit',event=>{
  event.preventDefault();render();byId('products').scrollIntoView();
});
query.addEventListener('input',render);
sort.addEventListener('change',render);
if (!enabled) {
  grid.firstElementChild.textContent = '目前尚無上架商品。';
  loaded = true;
  render();
} else {
  listProducts().then(products => { items = products; loaded = true; render(); }).catch(() => {
    grid.firstElementChild.textContent = '暫時無法載入商品，請稍後再試。';
  });
}
