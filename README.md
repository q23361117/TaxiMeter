<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Taipei Meter - 網頁跳錶</title>
<style>
body { font-family: Arial; margin:0; padding:0; background:#121212; color:#fff; }
.card { background:#1f1f1f; padding:15px; margin:10px; border-radius:10px; }
button { padding:10px; margin:5px; border:none; border-radius:8px; cursor:pointer; color:#fff; }
button.start { background:#2196F3; }
button.pause { background:#FFA726; }
button.end { background:#F44336; }
button.reset { background:#9E9E9E; }
#map { height:400px; margin:10px; border-radius:10px; }
.result { margin:5px 0; font-size:16px; }
.result .fare { color:#ff9800; font-weight:bold; font-size:18px; }
</style>
</head>
<body>

<div class="card">
<h3>🚖 Taipei Meter </h3>
<div class="result" id="timeRange">乘車時間：--</div>
<div class="result">起步價：<span id="baseFare">60</span> 元</div>
<div class="result">每公里費用：<span id="kmFare">15</span> 元/km</div>
<div class="result">距離：<span id="distance">0.00</span> km</div>
<div class="result">時間：<span id="elapsedTime">0分 0秒</span></div>
<div class="result fare">客收：<span id="totalFare">0</span> 元</div>
<div class="result">距離費用：<span id="distFare">0</span> 元</div>
<div class="result">時間費用：<span id="timeCost">0</span> 元</div>
<div class="result">起步價：<span id="startFare">60</span> 元</div>
</div>

<div id="map"></div>

<div class="card">
<button class="start" onclick="startTrip()">開始跳錶</button>
<button class="pause" onclick="pauseTrip()">暫停</button>
<button class="end" onclick="endTrip()">結束</button>
<button class="reset" onclick="resetTrip()">重置</button>
</div>

<script>
let map, pathPolyline;
let startMarker = null; // 藍點起跳
let endMarker = null;   // 紅點終點
let watchId = null;
let pathCoords = [];
let distanceKm = 0;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

const baseFare = 60;
const kmFare = 15;
const timeFare = 3; // 每分鐘費用

function initMap(){
    map = new google.maps.Map(document.getElementById("map"),{
        zoom: 12,
        center: {lat:24.15, lng:120.68},
        mapTypeId: 'roadmap'
    });

    pathPolyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic:true,
        strokeColor:"#FF0000",
        strokeWeight:4,
        zIndex:1  // 線在下層
    });
    pathPolyline.setMap(map);
}

function formatTime(ms){
    const min = Math.floor(ms/60000);
    const sec = Math.floor((ms%60000)/1000);
    return `${min}分 ${sec}秒`;
}

function getDistanceKm(lat1, lon1, lat2, lon2){
    const R=6371;
    const dLat=(lat2-lat1)*Math.PI/180;
    const dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return R*c;
}

function calculateFare(){
    const min = Math.floor(elapsedTime/60000);
    const distCost = distanceKm*kmFare;
    const timeCost = min*timeFare;
    const total = Math.round(baseFare + distCost + timeCost);
    document.getElementById("distFare").textContent = Math.round(distCost);
    document.getElementById("timeCost").textContent = Math.round(timeCost);
    document.getElementById("startFare").textContent = baseFare;
    return total;
}

function updateDisplay(){
    document.getElementById("distance").textContent = distanceKm.toFixed(2);
    document.getElementById("elapsedTime").textContent = formatTime(elapsedTime);
    document.getElementById("totalFare").textContent = calculateFare();
}

// 建立起點 Marker（藍色）
function addStartMarker(position){
    if(startMarker) startMarker.setMap(null);
    startMarker = new google.maps.Marker({
        position: position,
        map: map,
        icon:  blueIcon,
        zIndex: 99999,
        title: "起跳點",
        
    });
}

// 建立終點 Marker（紅色）
function addEndMarker(position){
    if(endMarker) endMarker.setMap(null);
    endMarker = new google.maps.Marker({
        position: position,
        map: map,
        icon: redIcon,
        zIndex: 99999,
        title: "終點",
        
    });
}

function startTrip(){
    if(!timerInterval){
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(()=>{
            elapsedTime = Date.now() - startTime;
            updateDisplay();
        },1000);
    }
    if(navigator.geolocation){
        watchId = navigator.geolocation.watchPosition(pos=>{
            const newCoord = {lat: pos.coords.latitude, lng: pos.coords.longitude};

            // 起跳藍點
            if(!startMarker){
                addStartMarker(newCoord);
            }

            if(pathCoords.length>0){
                const last = pathCoords[pathCoords.length-1];
                distanceKm += getDistanceKm(last.lat,last.lng,newCoord.lat,newCoord.lng);
            }

            pathCoords.push(newCoord);
            pathPolyline.setPath(pathCoords);
            map.setCenter(newCoord);
        }, err=>{alert("GPS定位失敗")},{enableHighAccuracy:true});
    }
}

function pauseTrip(){
    clearInterval(timerInterval);
    timerInterval = null;
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
}

function endTrip(){
    pauseTrip();
    if(pathCoords.length>0){
        const last = pathCoords[pathCoords.length-1];
        addEndMarker(last); // 終點紅點
    }
    alert(`行程結束！\n總距離: ${distanceKm.toFixed(2)} km\n總費用: ${calculateFare()} 元`);
}

function resetTrip(){
    pauseTrip();
    pathCoords=[]; distanceKm=0; elapsedTime=0;
    if(startMarker){startMarker.setMap(null); startMarker=null;}
    if(endMarker){endMarker.setMap(null); endMarker=null;}
    pathPolyline.setPath([]);
    updateDisplay();
}
</script>

<script async src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMi3iCO0lZuw3XfaUoKxBrQJMGFbiz5po&callback=initMap"></script>
</body>
</html>
