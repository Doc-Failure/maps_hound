//Todo Change Google Maps Key
const GOOGLE_MAPS_KEY_="";
const FIREBASE_DB_SECRET_ = "";
const CONTACTS_LIMITS=[100,1000,10000];
const DETAILS_LIMITS=[10, 100,1000];
//Cost: $ 0.34, 3.4, 34, 340
//Price: $ 0, 11.90, 99, 1000

const firebaseConfig_ = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };

const database = FirebaseApp.getDatabaseByUrl(firebaseConfig_.databaseURL, FIREBASE_DB_SECRET_);

//Show messages on the bar
function toaster(message){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast(message);
}

function registerUser_() {
  var idToken = ScriptApp.getIdentityToken();
  const GAuthToken= FirebaseApp.signInWithIdp(firebaseConfig_, idToken ).idToken;
  PropertiesService.getScriptProperties().setProperty('GAuthToken', GAuthToken);

};

function Install() {
  registerUser_();
  initUser_();
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
      if(remainingCallToConsume>0){
        const urlToFetch=!data?queryUrl:("https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken="+data.next_page_token+"&key="+GOOGLE_MAPS_KEY_);
        const res=UrlFetchApp.fetch(urlToFetch);
        data = JSON.parse(res.getContentText());
        
        result=[...result,...data.results];
        remainingCallToConsume-=data.results.length;
        Utilities.sleep(2 * 1000)
      }
    }while(data && data.next_page_token!=null && remainingCallToConsume>0);
  } catch (error) {
    Logger.log(error);
    return "Error while fetching";
  }
  //remove the minimum from the total consumed queries
  consumeCallFromUser_(result.length<callToConsume?result.length:callToConsume);
  return result;//.slice(0,callToConsume)
}

function insertResultInSheet(jsonList, sheetName){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  let newSheet = ss.insertSheet();
  newSheet.setName(sheetName);

  newSheet.appendRow(['PLACE ID (Please do NOT remove this column, it\'s very important, it\'s used by Google to identify a place)','SELECTED','NAME', 'STATUS', 'ADDRESS', 'TAGS', 'RATING']);
  for(let i=0; i<jsonList.length; i++){
    newSheet.appendRow([jsonList[i].place_id, false,jsonList[i].name, jsonList[i].business_status, jsonList[i].formatted_address, jsonList[i].types?jsonList[i].types.toString():'', jsonList[i].rating]);
    newSheet.getRange('B'+ss.getLastRow()).insertCheckboxes();
  }
  // Hides the first column
  //let range = newSheet.getRange("A:A");
  //SpreadsheetApp.getActiveSheet().hideColumn(range);

}

function consumeCallFromUser_(callToConsume){
  var activeUser = {"email" : Session.getActiveUser().getEmail()};
  const userData=database.getData("users", activeUser);
  const remainingCall = {"contactsQuota" : (userData[Object.keys(userData)[0]].contactsQuota-callToConsume)};
  database.updateData("users/"+Object.keys(userData)[0], remainingCall);
}

function consumeDetailsQuotaFromUser_(detailsQuotaToConsume){
  var activeUser = {"email" : Session.getActiveUser().getEmail()};
  const userData=database.getData("users", activeUser);
  const remainingCall = {"detailsQuota" : (userData[Object.keys(userData)[0]].detailsQuota-detailsQuotaToConsume)};
  database.updateData("users/"+Object.keys(userData)[0], remainingCall);
}

function initUser_(){
  const user= retrieveActiveUser();
  if(Object.keys(user).length > 0){
    return user;
  }else{
    var data = {"email" : Session.getActiveUser().getEmail(), "tier" : 0, "contactsQuota":CONTACTS_LIMITS[0], "detailsQuota":DETAILS_LIMITS[0]};
    database.pushData("users", data);
    return retrieveActiveUser();;
  }
}

function retrieveActiveUser(){
  var activeUser = {"email" : Session.getActiveUser().getEmail()};
  const userData=database.getData("users", activeUser);
  return userData?userData[Object.keys(userData)[0]]:{};
}

function getPlacesDetails(){
  const activeUser= retrieveActiveUser();

  let detailsError=0;
  let data;
  let detailsFound=0;
  let payload={};
  payload.websites="[";

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getActiveSheet();
  const cells = sh.getRange('B1:B'+sh.getLastRow()).getValues().flat();

  let totalCellsToUpdate=0;
  cells.map((c,i)=>{
    if(c==true && sh.getRange(`K${i+1}`).isBlank())
      totalCellsToUpdate++;
  })
  
  if(totalCellsToUpdate==0){
    detailsError=1;
  }else{
    if(!(totalCellsToUpdate>activeUser.detailsQuota)){
      //Check se abbiamo a disposizione chiamate
      //Check se il tier è premium
      cells.map((c,i)=>{
        if(i==0){
          sh.getRange('H1').setValue('WEBSITE');
          sh.getRange('I1').setValue('PHONE NUMBER');
          sh.getRange('J1').setValue('INTERNATIONAL NUMBER');
          sh.getRange('K1').setValue('MAPS URL (Please do NOT remove this column)');
          sh.getRange('L1').setValue('NUMBER OF REVIEWS');
          sh.getRange('M1').setValue('EMAIL');
          sh.getRange('N1').setValue('FACEBOOK');
          sh.getRange('O1').setValue('INSTAGRAM');
          sh.getRange('P1').setValue('TWITTER');
          sh.getRange('Q1').setValue('YOUTUBE');
          sh.getRange('R1').setValue('YELP');
          sh.getRange('S1').setValue('TRIPADVISOR');
          sh.getRange('T1').setValue('PINTEREST');
          sh.getRange('U1').setValue('SNAPCHAT');
          sh.getRange('V1').setValue('REDDIT');
          sh.getRange('W1').setValue('TIKTOK');
          sh.getRange('X1').setValue('QUORA');
        }

        if(c==true && sh.getRange(`K${i+1}`).isBlank()){ //&& MAPS URL cell is empty
          const placeId = sh.getRange((i+1), '1').getValue();
          const urlToQuery="https://maps.googleapis.com/maps/api/place/details/json?place_id="+placeId+"&key="+GOOGLE_MAPS_KEY_;

          data = JSON.parse(UrlFetchApp.fetch(urlToQuery).getContentText());
          sh.getRange(`H${i+1}`).setValue(data.result.website);
          sh.getRange(`I${i+1}`).setValue(data.result.formatted_phone_number);
          sh.getRange(`J${i+1}`).setValue(data.result.international_phone_number);
          sh.getRange(`K${i+1}`).setValue(data.result.url);
          sh.getRange(`L${i+1}`).setValue(data.result.user_ratings_total);
          detailsFound++;
          if(data.result.website){
            payload.websites=payload.websites+'{"id":"'+placeId+'","website":"'+data.result.website+'"},';
          }
        } 
      });
      //I've inserted an empty object as last element  to not break the array with the last "," character.
      //I've could write the array better, (without the last "," character), but this solution is more perfomable and readable
      payload.websites=payload.websites+"{}]"

      payload.user=Session.getActiveUser().getEmail();
      const GAuthToken = PropertiesService.getScriptProperties().getProperty('GAuthToken');
      if(payload.websites.length>0 && activeUser.tier!=0)
        scrapeSocial( GAuthToken, {"user":payload.user, "websites":payload.websites}, cells);
      
      consumeDetailsQuotaFromUser_(detailsFound);

    }else{
      detailsError=2;
    }
  }
  var nav = CardService.newNavigation().updateCard(buildCard(0,detailsError));
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
}

//cells is a parameter used to populate the spreadsheets with the response of the call
function scrapeSocial(token, payload, cells) {
  var responseCode = 200;
  var data = [];
    var response = UrlFetchApp.fetch(
      'https://us-central1-maps-hound-366618.cloudfunctions.net/api/scraper',
      {
        'method' : 'post',
        "contentType":'application/x-www-form-urlencoded',
        'headers': {
          'authorization': 'Bearer ' + token,
          "contentType":'application/x-www-form-urlencoded',
        },
        'payload': payload
    });
    responseCode= response.getResponseCode();
    if (responseCode==201) {
      var payload = JSON.parse(response.getContentText());

      const ss = SpreadsheetApp.getActive();
      const sh = ss.getActiveSheet();
      
      cells.map((c,i)=>{
        if(c==true){
          const placeId = sh.getRange((i+1), '1').getValue();
          if(payload[placeId]){
            sh.getRange(`M${i+1}`).setValue(payload[placeId].email.join(" , "));
            if(payload[placeId].facebook)
              sh.getRange(`N${i+1}`).setValue(payload[placeId].facebook.join(" , "));
            if(payload[placeId].instagram)
              sh.getRange(`O${i+1}`).setValue(payload[placeId].instagram.join(" , "));
            if(payload[placeId].twitter)
              sh.getRange(`P${i+1}`).setValue(payload[placeId].twitter.join(" , "));
            if(payload[placeId].youtube)
              sh.getRange(`Q${i+1}`).setValue(payload[placeId].youtube.join(" , "));
            if(payload[placeId].yelp)
              sh.getRange(`R${i+1}`).setValue(payload[placeId].yelp.join(" , "));
            if(payload[placeId].tripadvisor)
              sh.getRange(`S${i+1}`).setValue(payload[placeId].tripadvisor.join(" , "));
            if(payload[placeId].pinterest)
              sh.getRange(`T${i+1}`).setValue(payload[placeId].pinterest.join(" , "));
            if(payload[placeId].snapchat)
              sh.getRange(`U${i+1}`).setValue(payload[placeId].snapchat.join(" , "));
            if(payload[placeId].reddit)
              sh.getRange(`V${i+1}`).setValue(payload[placeId].reddit.join(" , "));
            if(payload[placeId].tiktok)
              sh.getRange(`W${i+1}`).setValue(payload[placeId].tiktok.join(" , "));
            if(payload[placeId].quora)
              sh.getRange(`X${i+1}`).setValue(payload[placeId].quora.join(" , "));
          }
        }}
      )
      
    }
    
  return data;
}
