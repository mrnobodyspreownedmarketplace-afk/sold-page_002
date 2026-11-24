import { firebaseConfig } from './firebase-config.js';
export const enabled = Boolean(firebaseConfig?.projectId && firebaseConfig?.apiKey && firebaseConfig?.authDomain);
const cdn = 'https://www.gstatic.com/firebasejs/11.10.0/';
let appPromise;
let dbPromise;
function app(){
  return appPromise ??= import(cdn+'firebase-app.js').then(sdk => sdk.initializeApp(firebaseConfig));
}
async function database(){
  return dbPromise ??= Promise.all([app(),import(cdn+'firebase-firestore.js')])
    .then(([instance,sdk]) => ({sdk,db:sdk.getFirestore(instance)}));
}
export async function listProducts(){
  const {sdk,db} = await database();
  const snapshot = await sdk.getDocs(sdk.collection(db,'products'));
  return snapshot.docs.map(record => record.data());
}
export async function createProduct(product){
  const {sdk,db} = await database();
  await sdk.addDoc(sdk.collection(db,'products'),{...product,created:sdk.serverTimestamp()});
}
export async function authentication(){
  const [instance,sdk] = await Promise.all([app(),import(cdn+'firebase-auth.js')]);
  return {sdk,auth:sdk.getAuth(instance)};
}
