<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>計程車 GPS + 路線跳錶</title>
<style>
body { font-family: Arial, sans-serif; margin:0; padding:0; text-align:center; }
#map { height:50vh; width:100%; }
#controls { padding:10px; }
input, button { font-size:16px; padding:5px; margin:5px; }
#timer,#distance,#fare { font-size:22px; margin:6px 0; }
</style>
</head>
<body>

<h2>計程車 GPS + 路線跳錶</h2>

<div id="map"></div>

<div id="controls">
名稱: <input type="text" id="taxiName" value="Taxi-001"><br>
基本費率: <input type="number" id="baseFare" value="85"> 元<br>
每公里費率: <input type="number" id="kmFare" value="5"> 元<br>
每分鐘費率: <input type="number" id="timeFare" value="5"> 元<br>
超15公里加成: <input type="number" id="extraKmFare" value="10"> 元<br>
百回(100元/回10元): <input type="number" id="hundredUnit" value="100"> , <input type="number" id="hundredFare" value="10"> 元<br>
固定回傭: <input type="number" id="fixedCommission" value="20"> 元
</div>

<div id="timer">時間: 00:000</div>
<div id="distance">里程: 0.00 km</div>
<div id="fare">車資: 0 元</div>

<button onclick="startTrip()">開始</button>
<button onclick="pauseTrip()">暫停</button>
<button onclick="endTrip()">結束行程</button>
<button onclick="resetTrip()">重置</button>

<script>
let map, startMarker=null, endMarker=null;
let watchId=null, pathCoords=[], polylinePath;
let startTime=0, elapsedTime=0, timerInterval=null;
let prevPos=null, distanceKm=0;

// Directions
let directionsService=null, directionsRenderer=null;
let startLatLng=null, endLatLng=null;

// 初始化地圖
function initMap(){
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 25.033, lng: 121.565 },
        zoom: 16,
        disableDefaultUI: true,
        scaleControl: true,
        scaleControlOptions: { unitSystem: google.maps.UnitSystem.METRIC }
    });

    polylinePath = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeWeight: 4
    });
    polylinePath.setMap(map);

    // 初始化 Directions
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        draggable: true,
        polylineOptions: { strokeColor: "#4285F4", strokeWeight: 5, zIndex: 1 }
    });
}

// 格式化時間
function formatTime(ms){
    const min=Math.floor(ms/60000);
    const msRem=ms%60000;
    return `${min}:${msRem.toString().padStart(3,'0')}`;
}

// 計算距離 (公里)
function getDistanceKm(lat1, lon1, lat2, lon2){
    const R = 6371000;
    const toRad = x => x*Math.PI/180;
    const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R*c)/1000;
}

// 計算車資
function calculateFare(){
    const baseFare=parseFloat(document.getElementById("baseFare").value);
    const kmFare=parseFloat(document.getElementById("kmFare").value);
    const timeFare=parseFloat(document.getElementById("timeFare").value);
    const extraKmFare=parseFloat(document.getElementById("extraKmFare").value);
    const hundredUnit=parseFloat(document.getElementById("hundredUnit").value);
    const hundredFare=parseFloat(document.getElementById("hundredFare").value);
    const fixedCommission=parseFloat(document.getElementById("fixedCommission").value);

    let fare = baseFare;
    fare += distanceKm * kmFare;
    if(distanceKm > 15) fare += (distanceKm-15) * extraKmFare;

    let waitMin = Math.floor(elapsedTime/60000);
    fare += waitMin * timeFare;

    let hundredTimes = Math.floor(fare / hundredUnit);
    fare += hundredTimes * hundredFare;

    fare += fixedCommission;
    return Math.round(fare);
}

// 計算 Directions 路線
function updateRoute(){
    if(!startLatLng || !endLatLng) return;
    directionsService.route({
        origin: startLatLng,
        destination: endLatLng,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status){
        if(status === "OK"){
            directionsRenderer.setDirections(response);
            const leg = response.routes[0].legs[0];

            // 起終點 Marker
            if(!startMarker){
                startMarker = new google.maps.Marker({
                    position: leg.start_location,
                    map: map,
                    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    zIndex: 9999
                });
            }
            if(!endMarker){
                endMarker = new google.maps.Marker({
                    position: leg.end_location,
                    map: map,
                    icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    zIndex: 9999
                });
            }
        }
    });
}

// 開始行程
function startTrip(){
    if(!timerInterval){
        startTime = Date.now()-elapsedTime;
        timerInterval = setInterval(()=>{
            elapsedTime = Date.now()-startTime;
            document.getElementById("timer").textContent="時間: "+formatTime(elapsedTime);
            document.getElementById("fare").textContent="車資: "+calculateFare()+" 元";
        },10);
    }

    if(!watchId && navigator.geolocation){
        watchId = navigator.geolocation.watchPosition(
            pos=>{
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                if(!startLatLng) startLatLng = new google.maps.LatLng(lat, lon);
                endLatLng = new google.maps.LatLng(lat, lon); // 終點即時更新

                // 更新建議路線和 Marker
                updateRoute();

                // 累計距離
                if(prevPos){
                    distanceKm += getDistanceKm(prevPos.lat(), prevPos.lng(), lat, lon);
                    document.getElementById("distance").textContent="里程: "+distanceKm.toFixed(2)+" km";
                }
                prevPos = new google.maps.LatLng(lat, lon);

                // 即時行駛軌跡紅線
                pathCoords.push(prevPos);
                polylinePath.setPath(pathCoords);
                map.setCenter(prevPos);
            },
            err=>{console.error(err); alert("GPS 無法取得定位");},
            {enableHighAccuracy:true, maximumAge:0, timeout:5000}
        );
    }
}

// 暫停
function pauseTrip(){
    clearInterval(timerInterval); timerInterval=null;
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
}

// 結束行程
function endTrip(){
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
    clearInterval(timerInterval); timerInterval=null;

    alert("行程結束！\n總里程: "+distanceKm.toFixed(2)+" km\n總車資: "+calculateFare()+" 元");
}

// 重置
function resetTrip(){
    clearInterval(timerInterval); timerInterval=null;
    elapsedTime=0; distanceKm=0; prevPos=null; pathCoords=[];
    startLatLng=null; endLatLng=null;
    document.getElementById("timer").textContent="時間: 00:000";
    document.getElementById("distance").textContent="里程: 0.00 km";
    document.getElementById("fare").textContent="車資: 0 元";
    polylinePath.setPath([]);
    if(startMarker) startMarker.setMap(null); startMarker=null;
    if(endMarker) endMarker.setMap(null); endMarker=null;
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
    directionsRenderer.setDirections({routes: []}); // 清除路線
}
</script>

<script async
src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMi3iCO0lZuw3XfaUoKxBrQJMGFbiz5po&callback=initMap">
</script>

</body>
</html>
