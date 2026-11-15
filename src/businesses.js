import {furnishServices} from './business-services.js';
import {furnishEveryday} from './business-everyday.js';
import {furnishFood} from './business-food.js';
import {furnishChains} from './business-chains.js';

// Original fictional businesses on the north side of 長和路, west to east.
// Hours and prices describe the scenery; they are not live business listings.
export const NEIGHBOURHOOD_BUSINESSES=[
  {type:'laundry',name:'白日自助洗衣',caption:'洗衣・烘衣・24小時',hours:['24小時營業','全年無休'],color:'#477c83'},
  {type:'bank',name:'榕安銀行',caption:'長和分行',hours:['09:00–15:30','週一至週五'],color:'#355e64'},
  {type:'phone',name:'榕安通訊',caption:'手機・配件・維修',hours:['11:00–21:00','每日營業'],color:'#476d7c'},
  {type:'drinks',name:'涼日茶飲',caption:'原茶・鮮奶茶・珍珠奶茶',hours:['10:00–21:00','每日營業'],color:'#53735c'},
  {type:'estate',name:'榕安不動產',caption:'買屋・賣屋・租屋',hours:['09:00–19:00','每日營業'],color:'#9a4f3d'},
  {type:'barber',name:'永利理髮廳',caption:'男士理髮・剪髮・洗髮',hours:['09:00–19:00','每週一公休'],color:'#3f6366'},
  {type:'rechao',name:'長和熱炒',caption:'現點現炒・內用・外帶',hours:['11:00–14:00／17:00–23:00','每週二公休'],color:'#a04834',open:true},
  {type:'bakery',name:'晨香麵包坊',caption:'每日現烤・麵包・吐司',hours:['07:00–20:00','每日營業'],color:'#8b6947'},
];

export function furnishBusiness(type,api){
  if(['lottery','drugstore','supermarket','convenience'].includes(type))return furnishChains(type,api);
  if(['bank','phone','estate'].includes(type))return furnishServices(type,api);
  if(['laundry','barber'].includes(type))return furnishEveryday(type,api);
  return furnishFood(type,api);
}
