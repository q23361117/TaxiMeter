let config = {

baseFare:60,
kmFare:15,
timeFare:3,
waitSpeed:5

}

function updateConfig(){

config.baseFare=parseFloat(
document.getElementById("baseFare").value)

config.kmFare=parseFloat(
document.getElementById("kmFare").value)

config.timeFare=parseFloat(
document.getElementById("timeFare").value)

config.waitSpeed=parseFloat(
document.getElementById("waitSpeed").value)

}
