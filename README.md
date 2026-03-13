<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>維尼中彰投大台中車隊｜自訂跳錶</title>

<style>
body{font-family: Arial;background:#f5f5f5;margin:0;padding:15px;text-align:center;}
.card{background:white;padding:20px;border-radius:15px;max-width:420px;margin:auto;box-shadow:0 3px 10px rgba(0,0,0,0.1);}
input{width:95%;padding:12px;margin:6px 0;font-size:16px;border-radius:8px;border:1px solid #ccc;}
button{width:100%;padding:14px;margin-top:8px;font-size:16px;border:none;border-radius:10px;background:#ff9800;color:white;cursor:pointer;}
#map{width:100%;height:380px;margin-top:15px;border-radius:10px;}
.result{font-size:16px;margin-top:10px;font-weight:bold;color:#e65100;text-align:left;}
</style>
</head>
<body>

<div class="card">
<h3>🚖 維尼中彰投大台中車隊｜自訂跳錶</h3>

<input id="taxiName" placeholder="車隊名稱" value="Taxi-001">
<input id="baseFare" type="number" placeholder="基本費率" value="85">
<input id="kmFare" type="number" placeholder="公里費率" value="15">
<input id="timeFare" type="number" placeholder="時間費率(每分鐘)" value="3">
<input id="extraKmFare" type="number" placeholder="超15公里每公里加成" value="10">
<input id="hundredUnit" type="number" placeholder="百回(多少元為1單位)" value="100">
<input id="hundredFare" type="number" placeholder="百回加值" value="10">
<input id="fixedCommission" type="number" placeholder="固定回傭" value="20">

<button onclick="startTrip()">開始跳錶</button>
<button onclick="pauseTrip()">暫停</button>
<button onclick="endTrip()">結束行程</button>
<button onclick="resetTrip()">重置</button>

<div id="map"></div>

<div class="result" id="timer">時間: 00:000</div>
<div class="result" id="distance">里程: 0.00 km</div>
<div class="result" id="fare">車資: 0 元</div>
</div>

<script>
let map;
let startMarker=null,endMarker=null;
let polylinePath;
let pathCoords=[];
let watchId=null;
let startTime=0,elapsedTime=0,timerInterval=null;
let prevPos=null,distanceKm=0;

function initMap(){
    map=new google.maps.Map(document.getElementById("map"),{
        zoom:16,
        center:{lat:24.1477,lng:120.6736},
        disableDefaultUI:true,
        scaleControl:true
    });

    polylinePath = new google.maps.Polyline({
        path:pathCoords,
        geodesic:true,
        strokeColor:"#FF0000",
        strokeWeight:4
    });
    polylinePath.setMap(map);
}

function formatTime(ms){
    const min=Math.floor(ms/60000);
    const msRem=ms%60000;
    return `${min}:${msRem.toString().padStart(3,'0')}`;
}

function getDistanceKm(lat1,lon1,lat2,lon2){
    const R = 6371000;
    const toRad = x => x*Math.PI/180;
    const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
    const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
    return (R*c)/1000;
}

function calculateFare(){
    const baseFare=parseFloat(document.getElementById("baseFare").value);
    const kmFare=parseFloat(document.getElementById("kmFare").value);
    const timeFare=parseFloat(document.getElementById("timeFare").value);
    const extraKmFare=parseFloat(document.getElementById("extraKmFare").value);
    const hundredUnit=parseFloat(document.getElementById("hundredUnit").value);
    const hundredFare=parseFloat(document.getElementById("hundredFare").value);
    const fixedCommission=parseFloat(document.getElementById("fixedCommission").value);

    let fare = baseFare;
    fare += distanceKm*kmFare;
    let waitMin=Math.floor(elapsedTime/60000);
    fare += waitMin*timeFare;

    if(distanceKm>15) fare += (distanceKm-15)*extraKmFare;

    let hundredTimes=Math.floor(fare/hundredUnit);
    fare += hundredTimes*hundredFare;

    fare += fixedCommission;

    return Math.round(fare);
}

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

            if(!startMarker){
                startMarker=new google.maps.Marker({
                    position:{lat:lat,lng:lon},
                    map:map,
                    icon:"https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    zIndex:9999
                });
            }

            const currentLatLng=new google.maps.LatLng(lat,lon);

            if(prevPos){
                distanceKm+=getDistanceKm(prevPos.lat(),prevPos.lng(),lat,lon);
                document.getElementById("distance").textContent="里程: "+distanceKm.toFixed(2)+" km";
            }
            prevPos=currentLatLng;

            pathCoords.push(currentLatLng);
            polylinePath.setPath(pathCoords);
            map.setCenter(currentLatLng);
        },err=>{alert("無法取得GPS定位")},{enableHighAccuracy:true,maximumAge:0,timeout:5000});
    }
}

function pauseTrip(){
    clearInterval(timerInterval); timerInterval=null;
    if(watchId){navigator.geolocation.clearWatch(watchId); watchId=null;}
}

function endTrip(){
    pauseTrip();
    if(prevPos && !endMarker){
        endMarker=new google.maps.Marker({
            position:prevPos,
            map:map,
            icon:"https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            zIndex:9999
        });
    }
    alert("行程結束！\n總里程: "+distanceKm.toFixed(2)+" km\n總車資: "+calculateFare()+" 元");
}

function resetTrip(){
    pauseTrip();
    elapsedTime=0; distanceKm=0; prevPos=null; pathCoords=[];
    document.getElementById("timer").textContent="時間: 00:000";
    document.getElementById("distance").textContent="里程: 0.00 km";
    document.getElementById("fare").textContent="車資: 0 元";
    if(startMarker) startMarker.setMap(null); startMarker=null;
    if(endMarker) endMarker.setMap(null); endMarker=null;
    polylinePath.setPath([]);
}
</script>

<script async
src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMi3iCO0lZuw3XfaUoKxBrQJMGFbiz5po&callback=initMap">
</script>

</body>
</html>
</html>
