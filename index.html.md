<!DOCTYPE html>
<html lang="zh-TW">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">

<title>Taipei Meter Pro</title>

<link rel="stylesheet" href="style.css">

</head>

<body>

<div class="card">

<h2>🚖 Taipei Meter Pro</h2>

<div class="grid">

<div>距離</div>
<div id="distance">0 km</div>

<div>時間</div>
<div id="time">0 秒</div>

<div>速度</div>
<div id="speed">0 km/h</div>

<div>客收</div>
<div id="fare">60 元</div>

</div>

</div>

<div id="map"></div>

<div class="card">

<button onclick="startTrip()">開始</button>
<button onclick="pauseTrip()">暫停</button>
<button onclick="endTrip()">結束</button>
<button onclick="resetTrip()">重置</button>
<button onclick="takeScreenshot()">截圖</button>

</div>

<div class="card">

<h3>費率設定</h3>

起步價
<input id="baseFare" value="60">

每公里
<input id="kmFare" value="15">

每分鐘
<input id="timeFare" value="3">

等待速度(km/h)
<input id="waitSpeed" value="5">

</div>

<script src="config.js"></script>
<script src="gps.js"></script>
<script src="meter.js"></script>
<script src="receipt.js"></script>

<script async
src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap">
</script>

</body>
</html>
