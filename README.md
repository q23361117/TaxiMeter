<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>計程車計費 + GPS 路線</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
<style>
body { font-family: Arial, sans-serif; text-align: center; margin:0; padding:0; }
input, button { font-size: 16px; margin:5px; padding:5px; }
#timer, #distance, #fare { font-size: 24px; margin:10px 0; }
#map { height: 50vh; width: 100%; margin-top: 10px; }
</style>
</head>
<body>

<h2>計程車計費器 + GPS 路線</h2>

<div>
名稱: <input type="text" id="taxiName" value="Taxi-001"><br>
基本費率: <input type="number" id="baseFare" value="85"> 元<br>
每公里費率: <input type="number" id="kmFare" value="5"> 元<br>
每分鐘費率: <input type="number" id="timeFare" value="5"> 元<br>
公里加成(超過15km/每公里): <input type="number" id="extraKmFare" value="10"> 元<br>
百回機制(百回=): <input type="number" id="hundredUnit" value="100"> 元, 每回 <input type="number" id="hundredFare" value="10"> 元<br>
固定回傭: <input type="number" id="fixedCommission" value="20"> 元
</div>

<div id="timer">時間: 00:000</div>
<div id="distance">里程: 0.00 km</div>
<div id="fare">車資: 0 元</div>

<button onclick="startTrip()">開始</button>
<button onclick="pauseTrip()">暫停</button>
<button onclick="resetTrip()">重置</button>

<div id="map"></div>

<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script>
let startTime=0, elapsedTime=0, timerInterval=null;
let watchId=null, prevPos=null, distanceKm=0, pathCoords=[];
let map, polyline;

// 初始化地圖
function initMap(){
    map = L.map('map').fitWorld();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    polyline = L.polyline([], { color:'red' }).addTo(map);
    map.setView([0,0],2);
}

// 格式化時間 mm:SSS
function formatTime(ms){
    const minutes=Math.floor(ms/60000);
    const milliseconds=ms%60000;
    return `${minutes}:${milliseconds.toString().padStart(3,'0')}`;
}

// 計算GPS距離
function getDistance(lat1,lon1,lat2,lon2){
    const R=6371000;
    const toRad=x=>x*Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R*c; // 公尺
}

// 計算車資
function calculateFare(){
    const baseFare = parseFloat(document.getElementById("baseFare").value);
    const kmFare = parseFloat(document.getElementById("kmFare").value);
    const timeFare = parseFloat(document.getElementById("timeFare").value);
    const extraKmFare = parseFloat(document.getElementById("extraKmFare").value);
    const hundredUnit = parseFloat(document.getElementById("hundredUnit").value);
    const hundredFare = parseFloat(document.getElementById("hundredFare").value);
    const fixedCommission = parseFloat(document.getElementById("fixedCommission").value);

    let fare = baseFare;

    fare += distanceKm * kmFare;

    if(distanceKm>15){
        fare += (distanceKm-15)*extraKmFare;
    }

    let waitMinutes=Math.floor(elapsedTime/60000);
    fare += waitMinutes*timeFare;

    let hundredTimes=Math.floor(fare/hundredUnit);
    fare += hundredTimes*hundredFare;

    fare += fixedCommission;

    return Math.round(fare);
}

// 開始行程
function startTrip(){
    if(!timerInterval){
        startTime=Date.now()-elapsedTime;
        timerInterval=setInterval(()=>{
            elapsedTime=Date.now()-startTime;
            document.getElementById("timer").textContent="時間: "+formatTime(elapsedTime);
            document.getElementById("fare").textContent="車資: "+calculateFare()+" 元";
        },10);
    }

    if(!watchId && navigator.geolocation){
        watchId=navigator.geolocation.watchPosition(pos=>{
            const lat=pos.coords.latitude;
            const lon=pos.coords.longitude;

            if(prevPos){
                distanceKm += getDistance(prevPos.lat, prevPos.lon, lat, lon)/1000;
                document.getElementById("distance").textContent="里程: "+distanceKm.toFixed(2)+" km";
            }
            prevPos={lat, lon};

            pathCoords.push([lat, lon]);
            polyline.setLatLngs(pathCoords);
            map.setView([lat, lon],18);
        },err=>{console.error(err); alert("GPS取得失敗");},{enableHighAccuracy:true,maximumAge:0,timeout:5000});
    }
}

// 暫停行程
function pauseTrip(){
    clearInterval(timerInterval); timerInterval=null;
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
}

// 重置行程
function resetTrip(){
    clearInterval(timerInterval); timerInterval=null;
    elapsedTime=0; distanceKm=0; prevPos=null; pathCoords=[];
    document.getElementById("timer").textContent="時間: 00:000";
    document.getElementById("distance").textContent="里程: 0.00 km";
    document.getElementById("fare").textContent="車資: 0 元";
    polyline.setLatLngs([]);
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
}

window.onload=initMap;
</script>
</body>
</html>
