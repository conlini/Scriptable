let city = undefined
console.log("getting city")
if(config.runsInWidget) {    
  // if run in widget, get city option from widget
  city = args.widgetParameter
} else {  
    // change options to adjust the city of interest
    // note that the lower case values of the city variable ties directly to the 
    // widget input
    let choiceAl = new Alert()
    choiceAl.addAction("Ambala")
    choiceAl.addAction("Bangalore")
    let choice = await choiceAl.presentAlert()
    if (choice == 0) {
      city = "ambala"
    } else {
      city = "bangalore"
    }
}


// modify these to change zipcodes/districtIds of interest
// keep the city keys in lowercase
let config_data = {
   "ambala" : {  
     "district_ids" : [193],
     "pincodes" : [134003, 134007]
   }, 
   "bangalore" : {
     "district_ids" : [294,265],
     "pincodes" :[560043]
  }
}


// configure look up of today 
let today = new Date()
let df = new DateFormatter()
df.dateFormat = "dd-MM-yyyy"
let dateStr = df.string(today)

// base prod url for cowin data as per https://apisetu.gov.in/public/api/cowin
let baseUrl = "https://cdn-api.co-vin.in/api/"

let pin_url = baseUrl + "v2/appointment/sessions/public/calendarByPin?date="+dateStr+"&pincode="


let dist_url = baseUrl + "v2/appointment/sessions/public/calendarByDistrict?date="+dateStr+"&district_id="


function parse_response(answer, response) {  

  response.centers.forEach(function(center){
    center.sessions.forEach(function(session){
      if (session.min_age_limit == 18) {
        let date =session.date
        console.log(date + " " + session.available_capacity)
        if (date in answer) {
          answer[date] = answer[date] + session.available_capacity
        } else {
          answer[date] = session.available_capacity
        }
    }
    })
    
  })  
  return answer
}


let widget = new ListWidget()


let city_data = config_data[city.toLowerCase()]

async function fetch() {  
  let promises = []  
  if ("pincodes" in city_data) {  
    city_data["pincodes"].forEach(async function(id){  
  //     try {  
         console.log("Fetching for id " + id)
         let url = pin_url+id
         let req = new Request(url)  
         let resPromise = req.loadJSON()  
         promises.push(resPromise)
    })
  }

  return Promise.all(promises)
}


let values = await fetch()
let answer = {}
values.forEach((v) => {
  answer= parse_response(answer,v)

})

console.log(answer)

var colorAvailable =  new Color("#ccffcc")

if (Object.keys(answer).length == 0 ) {  
  widget.addText("No data available for " + city.toUpperCase()).textColor = Color.red()
  
} else {    
  let textStack =   widget.addStack()
  textStack.useDefaultPadding()
  textStack.centerAlignContent()
  let header = textStack.addText(city.toUpperCase())
  header.textColor=Color.blue()
  header.font= Font.headline()
  textStack.topAlignContent()
  widget.addSpacer(undefined)
  Object.keys(answer).forEach(function(key) {
    let st = widget.addStack()
    st.layoutHorizontally()
    st.useDefaultPadding()
    st.addText(key)
    st.addSpacer(undefined)
    st.addText(answer[key].toString())
    if(answer[key] > 0) {
     st.backgroundColor = colorAvailable
    }
  })    
  
}

widget.addSpacer(undefined)
  
let now = new Date()
let df2 = new DateFormatter()
df2.dateFormat = "dd/MM/yy HH:mm"
let footer = widget.addText("Last Updated  " + df2.string(now) )
footer.font = Font.footnote()      
footer.textColor = Color.yellow()




if(config.runsInApp) {    
  widget.presentMedium()
  Script.complete()
} else {      
  Script.setWidget(widget)
}
