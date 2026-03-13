function calculateSpeed(distance,time){

return distance/time*3600

}

function filterGPS(distance){

if(distance>0.5){

return false

}

return true

}
