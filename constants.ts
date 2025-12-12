import { DaySchedule, ActivityType } from './types';

export const TRIP_START_DATE = new Date('2025-12-13T00:00:00');
export const TRIP_END_DATE = new Date('2025-12-20T23:59:59');

export const INITIAL_ITINERARY: DaySchedule[] = [
  {
    date: '2025-12-13',
    dayLabel: '第 1 天',
    title: '抵達與安頓',
    items: [
      {
        id: '1-1',
        time: '14:00',
        title: '抵達希斯洛機場 (LHR)',
        description: '搭乘希斯洛快線 (Heathrow Express) 前往帕丁頓車站。',
        type: ActivityType.FLIGHT,
        locationName: 'Heathrow Airport',
        coordinates: { lat: 51.4700, lng: -0.4543 },
        duration: 90
      },
      {
        id: '1-2',
        time: '16:00',
        title: '飯店辦理入住',
        description: '放置行李並稍作休息梳洗。',
        type: ActivityType.HOTEL,
        locationName: '倫敦市中心飯店 (暫定)',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        notes: '預訂編號 #12345',
        duration: 60
      },
      {
        id: '1-3',
        time: '18:30',
        title: '歡迎晚餐：英式酒吧',
        description: '享用經典炸魚薯條開啟旅程。',
        type: ActivityType.FOOD,
        locationName: 'The Churchill Arms',
        coordinates: { lat: 51.5069, lng: -0.1944 },
        duration: 120
      }
    ]
  },
  {
    date: '2025-12-14',
    dayLabel: '第 2 天',
    title: '倫敦經典地標',
    items: [
      {
        id: '2-1',
        time: '09:00',
        title: '大笨鐘與國會大廈',
        description: '西敏寺周邊徒步導覽。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Big Ben',
        coordinates: { lat: 51.5007, lng: -0.1246 },
        duration: 90
      },
      {
        id: '2-2',
        time: '11:00',
        title: '倫敦眼',
        description: '預訂 11:15 AM 場次門票。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'London Eye',
        coordinates: { lat: 51.5033, lng: -0.1195 },
        price: '£35/人',
        duration: 60
      },
      {
        id: '2-3',
        time: '13:00',
        title: '南岸中心午餐',
        description: '擁有豐富多樣選擇的美食市集。',
        type: ActivityType.FOOD,
        locationName: 'Southbank Centre Food Market',
        coordinates: { lat: 51.5060, lng: -0.1158 },
        duration: 90
      },
      {
        id: '2-4',
        time: '15:00',
        title: '泰特現代藝術館',
        description: '參觀當代藝術博物館。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Tate Modern',
        coordinates: { lat: 51.5076, lng: -0.0994 },
        duration: 120
      }
    ]
  },
  {
    date: '2025-12-15',
    dayLabel: '第 3 天',
    title: '歷史與文化',
    items: [
      {
        id: '3-1',
        time: '10:00',
        title: '大英博物館',
        description: '參觀羅塞塔石碑與埃爾金大理石雕。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'The British Museum',
        coordinates: { lat: 51.5194, lng: -0.1270 },
        duration: 180
      },
      {
        id: '3-2',
        time: '14:00',
        title: '柯芬園',
        description: '欣賞街頭藝人表演與購物。',
        type: ActivityType.SHOPPING,
        locationName: 'Covent Garden Market',
        coordinates: { lat: 51.5117, lng: -0.1240 },
        duration: 120
      },
      {
        id: '3-3',
        time: '19:30',
        title: '西區音樂劇',
        description: '於 Lyceum 劇院觀賞《獅子王》。',
        type: ActivityType.EVENT,
        locationName: 'Lyceum Theatre',
        coordinates: { lat: 51.5113, lng: -0.1194 },
        duration: 180
      }
    ]
  },
  {
    date: '2025-12-16',
    dayLabel: '第 4 天',
    title: '皇室與奢華',
    items: [
      {
        id: '4-1',
        time: '10:00',
        title: '白金漢宮',
        description: '觀賞衛兵交接儀式 (需當天確認時間表)。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Buckingham Palace',
        coordinates: { lat: 51.5014, lng: -0.1419 },
        duration: 90
      },
      {
        id: '4-2',
        time: '13:00',
        title: '哈羅德百貨 (Harrods)',
        description: '參觀奢華美食廣場與選購禮品。',
        type: ActivityType.SHOPPING,
        locationName: 'Harrods',
        coordinates: { lat: 51.4994, lng: -0.1632 },
        duration: 120
      },
      {
        id: '4-3',
        time: '16:00',
        title: '海德公園冬季樂園',
        description: 'Winter Wonderland 聖誕市集、遊樂設施與熱紅酒。',
        type: ActivityType.EVENT,
        locationName: 'Hyde Park',
        coordinates: { lat: 51.5073, lng: -0.1657 },
        duration: 180
      }
    ]
  },
  {
    date: '2025-12-17',
    dayLabel: '第 5 天',
    title: '倫敦城與塔橋',
    items: [
      {
        id: '5-1',
        time: '09:30',
        title: '倫敦塔',
        description: '參觀皇室珠寶與白塔。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Tower of London',
        coordinates: { lat: 51.5081, lng: -0.0759 },
        duration: 120
      },
      {
        id: '5-2',
        time: '12:00',
        title: '倫敦塔橋',
        description: '體驗高空玻璃走廊。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Tower Bridge',
        coordinates: { lat: 51.5055, lng: -0.0754 },
        duration: 60
      },
      {
        id: '5-3',
        time: '13:30',
        title: '波羅市場 (Borough Market)',
        description: '在著名的美食市集享用午餐。',
        type: ActivityType.FOOD,
        locationName: 'Borough Market',
        coordinates: { lat: 51.5054, lng: -0.0909 },
        duration: 90
      },
      {
        id: '5-4',
        time: '18:00',
        title: '碎片塔 (The Shard)',
        description: '高空景觀小酌 (Shard View)。',
        type: ActivityType.EVENT,
        locationName: 'The Shard',
        coordinates: { lat: 51.5045, lng: -0.0865 },
        duration: 90
      }
    ]
  },
  {
    date: '2025-12-18',
    dayLabel: '第 6 天',
    title: '探索肖迪奇 (Shoreditch)',
    items: [
      {
        id: '6-1',
        time: '11:00',
        title: '街頭藝術導覽',
        description: '探索紅磚巷 (Brick Lane) 的塗鴉藝術。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'Brick Lane',
        coordinates: { lat: 51.5222, lng: -0.0718 },
        duration: 90
      },
      {
        id: '6-2',
        time: '13:00',
        title: 'Beigel Bake 貝果',
        description: '品嚐著名的鹹牛肉貝果。',
        type: ActivityType.FOOD,
        locationName: 'Beigel Bake',
        coordinates: { lat: 51.5245, lng: -0.0716 },
        duration: 60
      },
       {
        id: '6-3',
        time: '15:00',
        title: '史皮塔佛德市集',
        description: '特色服飾、古著與手工藝品。',
        type: ActivityType.SHOPPING,
        locationName: 'Old Spitalfields Market',
        coordinates: { lat: 51.5198, lng: -0.0768 },
        duration: 120
      }
    ]
  },
  {
    date: '2025-12-19',
    dayLabel: '第 7 天',
    title: '自由活動 / 備案',
    items: [
        {
        id: '7-1',
        time: '10:00',
        title: '自由探索',
        description: '查看備案清單或重遊最喜愛的景點。',
        type: ActivityType.SIGHTSEEING,
        locationName: 'London',
        coordinates: { lat: 51.5072, lng: -0.1276 },
        duration: 360
      }
    ]
  },
  {
    date: '2025-12-20',
    dayLabel: '第 8 天',
    title: '返程',
    items: [
      {
        id: '8-1',
        time: '09:00',
        title: '飯店退房',
        description: '確認所有物品皆已帶齊。',
        type: ActivityType.HOTEL,
        locationName: 'Central London Hotel',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        duration: 60
      },
      {
        id: '8-2',
        time: '11:00',
        title: '希斯洛快線',
        description: '前往機場準備搭機。',
        type: ActivityType.TRANSPORT,
        locationName: 'Paddington Station',
        coordinates: { lat: 51.5154, lng: -0.1755 },
        duration: 60
      }
    ]
  }
];