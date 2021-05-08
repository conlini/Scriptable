/*
 renders a table showing vaccine slots results for a single day.

*/
function showTable(data) {      
    console.log(data)
  let table = new UITable()
  table.showSeparators = true
  
  let headerRow = new UITableRow()
  headerRow.isHeader = true
  headerRow.addText("Name").widthWeight = 40
  headerRow.addText("Vaccine").widthWeight = 40
  headerRow.addText("Min Age").widthWeight = 20
  headerRow.addText("Capacity").widthWeight= 20
//  headerRow.addText("Fee Type").widthWeight= 20
//  headerRow.addText("Slots").widthWeight = 20
//  headerRow.addText("Show More").widthWeight = 15
  
  table.addRow(headerRow)
  
  if(data) {
  data.forEach(function(item) {
    let row = new UITableRow()
    row.addText(item.name).widthWeight = 40
    row.addText(item.vaccine).widthWeight = 40
    row.addText(item.min_age_limit.toString()).widthWeight = 20
    row.addText(item.available_capacity.toString()).widthWeight = 20    
    //row.addText(item.fee_type).widthWeight = 20
    let slotsButton = UITableCell.button("slots")
//    row.addCell(slotsButton)
    slotsButton.centerAligned()
    slotsButton.widthWeight = 20
    slotsButton.onTap = function() {
      let slotsTable = new UITable()
      let slotHead = new UITableRow()
      slotHead.isHeader = true
      slotHead.addText("Slots") 
      slotsTable.addRow(slotHead)
      item.slots.forEach(function(slot) {
        let r = new UITableRow()
        r.addText(slot)
        slotsTable.addRow(r)
      })  
      slotsTable.present(false)
    }
    
    if (item.min_age_limit == 18 && item.available_capacity > 0) {
          row.backgroundColor = new Color("#e6e6ff")
        }
    table.addRow(row)
  
  })
}
  

  table.present(true)
}


/* 
utility function to build a map and headers rows for all days present in a week long search result. This helps us padd for centres where data is missing on some days 
*/
function buildDateMap(data, headerRow) {      
  let dateMap = {}  	
  let index = 0
  data.forEach(function(center){    
    center.sessions.forEach(function(session){    
      if (!(session.date in dateMap)) {
        dateMap[session.date] = index++
        headerRow.addText(session.date).widthWeight = 15 
      }
    })
    
  })
  
  console.log(dateMap)
  return dateMap
}

/*

 renders the result for week long data lookup. 
*/
function showWeekSchedule(data)  {

  let table = new UITable()
  table.showSeparators = true
  
  let headerRow = new UITableRow()
  headerRow.isHeader = true
  headerRow.addText("Name").widthWeight=40
  table.addRow(headerRow)
  
  let dateMap = buildDateMap(data, headerRow)
  let totalKeys = Object.keys(dateMap).length
  
  data.forEach(function (center){
      let row = new UITableRow()
      row.addText(center.name+"("+center.pincode+")").widthWeight=40
      table.addRow(row)  
      let currIndex = 0
      center.sessions.forEach(function(session) {
        let date = session.date      
        let dateIndex = dateMap[date]
//        console.log("currIndex = " + currIndex + " dateIndex = " + dateIndex)
        if (currIndex != dateIndex) {
          for(let i = currIndex; i < dateIndex; i++) {
            let cell = row.addText("NA")
            cell.titleColor = Color.brown()
            cell.widthWeight = 15
            currIndex++
          }
        }
        let cell = row.addText(session.available_capacity.toString() , " (" + session.min_age_limit + "+)")
        cell.titleColor = Color.green()
        cell.subtitleColor = Color.blue()
        cell.widthWeight = 15
        currIndex++
        
        if (session.min_age_limit == 18 && session.available_capacity > 0) {
          row.backgroundColor = new Color("#e6e6ff")
        }
      })  
      
      console.log("currIndex = " + currIndex + " to fill = " + totalKeys)
      if (currIndex < totalKeys) {
        for(let i = currIndex; i < totalKeys; i++ ) {
            let cell = row.addText("NA")
            cell.titleColor = Color.brown()
            cell.widthWeight = 15
            currIndex++
        }
      }
      }) 
  
  table.present(true)
    
}


// base prod url for cowin data as per https://apisetu.gov.in/public/api/cowin
let baseUrl = "https://cdn-api.co-vin.in/api/"


// utility function to present a date picker
async function chooseDate() {
  let dp = new DatePicker() 
  dp.initialDate = new Date()
  let date = await dp.pickDate()
  let df = new DateFormatter()
  df.dateFormat = "dd-MM-yyyy"
  let dateStr = df.string(date)
  
  return dateStr
}


// async function that looks up by a specific pin code
// this function takes in the dateSearchMode argument to look up data for a specific date or week long data
async function loadByPin(dateSearchMode) {    

  let zip = new Alert()
  zip.addTextField("Input zipcode")    
  zip.addAction("OK")
  let ans = await zip.presentAlert()
  let zipcode = zip.textFieldValue(0)
  let dateStr = undefined
  let url = undefined
  dateStr = await chooseDate()   
  if(dateSearchMode == 0) {
  
    url = baseUrl + "v2/appointment/sessions/public/findByPin?pincode="+zipcode+"&date="+dateStr

  } else {
    url = baseUrl + "v2/appointment/sessions/public/calendarByPin?pincode="+zipcode+"&date="+dateStr

  }
  
  let request = new Request(url)  
 
  let response = await request.loadJSON()

  return {"statusCode" : request.response.statusCode, "response" : response}
}


/*
async function to load data by state/district
this function presents the user with list of states(fetched via API) and then 
districts for the state

this function takes in the dateSearchMode argument to look up data for a specific date or week long data

*/
async function loadByStateDistrict(dateSearchMode) {    
  console.log("looking up by state/district")
  let stateRequest = new Request(baseUrl + "v2/admin/location/states")
  let response = await stateRequest.loadJSON()
  if(stateRequest.response.statusCode == 200) {
    let stateTable = new UITable()
    stateTable.dismissOnSelect = true 
    let head = new UITableRow()
    head.addText("State")
    head.isHeader=true
    stateTable.addRow(head)
    
    let chosenState = undefined
    
    
    response.states.forEach(function(state) {
      let row = new UITableRow()
      row.addText(state.state_name)
      row.onSelect = (number) => {    
        chosenState = state
      }
      stateTable.addRow(row)
    })  
    
    
    await stateTable.present(false)  
        
    let disReq = new Request(baseUrl + "v2/admin/location/districts/"+ chosenState.state_id.toString())    
  console.log(disReq.url)
    let disResponse = await disReq.loadJSON()
    if(disReq.response.statusCode == 200 ) {
      let disTable = new UITable()
      disTable.dismissOnSelect = true;
      let disHead = new UITableRow()
      disHead.isHeader = true
      disHead.addText("Districts of " + chosenState.state_name)
      disTable.addRow(disHead)  
      
      let chosenDist = undefined
      disResponse.districts.forEach(function(district){
         let row = new UITableRow()
        row.addText(district.district_name)
        row.onSelect = (number) => {
          chosenDist = district  
        }
        disTable.addRow(row)
      })
      await disTable.present(false)
      let dateStr = undefined
  let url = undefined
  dateStr = await chooseDate()   
  if(dateSearchMode == 0) {
  
    url = baseUrl + "v2/appointment/sessions/public/findByDistrict?district_id="+chosenDist.district_id+"&date="+dateStr

  } else {
    url = baseUrl + "v2/appointment/sessions/public/calendarByDistrict?district_id="+chosenDist.district_id+"&date="+dateStr

  }
  
      let request = new Request(url)  
  console.log(request.url)

  let response = await request.loadJSON()
  return {"statusCode" : request.response.statusCode, "response" : response}
    } else {
      console.log("Failed to get districts")
      console.log(disReq.response)
       return {"statusCode" : disReq.response.statusCode}
    }

  } else {
    return {"statusCode" : stateRequest.response.statusCode}
  }
  
}


// alert to ask for date search mode
let dateSearchAl = new Alert()
dateSearchAl.title = "Search specific date or week Scan?"
dateSearchAl.addAction("Look up specific date")
dateSearchAl.addAction("Look up week long data")

let dateSearchMode = await dateSearchAl.presentAlert()

//dateSearchMode = 1
// alert to ask for mode of search
let choiceAl = new Alert();
choiceAl.title = "Choose search method" 
choiceAl.addAction("Search by zipcode")
choiceAl.addAction("Search by State/District")



let choice = await choiceAl.presentAlert()



let result = undefined
switch (choice) {
 case 0: 
    result = await loadByPin(dateSearchMode)
    break
 case 1:    
     result = await loadByStateDistrict(dateSearchMode)
     break    
}

// if result is 200 for the api response, render based on the date search mode 
if(result.statusCode == 200) {

  if (dateSearchMode == 0) {  
    showTable(result.response.sessions)  
  } else {
    showWeekSchedule(result.response.centers)
  }
} else {
  let fail= new Alert()
  fail.title = "failed to fetch data"
  await fail.presentAlert()
}
Script.complete()
//showTable(null)/////
