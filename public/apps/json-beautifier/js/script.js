renderjson.set_show_to_level("all")

function renderJSONOnDiv(jsonObj, divID) {
  var elem = document.getElementById(divID);
  elem.innerHTML = "";
  elem.appendChild(
    renderjson(jsonObj)
  );
}

document.getElementById("beautify-button").addEventListener("click", () =>{
  var jsonStr = document.getElementById("raw-json").value
  try {
    jsonObj = JSON.parse(jsonStr)
    console.log(jsonObj)
    renderJSONOnDiv(jsonObj, "rendered-json");
    document.getElementById("raw-beautiful-json-str").innerText = "\n" + JSON.stringify(jsonObj, null, 2)
  } catch (err) {
    document.getElementById("rendered-json").innerHTML = '<p style="color=red">ERROR PARSING JSON</p>'
    document.getElementById("raw-beautiful-json-str").innerText = ""
  }
})

document.getElementById("low-btn-left").addEventListener("click", () =>{
  document.getElementById("raw-json").value = "";
  document.getElementById("rendered-json").innerHTML = ""
  document.getElementById("raw-beautiful-json-str").innerText = ""
})
