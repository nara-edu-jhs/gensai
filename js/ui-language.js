// Supplemental vocabulary for the map-first interface. Public place names remain as supplied.
const rows = [
  [
    "いまここから、次の一歩へ",
    "Your next step starts here",
    "从这里迈出下一步",
    "지금 여기서 다음 걸음으로"
  ],
  [
    "何を調べますか？",
    "What would you like to find?",
    "您想查找什么？",
    "무엇을 찾으시나요?"
  ],
  [
    "目的を選ぶと、地図が開きます。",
    "Choose a purpose to open the map.",
    "选择用途以打开地图。",
    "목적을 선택하면 지도가 열립니다."
  ],
  [
    "今いる場所から",
    "From where you are now",
    "从当前位置出发",
    "지금 있는 곳에서"
  ],
  [
    "自宅など、目的地への",
    "To your home or another destination",
    "前往家等目的地",
    "집이나 다른 목적지까지"
  ],
  [
    "経路を探す",
    "Find a route",
    "查找路线",
    "경로 찾기"
  ],
  [
    "近くの",
    "Nearby",
    "附近的",
    "가까운"
  ],
  [
    "避難場所などを",
    "Evacuation sites and other safe places",
    "避难场所等",
    "대피 장소 등"
  ],
  [
    "探す",
    "Find places",
    "查找",
    "찾기"
  ],
  [
    "目の前に危険があるときは、身の安全を優先してください。",
    "If you are in immediate danger, put your safety first.",
    "眼前有危险时，请优先确保自身安全。",
    "눈앞에 위험이 있으면 신변 안전을 우선하세요."
  ],
  [
    "← 最初に戻る",
    "← Back to start",
    "← 返回首页",
    "← 처음으로"
  ],
  [
    "目的地を選ぶ",
    "Choose a destination",
    "选择目的地",
    "목적지 선택"
  ],
  [
    "徒歩経路をGoogle マップで見る ↗",
    "Walking route in Google Maps ↗",
    "在 Google 地图中查看步行路线 ↗",
    "Google 지도에서 도보 경로 보기 ↗"
  ],
  [
    "災害リスクを見る",
    "View disaster risks",
    "查看灾害风险",
    "재난 위험 보기"
  ],
  [
    "重ね表示を消す",
    "Clear overlay",
    "清除叠加图层",
    "겹친 지도 지우기"
  ],
  [
    "その他",
    "More",
    "其他",
    "기타"
  ],
  [
    "過去の災害・道路の注意箇所",
    "Past disasters and road hazards",
    "历史灾害与道路注意地点",
    "과거 재난·도로 주의 지점"
  ],
  [
    "過去の代表的な災害事例（紫・歴）",
    "Selected past disasters (purple: H)",
    "历史灾害案例（紫色・历）",
    "주요 과거 재난 사례 (보라색·H)"
  ],
  [
    "自然災害伝承碑（茶・碑）",
    "Disaster memorials (brown: M)",
    "自然灾害纪念碑（棕色・碑）",
    "자연재해 전승비 (갈색·M)"
  ],
  [
    "道路冠水想定箇所（青・低／アンダーパス等）",
    "Potential road flooding (blue: L / underpasses, etc.)",
    "道路可能积水地点（蓝色・低／下穿道路等）",
    "도로 침수 예상 지점 (파란색·L / 지하차도 등)"
  ],
  [
    "全国の公開データを使用。過去の災害を網羅するものではなく、伝承碑の位置は被災範囲ではありません。道路冠水想定箇所は、すべてのアンダーパスや現在の冠水状況を示すものではありません。",
    "Uses public data from across Japan. Past disasters are not exhaustive, and memorial locations do not show affected areas. Road flood locations do not cover every underpass or show current flooding.",
    "使用日本全国公开数据。未涵盖所有历史灾害，纪念碑位置并不表示受灾范围。道路积水预测地点未涵盖所有下穿道路，也不表示当前积水情况。",
    "일본 전국의 공개 데이터를 사용합니다. 모든 과거 재난을 포함하지 않으며 전승비 위치는 피해 범위가 아닙니다. 도로 침수 예상 지점은 모든 지하차도나 현재 침수 상황을 나타내지 않습니다."
  ],
  [
    "選択した地点の情報",
    "Selected location details",
    "所选地点的信息",
    "선택한 지점 정보"
  ],
  [
    "地図を大きく見る",
    "View full-screen map",
    "全屏查看地图",
    "전체 화면 지도 보기"
  ],
  [
    "✕ 地図を閉じる",
    "✕ Close map",
    "✕ 关闭地图",
    "✕ 지도 닫기"
  ],
  [
    "現在地を使う",
    "Use my current location",
    "使用当前位置",
    "현재 위치 사용"
  ],
  [
    "住所・駅名で探す",
    "Search by address or station",
    "按地址或车站搜索",
    "주소·역 이름으로 검색"
  ],
  [
    "目的地はどこですか？",
    "Where is your destination?",
    "目的地在哪里？",
    "목적지는 어디인가요?"
  ],
  [
    "どこから出発しますか？",
    "Where will you start?",
    "从哪里出发？",
    "어디에서 출발하나요?"
  ],
  [
    "どの場所の近くで探しますか？",
    "Where should we search nearby?",
    "您想查找哪个地点附近？",
    "어느 곳 주변을 찾을까요?"
  ],
  [
    "目的地の住所・駅名を検索",
    "Search destination address or station",
    "搜索目的地地址或车站",
    "목적지 주소·역 검색"
  ],
  [
    "出発地の住所・駅名を検索",
    "Search starting address or station",
    "搜索出发地地址或车站",
    "출발지 주소·역 검색"
  ],
  [
    "目的地の住所・駅名",
    "Destination address or station",
    "目的地地址或车站",
    "목적지 주소·역"
  ],
  [
    "出発地の住所・駅名",
    "Starting address or station",
    "出发地地址或车站",
    "출발지 주소·역"
  ],
  [
    "保存地点",
    "Saved location",
    "已保存地点",
    "저장한 위치"
  ],
  [
    "選択した場所",
    "Selected place",
    "所选地点",
    "선택한 장소"
  ],
  [
    "現在地・住所・駅名から選ぶ",
    "Choose current location, address or station",
    "从当前位置、地址或车站选择",
    "현재 위치·주소·역에서 선택"
  ],
  [
    "出発地",
    "Start",
    "出发地",
    "출발지"
  ],
  [
    "探す場所",
    "Search near",
    "搜索地点",
    "검색할 장소"
  ],
  [
    "目的地",
    "Destination",
    "目的地",
    "목적지"
  ],
  [
    "変更",
    "Change",
    "更改",
    "변경"
  ],
  [
    "選択",
    "Choose",
    "选择",
    "선택"
  ],
  [
    "目的地への経路",
    "Route to your destination",
    "前往目的地的路线",
    "목적지까지 경로"
  ],
  [
    "近くの避難場所",
    "Nearby evacuation sites",
    "附近的避难场所",
    "가까운 대피 장소"
  ],
  [
    "保存した場所",
    "Saved places",
    "已保存地点",
    "저장한 장소"
  ],
  [
    "この端末・ブラウザに保存した場所です。オフラインでも保存時の情報を開けます。",
    "Places saved in this browser on this device. Saved information can be opened offline.",
    "保存在此设备浏览器中的地点。离线也可打开保存时的信息。",
    "이 기기의 브라우저에 저장한 장소입니다. 오프라인에서도 저장 당시의 정보를 열 수 있습니다."
  ],
  [
    "まだ保存がありません。場所を選んで「この表示を保存」を押してください。",
    "No saved places yet. Choose a location, then press “Save this view”.",
    "尚无保存记录。选择地点后，点击“保存当前视图”。",
    "아직 저장한 장소가 없습니다. 장소를 선택하고 “현재 화면 저장”을 누르세요."
  ],
  [
    "削除",
    "Delete",
    "删除",
    "삭제"
  ],
  [
    "保存を削除できませんでした。",
    "Could not delete the saved place.",
    "无法删除保存记录。",
    "저장한 장소를 삭제하지 못했습니다."
  ],
  [
    "この表示を保存",
    "Save this view",
    "保存当前视图",
    "현재 화면 저장"
  ],
  [
    "場所と地図を保存",
    "Save location and map",
    "保存地点与地图",
    "장소와 지도 저장"
  ],
  [
    "保存する名前",
    "Save as",
    "保存名称",
    "저장할 이름"
  ],
  [
    "出発地・目的地、取得済みの情報と地図を保存し、PNG画像も自動ダウンロードします。自宅などの位置はこの端末に残ります。",
    "Saves your start, destination, loaded information and map, and downloads a PNG image. Locations such as your home remain on this device.",
    "保存出发地、目的地、已获取的信息和地图，并自动下载 PNG 图片。家庭住址等位置将保留在此设备上。",
    "출발지·목적지, 불러온 정보와 지도를 저장하고 PNG 이미지도 자동으로 다운로드합니다. 집 등의 위치가 이 기기에 남습니다."
  ],
  [
    "未取得の地図、場所の新規検索、Google マップの経路案内には通信が必要です。ブラウザのデータを消すと保存も失われます。",
    "Unloaded maps, new searches and Google Maps directions need an internet connection. Clearing browser data also deletes saved places.",
    "尚未加载的地图、新地点搜索及 Google 地图路线导航需要网络连接。清除浏览器数据也会删除保存记录。",
    "아직 불러오지 않은 지도, 새 장소 검색, Google 지도 길찾기에는 인터넷이 필요합니다. 브라우저 데이터를 지우면 저장 내용도 사라집니다."
  ],
  [
    "閉じる",
    "Close",
    "关闭",
    "닫기"
  ],
  [
    "保存する",
    "Save",
    "保存",
    "저장"
  ],
  [
    "PNGを保存",
    "Download PNG",
    "下载 PNG",
    "PNG 다운로드"
  ],
  [
    "先に出発地や調べたい場所を選んでください。",
    "Choose a starting point or a place to explore first.",
    "请先选择出发地或要查询的地点。",
    "먼저 출발지나 알아볼 장소를 선택하세요."
  ],
  [
    "保存する名前を入力してください。",
    "Enter a name for this save.",
    "请输入保存名称。",
    "저장할 이름을 입력하세요."
  ],
  [
    "地図と表示を保存しています…",
    "Saving the map and information…",
    "正在保存地图和信息…",
    "지도와 정보를 저장하는 중…"
  ],
  [
    "オフラインでこのページを開けます。",
    "This page can be opened offline.",
    "此页面可离线打开。",
    "이 페이지를 오프라인에서 열 수 있습니다."
  ],
  [
    "アプリのオフライン準備が未完了です。HTTPSまたはlocalhostでオンラインのまま一度開き直してください。",
    "Offline setup is incomplete. Reopen the app online using HTTPS or localhost.",
    "离线准备尚未完成。请联网后通过 HTTPS 或 localhost 重新打开应用。",
    "오프라인 준비가 완료되지 않았습니다. 인터넷에 연결한 상태에서 HTTPS 또는 localhost로 다시 여세요."
  ],
  [
    " 一部の地図は未保存です。",
    " Some map tiles were not saved.",
    " 部分地图尚未保存。",
    " 일부 지도는 저장되지 않았습니다."
  ],
  [
    "保存済み",
    "Saved",
    "已保存",
    "저장됨"
  ],
  [
    "保存できませんでした。空き容量とブラウザの設定を確認してください。",
    "Could not save. Check available storage and browser settings.",
    "无法保存。请检查可用空间和浏览器设置。",
    "저장하지 못했습니다. 여유 공간과 브라우저 설정을 확인하세요."
  ],
  [
    "地図の表示",
    "Map display",
    "地图显示",
    "지도 표시"
  ],
  [
    "過去の災害・その他の情報",
    "Past disasters and other information",
    "历史灾害及其他信息",
    "과거 재난·기타 정보"
  ],
  [
    "説明・色の意味",
    "Explanation and color key",
    "说明与颜色含义",
    "설명·색의 의미"
  ],
  [
    "災害リスク ▾",
    "Disaster risks ▾",
    "灾害风险 ▾",
    "재난 위험 ▾"
  ],
  [
    "過去の災害・道路の注意箇所 ▾",
    "Past disasters / road hazards ▾",
    "历史灾害／道路注意地点 ▾",
    "과거 재난·도로 주의 지점 ▾"
  ],
  [
    "その他の地図情報",
    "Other map information",
    "其他地图信息",
    "기타 지도 정보"
  ],
  [
    "避難場所の番号を表示・非表示",
    "Show or hide evacuation site numbers",
    "显示或隐藏避难场所编号",
    "대피 장소 번호 표시·숨기기"
  ],
  [
    "避難場所",
    "Evacuation sites",
    "避难场所",
    "대피 장소"
  ],
  [
    "直線距離です。開設・道の安全は未確認です。",
    "Straight-line distance. Opening and route safety are unconfirmed.",
    "距离为直线距离。开放情况及道路安全尚未确认。",
    "직선거리입니다. 개방 여부와 경로 안전은 확인되지 않았습니다."
  ],
  [
    "移動の配慮・注意事項",
    "Accessibility and precautions",
    "行动辅助与注意事项",
    "이동 배려·주의 사항"
  ],
  [
    "上の欄で場所を選ぶと、近くの候補が表示されます。",
    "Choose a location above to show nearby sites.",
    "在上方选择地点，即可显示附近的候选场所。",
    "위에서 장소를 선택하면 주변 후보가 표시됩니다."
  ],
  [
    "出典と案内",
    "Sources and guidance",
    "来源与说明",
    "출처·안내"
  ],
  [
    "追加情報の出典",
    "Additional data sources",
    "附加信息来源",
    "추가 정보 출처"
  ],
  [
    "出典",
    "Sources",
    "来源",
    "출처"
  ],
  [
    "公的地図で確認 ↗",
    "Check official map ↗",
    "在官方地图确认 ↗",
    "공식 지도에서 확인 ↗"
  ],
  [
    "過去の代表的な災害事例",
    "Selected past disasters",
    "历史灾害案例",
    "주요 과거 재난 사례"
  ],
  [
    "自然災害伝承碑",
    "Disaster memorials",
    "自然灾害纪念碑",
    "자연재해 전승비"
  ],
  [
    "道路冠水想定箇所",
    "Potential road flooding locations",
    "道路可能积水地点",
    "도로 침수 예상 지점"
  ],
  [
    "追加情報を読み込み中…",
    "Loading additional information…",
    "正在加载附加信息…",
    "추가 정보 불러오는 중…"
  ],
  [
    "広域表示中。拡大すると地点の詳細を確認できます。",
    "Showing overview. Zoom in for location details.",
    "正在显示大范围地图。放大可查看地点详情。",
    "넓은 지역을 표시 중입니다. 확대하면 지점의 상세 정보를 볼 수 있습니다."
  ],
  [
    "この範囲は未収録または取得できませんでした。",
    "No coverage or unable to load this area.",
    "此区域未收录或无法获取。",
    "이 지역은 미수록이거나 불러오지 못했습니다."
  ],
  [
    "取得できませんでした。通信を確認し、表示を切り替えて再試行してください。",
    "Could not load. Check your connection, toggle the layer and retry.",
    "无法获取。请检查网络，切换图层后重试。",
    "불러오지 못했습니다. 인터넷 연결을 확인하고 표시를 껐다 켜서 다시 시도하세요."
  ],
  [
    "災害名",
    "Disaster name",
    "灾害名称",
    "재난 이름"
  ],
  [
    "災害の種類",
    "Disaster type",
    "灾害类型",
    "재난 종류"
  ],
  [
    "伝承内容",
    "Memorial account",
    "传承内容",
    "전승 내용"
  ],
  [
    "所在地",
    "Address",
    "所在地",
    "소재지"
  ],
  [
    "情報更新",
    "Updated",
    "信息更新",
    "정보 갱신"
  ],
  [
    "公開日",
    "Published",
    "公开日期",
    "공개일"
  ],
  [
    "詳細を見る",
    "View details",
    "查看详情",
    "자세히 보기"
  ],
  [
    "出典：地理院タイル",
    "Source: GSI map tiles",
    "来源：日本国土地理院地图瓦片",
    "출처: 일본 국토지리원 지도 타일"
  ],
  [
    "ハザードマップポータルサイト",
    "Hazard Map Portal",
    "灾害风险地图门户网站",
    "재해위험지도 포털"
  ],
  [
    "国土地理院・自然災害伝承碑",
    "GSI disaster memorials",
    "日本国土地理院・自然灾害纪念碑",
    "일본 국토지리원·자연재해 전승비"
  ],
  [
    "検索：国土地理院 ／",
    "Search: GSI /",
    "搜索：日本国土地理院 ／",
    "검색: 일본 국토지리원 /"
  ],
  [
    "HeartRails Express（駅情報）",
    "HeartRails Express (stations)",
    "HeartRails Express（车站信息）",
    "HeartRails Express (역 정보)"
  ],
  [
    "©︎ 奈良教育大学附属中学校 2026年度前期生徒会",
    "©︎ Nara University of Education Junior High School, Student Council, first term of 2026 academic year",
    "©︎ 奈良教育大学附属初中 2026学年度前期学生会",
    "©︎ 나라교육대학 부속중학교 2026학년도 전기 학생회"
  ],
  [
    "洪水：川の水があふれたときに、水につかる想定範囲です。",
    "River flooding: areas modeled to flood when rivers overflow.",
    "洪水：河水泛滥时预计被淹的区域。",
    "홍수: 강물이 넘칠 때 침수될 것으로 예상되는 범위입니다."
  ],
  [
    "土砂災害：がけ崩れや土石流などに注意が必要な区域です。",
    "Landslides: areas requiring caution for slope failures and debris flows.",
    "滑坡灾害：需注意崩塌、泥石流等的区域。",
    "산사태: 절벽 붕괴나 토석류 등에 주의가 필요한 구역입니다."
  ],
  [
    "津波：津波で水につかる想定範囲です。",
    "Tsunami: areas modeled to be inundated by a tsunami.",
    "海啸：预计因海啸被淹的区域。",
    "쓰나미: 쓰나미로 침수될 것으로 예상되는 범위입니다."
  ],
  [
    "内水氾濫：大雨で下水や水路から水があふれ、水につかる想定範囲です。",
    "Surface-water flooding: areas modeled to flood when heavy rain overwhelms drains and channels.",
    "内涝：大雨导致排水管道或水渠溢水时预计被淹的区域。",
    "내수 범람: 폭우로 하수도나 수로가 넘쳐 침수될 것으로 예상되는 범위입니다."
  ],
  [
    "高潮：台風などで海面が高くなり、水につかる想定範囲です。",
    "Storm surge: areas modeled to flood as sea levels rise during typhoons and similar events.",
    "风暴潮：台风等导致海面升高时预计被淹的区域。",
    "폭풍해일: 태풍 등으로 해수면이 높아질 때 침수될 것으로 예상되는 범위입니다."
  ],
  [
    "保存は20件までです。使わない保存を削除してから保存してください。",
    "Up to 20 places can be saved. Delete an unused save first.",
    "最多可保存20条。请先删除不需要的保存记录。",
    "최대 20개까지 저장할 수 있습니다. 불필요한 저장 내용을 먼저 삭제하세요."
  ]
];
const templates = [
  [
    "{0}の保存を削除",
    "Delete saved place {0}",
    "删除保存地点{0}",
    "{0} 저장 삭제"
  ],
  [
    "目的地：{0}を変更",
    "Change destination: {0}",
    "更改目的地：{0}",
    "목적지 변경: {0}"
  ],
  [
    "{0}：経路・詳しい情報",
    "{0}: route and details",
    "{0}：路线与详细信息",
    "{0}: 경로·상세 정보"
  ],
  [
    "{0} ／ 地図 {1}枚",
    "{0} / {1} map tiles",
    "{0} ／ 地图{1}张",
    "{0} / 지도 타일 {1}개"
  ],
  [
    "保存した表示：{0}（情報の保存：{1}）。現在地・開設状況・道路状況の最新情報ではありません。",
    "Saved view: {0} (information saved: {1}). This is not current location, opening or road condition information.",
    "已保存视图：{0}（信息保存于：{1}）。并非当前位置、开放情况或道路状况的最新信息。",
    "저장한 화면: {0} (정보 저장: {1}). 현재 위치·개방·도로 상황의 최신 정보가 아닙니다."
  ],
  [
    "保存しました。地図 {0}/{1}枚。{2}「保存した場所」から呼び出せます。",
    "Saved {0}/{1} map tiles. {2} Open from “Saved places”.",
    "已保存地图{0}/{1}张。{2}可从“已保存地点”打开。",
    "지도 타일 {0}/{1}개를 저장했습니다. {2} “저장한 장소”에서 열 수 있습니다."
  ],
  [
    "{0} PNG画像を作成しています…",
    "{0} Creating PNG image…",
    "{0} 正在生成 PNG 图片…",
    "{0} PNG 이미지 만드는 중…"
  ],
  [
    "{0} PNG画像のダウンロードを開始しました。{1}保存されない場合は「PNGを保存」を押してください。",
    "{0} PNG download started. {1}If it is not saved, press “Download PNG”.",
    "{0} 已开始下载 PNG 图片。{1}如果未保存，请点击“下载 PNG”。",
    "{0} PNG 다운로드를 시작했습니다. {1}저장되지 않으면 “PNG 다운로드”를 누르세요."
  ],
  [
    "画像に取り込めなかった地図が{0}枚あります。",
    "{0} map tiles could not be included. ",
    "有{0}张地图未能加入图片。",
    "지도 타일 {0}개를 이미지에 넣지 못했습니다. "
  ],
  [
    "{0} PNG画像は作成できませんでした：{1}通信できる状態で再度保存してください。",
    "{0} Could not create PNG: {1} Save again with an internet connection.",
    "{0} 无法生成 PNG：{1}请联网后重新保存。",
    "{0} PNG를 만들지 못했습니다: {1} 인터넷에 연결한 후 다시 저장하세요."
  ],
  [
    "{0}地点（地図周辺）{1}{2}",
    "{0} locations near map {1}{2}",
    "地图周边{0}处{1}{2}",
    "지도 주변 {0}개 지점 {1}{2}"
  ],
  [
    "・一部取得失敗",
    " / some data failed to load",
    "・部分数据获取失败",
    " / 일부 불러오기 실패"
  ],
  [
    "・未収録または該当情報なし",
    " / no coverage or matching data",
    "・未收录或无相关信息",
    " / 미수록 또는 해당 정보 없음"
  ]
];
rows.push(...[["調べる目的", "Search purpose", "查询目的", "검색 목적"], ["地図で調べる災害", "Disaster layers", "地图灾害图层", "지도로 확인할 재난"], ["結果へ移動", "Go to results", "前往结果", "결과로 이동"], ["追加情報の出典：", "Additional data sources:", "附加信息来源：", "추가 정보 출처:"], ["地図を全画面で見る", "Full-screen map", "全屏查看地图", "전체 화면 지도"], ["全画面を終了", "Exit full screen", "退出全屏", "전체 화면 종료"], ["画像を取得できません", "Could not load an image", "无法获取图片", "이미지를 불러오지 못했습니다"], ["地図の読み込み後に、もう一度PNGを保存してください。", "Wait for the map to load, then save the PNG again.", "请等待地图加载后重新保存 PNG。", "지도를 불러온 후 PNG를 다시 저장하세요."], ["PNG画像を作成できませんでした。", "Could not create PNG image.", "无法生成 PNG 图片。", "PNG 이미지를 만들지 못했습니다."], ["出発地・調べた場所", "Starting point / explored location", "出发地／查询地点", "출발지·조회한 장소"], ["直線距離", "Straight-line distance", "直线距离", "직선거리"], ["画像の保存日時", "Image saved", "图片保存时间", "이미지 저장 시간"], ["保存した範囲の地図", "Map of the saved area", "已保存区域地图", "저장한 범위의 지도"], ["保存時の情報です。避難場所の開設・道路の安全は未確認です。自治体等の最新情報を優先してください。", "Saved information. Evacuation site opening and road safety are unconfirmed. Follow the latest official local information.", "信息为保存时的内容。避难场所开放及道路安全尚未确认。请优先参考当地政府的最新信息。", "저장 당시의 정보입니다. 대피 장소 개방·도로 안전은 확인되지 않았습니다. 지방자치단체 등의 최신 정보를 우선하세요."], ["出典：地理院タイル（国土地理院）、ハザードマップポータルサイト", "Sources: GSI map tiles (Geospatial Information Authority of Japan), Hazard Map Portal", "来源：地理院地图瓦片（日本国土地理院）、灾害风险地图门户网站", "출처: 일본 국토지리원 지도 타일, 재해위험지도 포털"], ["川の水があふれた場合の浸水想定区域", "Modeled inundation zones for river overflow", "河水泛滥时的预计淹水区域", "강물 범람 시 예상 침수 구역"], ["土砂災害の警戒区域・特別警戒区域", "Landslide warning and special warning zones", "滑坡灾害警戒及特别警戒区域", "산사태 경계·특별 경계 구역"], ["高潮の浸水想定区域", "Modeled storm surge inundation zones", "风暴潮预计淹水区域", "폭풍해일 예상 침수 구역"], ["津波の浸水想定区域", "Modeled tsunami inundation zones", "海啸预计淹水区域", "쓰나미 예상 침수 구역"], ["下水や水路等があふれた場合の浸水想定区域", "Modeled inundation zones for overflowing drains and channels", "排水管道或水渠等溢水时的预计淹水区域", "하수도·수로 등이 넘칠 때 예상 침수 구역"], ["色は想定区域で、現在の発生状況ではありません。", "Colors show modeled zones, not current disasters.", "颜色表示预测区域，并非当前灾害发生情况。", "색은 예상 구역이며 현재 재난 발생 상황이 아닙니다."], ["警戒区域", "Warning zone", "警戒区域", "경계 구역"], ["特別警戒区域", "Special warning zone", "特别警戒区域", "특별 경계 구역"], ["0.5m未満", "Under 0.5 m", "不足0.5米", "0.5m 미만"], ["20m以上", "20 m or more", "20米以上", "20m 이상"], ["洪水", "Flood", "洪水", "홍수"], ["土砂災害", "Landslide", "滑坡灾害", "산사태"], ["津波", "Tsunami", "海啸", "쓰나미"], ["高潮", "Storm surge", "风暴潮", "폭풍해일"], ["内水氾濫", "Surface-water flooding", "内涝", "내수 범람"]]);
templates.push(...[["{0}の周辺", "Around {0}", "{0}周边", "{0} 주변"], ["出発地：{0}", "Start: {0}", "出发地：{0}", "출발지: {0}"], ["目的地：{0}", "Destination: {0}", "目的地：{0}", "목적지: {0}"], ["注意：地図画像{0}枚をPNGに取り込めませんでした。空白部分は情報がありません。", "Warning: {0} map tiles could not be included. Blank areas contain no information.", "注意：有{0}张地图图片未能加入 PNG。空白部分没有信息。", "주의: 지도 타일 {0}개를 PNG에 넣지 못했습니다. 빈 부분에는 정보가 없습니다."]]);
rows.push(...[
  [
    "電車・バスの運行情報",
    "Train & bus service",
    "电车与巴士运行信息",
    "철도·버스 운행 정보"
  ],
  [
    "全国の運行情報を確認",
    "Check service information across Japan",
    "查询日本全国运行信息",
    "일본 전국 운행 정보 확인"
  ],
  [
    "全国の鉄道（ジョルダン） ↗",
    "Rail across Japan (Jorudan) ↗",
    "全国铁路（Jorudan） ↗",
    "전국 철도 (Jorudan) ↗"
  ],
  [
    "全国のバス案内（NAVITIME） ↗",
    "Bus information across Japan (NAVITIME) ↗",
    "全国巴士指南（NAVITIME） ↗",
    "전국 버스 안내 (NAVITIME) ↗"
  ],
  [
    "交通案内サイトが別のタブで開きます。対象外の路線もあるため、最終確認は各交通会社の公式情報で行ってください。",
    "Transport information opens in a new tab. Some routes may be missing; confirm details with the operator.",
    "交通信息网站将在新标签页打开。部分线路可能不包含在内，请最终向运营公司的官方信息确认。",
    "교통 안내 사이트가 새 탭에서 열립니다. 일부 노선은 포함되지 않을 수 있으므로 운송 회사의 공식 정보로 최종 확인하세요."
  ],
  [
    "地域から公式情報を探す",
    "Find official information by area",
    "按地区查找官方信息",
    "지역별 공식 정보 찾기"
  ],
  [
    "都道府県",
    "Prefecture",
    "都道府县",
    "도도부현"
  ],
  [
    "全国から選ぶ",
    "Choose from all Japan",
    "从全国选择",
    "전국에서 선택"
  ],
  [
    "出発地の近く（目安）",
    "Near starting point (approx.)",
    "出发地附近（参考）",
    "출발지 근처 (참고)"
  ],
  [
    "目的地の近く（目安）",
    "Near destination (approx.)",
    "目的地附近（参考）",
    "목적지 근처 (참고)"
  ],
  [
    "近い県庁所在地を目安に選びます。県境・離島では選び直してください。",
    "Suggested using the nearest prefectural capital. Change it near borders or on remote islands.",
    "以最近的县厅所在地为参考。县界附近或离岛请重新选择。",
    "가장 가까운 도도부현 청사 소재지를 기준으로 제안합니다. 경계·외딴섬에서는 다시 선택하세요."
  ],
  [
    "鉄道会社の公式情報を検索 ↗",
    "Search for official rail information ↗",
    "搜索铁路公司官方信息 ↗",
    "철도 회사 공식 정보 검색 ↗"
  ],
  [
    "バス会社の公式情報を検索 ↗",
    "Search for official bus information ↗",
    "搜索巴士公司官方信息 ↗",
    "버스 회사 공식 정보 검색 ↗"
  ],
  [
    "検索結果から会社名・公式サイトを確認してください。掲載がないことは通常運行を意味しません。",
    "Check the operator name and official website in search results. Missing information does not mean normal service.",
    "请在搜索结果中确认公司名称和官方网站。未刊载信息并不意味着正常运行。",
    "검색 결과에서 회사명과 공식 사이트를 확인하세요. 정보가 없다고 정상 운행이라는 뜻은 아닙니다."
  ],
  [
    "運行情報の確認には通信が必要です。オフライン保存に最新の運行状況は含まれません。",
    "An internet connection is required. Offline saves do not include current service conditions.",
    "查询运行信息需要网络。离线保存不包含最新运行状况。",
    "운행 정보 확인에는 인터넷이 필요합니다. 오프라인 저장에는 최신 운행 상황이 포함되지 않습니다."
  ],
  [
    "閉じる",
    "Close",
    "关闭",
    "닫기"
  ]
]);
rows.push(...[["上が北", "North is up", "上方为北", "위쪽이 북쪽"], ["地図の方角：上が北です。端末の向きを示すものではありません。", "Map orientation: north is up. This does not indicate the direction your device is facing.", "地图方向：上方为北。不表示设备朝向。", "지도 방향: 위쪽이 북쪽입니다. 기기가 향하는 방향을 나타내지는 않습니다."], ["地図は北が上です。GPS・方位センサーなしで表示できます。", "North is at the top of the map. No GPS or compass sensor is required.", "地图上方为北。无需 GPS 或方向传感器。", "지도 위쪽이 북쪽입니다. GPS나 방향 센서가 필요하지 않습니다."]]);
rows.push(...[["設定欄を隠す", "Hide settings", "隐藏设置栏", "설정란 숨기기"], ["場所の設定を表示", "Show location settings", "显示地点设置", "장소 설정 표시"]]);
rows.push(...[["表示範囲", "Map view", "显示范围", "표시 범위"], ["自動（拡大優先）", "Auto (closer view)", "自动（优先放大）", "자동 (확대 우선)"], ["出発地周辺", "Around start", "出发地周边", "출발지 주변"], ["目的地周辺", "Around destination", "目的地周边", "목적지 주변"], ["全体（両地点）", "Both locations", "全景（两地点）", "전체 (두 지점)"], ["地図の表示範囲を選ぶ", "Choose the map view", "选择地图显示范围", "지도 표시 범위 선택"], ["両地点が遠いため、出発地周辺を拡大しています。「全体」で両地点を確認できます。", "The locations are far apart, so the starting area is enlarged. Choose Both locations for an overview.", "两地点距离较远，已放大出发地周边。选择全景可查看两地点。", "두 지점이 멀리 떨어져 출발지 주변을 확대했습니다. 전체를 선택하면 두 지점을 볼 수 있습니다."]]);
rows.push(...[["操作ボタンを隠す", "Hide map controls", "隐藏地图按钮", "지도 버튼 숨기기"], ["操作ボタンを表示", "Show map controls", "显示地图按钮", "지도 버튼 표시"]]);
const languages = ['ja','en','zh','ko'];
const originals = new Map();
for (const row of rows) for (const value of row) originals.set(value, row[0]);
export function ui(value, language = document.documentElement.lang) {
  const original = originals.get(value) || value;
  const row = rows.find(row => row[0] === original);
  const index=Math.max(0,languages.indexOf(language));
  if(row)return row[index];
  for(const forms of templates)for(const form of forms){
    const fields=[];
    const expression=form.split(/(\{\d+\})/).map(part=>{if(/^\{\d+\}$/.test(part)){fields.push(Number(part.slice(1,-1)));return '(.*?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');
    const match=String(value).match(new RegExp('^'+expression+'$','s'));
    if(match){const values={};fields.forEach((field,i)=>values[field]=match[i+1]);return forms[index].replace(/\{(\d+)\}/g,(_,key)=>ui(values[key],language));}
  }
  return value;
}
export function localizeInterface(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    if(node.parentElement?.closest('ruby,rt,script,style,textarea,[data-public-name]'))continue;
    const value=node.nodeValue, trimmed=value.trim(), translated=ui(trimmed);
    if(translated!==trimmed)node.nodeValue=value.replace(trimmed,translated);
  }
  for(const element of root.querySelectorAll('[aria-label],[placeholder],[title]'))for(const name of ['aria-label','placeholder','title']){
    if(element.hasAttribute(name)){const value=element.getAttribute(name),translated=ui(value);if(value!==translated)element.setAttribute(name,translated);}
  }
}
export function startInterfaceLocalization(){
  localizeInterface();let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;localizeInterface();});}).observe(document.body,{childList:true,subtree:true,characterData:true});
}
