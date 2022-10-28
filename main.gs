//Todo Change Google Maps Key
const GOOGLE_MAPS_KEY_="API_KEY";
const FIREBASE_DB_SECRET_ = "API_KEY";
const CONTACTS_LIMITS=[1000,100000,10000000];
const DETAILS_LIMITS=[100,10000,1000000];

const firebaseConfig_ = {"API_KEYS":"API_KEYS"};

const database = FirebaseApp.getDatabaseByUrl(firebaseConfig_.databaseURL, FIREBASE_DB_SECRET_);
/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

//Show messages on the bar
function toaster(message){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // let sheet = ss.getActiveSheet();
  ss.toast(message);
}

function registerUser_() {
  var idToken = ScriptApp.getIdentityToken();
  var token = FirebaseApp.signInWithIdp(firebaseConfig_, idToken ).idToken;
};

//call firebase with Auth
function getSites(token) {
var responseCode = 200;
  var cursor = "";
  var data = []
  while (responseCode == 200) {
    var response = UrlFetchApp.fetch(
      'https://www.example.com/_ah/api/fetch_sites',
      {
        'method' : 'post',
        'contentType':'application/json',
        'headers': {
          'Authorization': 'Bearer ' + token,
        },
        'payload': JSON.stringify({
          "cursor": cursor
      })
    });
    responseCode= response.getResponseCode();
    if (responseCode==200) {
      var payload = JSON.parse(response.getContentText());
      data = data.concat(payload.sites);
      cursor = payload.cursor;
    }
  }
  return data;
}

/*function onOpen(e) {
  SpreadsheetApp.getUi().createAddonMenu()
      .addItem('🚀 Open Sidebar', 'showSidebar')
      .addToUi();
}*/

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
/*function onInstall(e) {
  onOpen(e);
}*/

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function Install() {
  registerUser_();
  initUser_();
  /*const ui = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Maps Hound');
  SpreadsheetApp.getUi().showSidebar(ui);*/
}

function getPlaces(mapsTextQuery, callToConsume){
  const activeUser= retrieveActiveUser();
  //check if the user have enough call to retrieve the result
  if(callToConsume>activeUser.contactsQuota){
    return {result:"KO", error:"You cannot ask for "+callToConsume+" places. You have "+activeUser.contactsQuota+" left."};
  }
  let data;
  let result=[];
  let queryUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + encodeURIComponent(mapsTextQuery) + "&key="+GOOGLE_MAPS_KEY_;
  let remainingCallToConsume=callToConsume;
  try {
    do{
      const urlToFetch=!data?queryUrl:(queryUrl+"&next_page_token="+data.next_pagetoken);
      data = JSON.parse(UrlFetchApp.fetch(urlToFetch).getContentText());
      result=[...result,...data.results];
      remainingCallToConsume-=data.results.length;
    }while(data.next_page_token && remainingCallToConsume>0);
  } catch (error) {
    Logger.log(error);
    return "Error while fetching";
  }
  //remove the minimum from the total consumed queries
  consumeCallFromUser_(result.length<callToConsume?result.length:callToConsume);
  return result.slice(0,callToConsume);
}

function insertResultInSheet(jsonList, sheetName){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  let newSheet = ss.insertSheet();
  newSheet.setName(sheetName);

  newSheet.appendRow(['PLACE ID (Please do NOT remove this column, it\'s very important, it\'s used by Google to identify a place)','SELECTED','NAME', 'STATUS', 'ADDRESS', 'TAGS', 'RATING']);

  /*SpreadsheetApp.getActive()
    .getRange('A2')
    .insertCheckboxes();*/
  for(let i=0; i<jsonList.length; i++){
    newSheet.appendRow([jsonList[i].place_id, false,jsonList[i].name, jsonList[i].business_status, jsonList[i].formatted_address, jsonList[i].types.toString(), jsonList[i].rating]);
    newSheet.getRange('B'+ss.getLastRow()).insertCheckboxes();
  }
  // Hides the first column
  let range = newSheet.getRange("A:A");
  SpreadsheetApp.getActiveSheet().hideColumn(range);

}

//for future use;
function insertUserInFirebase_() {
  //define object and save it on the DB
  var data = {"email" : Session.getActiveUser().getEmail(), "tier" : "0", "contactsQuota":0, "detailsQuota":0};
  database.pushData("users", data);
}

//for future use;
function readDataFromFirebase_() {
  var data = {"email" : Session.getActiveUser().getEmail()};
  const tmp= database.getData("users", data);
}

function consumeCallFromUser_(callToConsume){
  var activeUser = {"email" : Session.getActiveUser().getEmail()};
  const userData=database.getData("users", activeUser);
  const remainingCall = {"contactsQuota" : (userData[Object.keys(userData)[0]].contactsQuota-callToConsume)};
  database.updateData("users/"+Object.keys(userData)[0], remainingCall);
}

function initUser_(){
  const user= retrieveActiveUser();
  if(Object.keys(user).length > 0){
    return user;
  }else{
    var data = {"email" : Session.getActiveUser().getEmail(), "tier" : 0, "contactsQuota":CONTACTS_LIMITS[0], "detailsQuota":0};
    database.pushData("users", data);
    return retrieveActiveUser();;
  }
}

function retrieveActiveUser(){
  var activeUser = {"email" : Session.getActiveUser().getEmail()};
  const userData=database.getData("users", activeUser);
  return userData?userData[Object.keys(userData)[0]]:{};
}
