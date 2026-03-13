function takeScreenshot(){

html2canvas(document.body).then(canvas=>{

let link=document.createElement("a")

link.download="meter.png"

link.href=canvas.toDataURL()

link.click()

})

}
