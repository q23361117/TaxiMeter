<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>計程車計費 + Google 地圖</title>
<style>
body { font-family: Arial, sans-serif; margin:0; padding:0; text-align:center; }
#map { height:60vh; width:100%; }
#controls { padding:10px; }
input, button { font-size:16px; padding:5px; margin:5px; }
#timer,#distance,#fare { font-size:22px; margin:6px 0; }
</style>
</head>
<body>

<h2>計程車計費器 + Google 地圖</h2>

<div id="controls">
 名稱: <input type="text" id="taxiName" value="Taxi-001"><br>
 基本費率: <input type="number" id="baseFare" value="85"> 元<br>
 公里費率: <input type="number" id="kmFare" value="5"> 元<br>
 時間費率: <input type="number" id="timeFare" value="5"> 元<br>
 超15km 加成: <input type="number" id="extraKmFare" value="10"> 元<br>
 百回(100元/回10元): <input type="number" id="hundredUnit" value="100"> , <input type="number" id="hundredFare" value="10"> 元<br>
 固定回傭: <input type="number" id="fixedCommission" value="20"> 元
</div>

<div id="timer">時間: 00:000</div>
<div id="distance">里程: 0.00 km</div>
<div id="fare">車資: 0 元</div>

<button onclick="startTrip()">開始</button>
<button onclick="pauseTrip()">暫停</button>
<button onclick="resetTrip()">重置</button>

<div id="map"></div>

<script>
// ---- 全域變數 ----
let map, polyline, watchId = null, pathCoords = [];
let startTime=0, elapsedTime=0, timerInterval=null;
let prevPos = null, distanceKm = 0;

// ---- 初始化 Google 地圖 ----
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15,
        disableDefaultUI: true
    });
    polyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeWeight: 4,
    });
    polyline.setMap(map);
}

// ---- 格式化時間 ----
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const milliseconds = ms % 60000;
    return `${minutes}:${milliseconds.toString().padStart(3,'0')}`;
}

// ---- 計算GPS距離 Haversine ----
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R * c;
}

// ---- 計算車資 ----
function calculateFare() {
    const baseFare = parseFloat(document.getElementById("baseFare").value);
    const kmFare = parseFloat(document.getElementById("kmFare").value);
    const timeFare = parseFloat(document.getElementById("timeFare").value);
    const extraKmFare = parseFloat(document.getElementById("extraKmFare").value);
    const hundredUnit = parseFloat(document.getElementById("hundredUnit").value);
    const hundredFare = parseFloat(document.getElementById("hundredFare").value);
    const fixedCommission = parseFloat(document.getElementById("fixedCommission").value);

    let fare = baseFare;
    fare += (distanceKm * kmFare);

    if (distanceKm > 15) {
        fare += (distanceKm - 15) * extraKmFare;
    }

    let waitMin = Math.floor(elapsedTime / 60000);
    fare += waitMin * timeFare;

    // 百回
    let hundredTimes = Math.floor(fare / hundredUnit);
    fare += hundredTimes * hundredFare;

    fare += fixedCommission;
    return Math.round(fare);
}

// ---- 開始計程 ----
function startTrip() {
    // 計時
    if (!timerInterval) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            document.getElementById("timer").textContent = "時間: " + formatTime(elapsedTime);
            document.getElementById("fare").textContent = "車資: " + calculateFare() + " 元";
        }, 10);
    }

    // GPS
    if (!watchId && navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            pos => {
                const lat = pos.coords.latitude, lon = pos.coords.longitude;

                if (prevPos) {
                    distanceKm += getDistance(prevPos.lat, prevPos.lon, lat, lon) / 1000;
                    document.getElementById("distance").textContent = "里程: " + distanceKm.toFixed(2) + " km";
                }

                prevPos = { lat, lon };
                const latlng = new google.maps.LatLng(lat, lon);

                pathCoords.push(latlng);
                polyline.setPath(pathCoords);

                map.setCenter(latlng);

                // 畫點
                new google.maps.Marker({ position: latlng, map });
            },
            err => { console.error(err); alert("GPS 無法取得定位"); },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    }
}

// ---- 暫停 ----
function pauseTrip() {
    clearInterval(timerInterval); timerInterval = null;
    if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}

// ---- 重置 ----
function resetTrip() {
    clearInterval(timerInterval); timerInterval = null;
    elapsedTime = 0; distanceKm = 0;
    prevPos = null; pathCoords = [];

    document.getElementById("timer").textContent = "時間: 00:000";
    document.getElementById("distance").textContent = "里程: 0.00 km";
    document.getElementById("fare").textContent = "車資: 0 元";

    polyline.setPath([]);
    if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
}
</script>

<script async
src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMi3iCO0lZuw3XfaUoKxBrQJMGFbiz5po&callback=initMap">
</script>

</body>
</html>
