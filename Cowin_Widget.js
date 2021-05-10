// NOTE: change this to 45 if you need to look up for 45+
const min_age_limit = 18


let city = undefined




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


// modify these to change zipcodes of interest
// keep the city keys in lowercase
let config_data = {
   "ambala" : {  
     "pincodes" : [134003, 134007, 133001]
   }, 
   "bangalore" : {
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

const cap = "capacity"




/* parses the response from cowin and maps out data as 
 {
   "<date>" : {
      "capacity" : <number>, // total available capacity accross the city
    }
}
  
*/
function parse_response(answer, response) {  

  response.centers.forEach(function(center){
    center.sessions.forEach(function(session){
      if (session.min_age_limit == min_age_limit) {
        let date =session.date
        console.log(date + " " + session.available_capacity)
        if (date in answer) {
          answer[date][cap] = answer[date][cap] + session.available_capacity
        } else {
          answer[date] = {}
          answer[date][cap] = session.available_capacity
//          answer[date]["center"] = center.name
        }
    }
    })
    
  })  
  return answer
}


let widget = new ListWidget()


let city_data = config_data[city.toLowerCase()]

// async fetch of slots from cowin 
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
let notifyBody = ""



// creates the presentation widget
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
    st.addText(answer[key][cap].toString())
    // if the capacity is greater than 0 highlight the row and create a notification
    if(answer[key][cap] > 0) {
     st.backgroundColor = colorAvailable
     notifyBody += answer[key][cap] + " slots available on " + key
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


// if we have something to notify, create and schedule a notificaiton 
if (notifyBody.length > 0) {  
  let notify= new Notification()
  notify.title = "Cowin slots"
  notifyBody += "\n\nAs of " + df2.string(now)
  notify.body = notifyBody
  notify.openUrl = "https://www.cowin.gov.in/home"
  notify.schedule()

}

if(config.runsInApp) {    
  widget.presentMedium()
  Script.complete()
} else {      
  Script.setWidget(widget)
}
