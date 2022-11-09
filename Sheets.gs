function onHomepage(){
  //TODO mettere install solo in fase di installazione
  Install()
  return buildCard(0,0);
}

function prepareGetQuery(e){
  let error1=0;
  const activeUser= retrieveActiveUser();

  if(e.formInput['i_queries_to_consume']>activeUser.contactsQuota){
    error1=2;
  }else{
    if(e.formInput['i_maps_query'] && e.formInput['i_queries_to_consume']!=0){
      let res=getPlaces(e.formInput['i_maps_query'], e.formInput['i_queries_to_consume']);
      if(res.length>0){
        const sheetName=e.formInput['i_maps_query'].replaceAll(" ", "_");
        insertResultInSheet(res, sheetName+"_"+Date.now());
        //noErrors
        error1=0;
      }else{
        error1=1;
      }
    }else{
      error1=1;
    }
  }
  
  var nav = CardService.newNavigation().updateCard(buildCard(error1,0));
  return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
}

function buildCard(errorInSearch, errorInDetails) {
    let activeUser=retrieveActiveUser();

    let cardHeader1 = CardService.newCardHeader()
        .setTitle('👋 Hi, '+Session.getActiveUser().getEmail())
        .setSubtitle('Let\'s get some leads from Maps')
        .setImageUrl(
            'https://firebasestorage.googleapis.com/v0/b/maps-hound-366618.appspot.com/o/MH.png?alt=media&token=c34471ad-870c-40c3-b54c-861b35c64e37'
        )
        .setImageStyle(CardService.ImageStyle.CIRCLE);

    let cardFooter1Button1Action1 = CardService.newOpenLink()
        .setUrl('https://www.maps-hound.com');

    let cardFooter1Button1 = CardService.newTextButton()
        .setText('Manage Subscription')
        .setOpenLink(cardFooter1Button1Action1);

    /*let cardFooter1Button2 = CardService.newTextButton()
        .setText('Help me')
        .setOpenLink(cardFooter1Button1Action1);*/

    let cardFooter1 = CardService.newFixedFooter()
        .setPrimaryButton(cardFooter1Button1);
        //.setSecondaryButton(cardFooter1Button2);
    
    let cardSection1DecoratedTextError1 = CardService.newDecoratedText()
        .setText('<font color="#DC143C"><b>Please insert valid:\n - Google Maps query\n - Number of records to retrieve </b></font>');
    let cardSection1DecoratedTextError2 = CardService.newDecoratedText() 
        .setText('<font color="#DC143C"><b>Monthly limit reached</b></font>');

    let cardSection1TextInput1 = CardService.newTextInput()
        .setFieldName('i_maps_query')
        .setTitle('Google Maps Search')
        .setHint('ex. Hotels in new york');

    let cardSection1SelectionInput1 = CardService.newSelectionInput()
        .setFieldName('i_queries_to_consume')
        .setTitle('Queries to consume?')
        .setType(CardService.SelectionInputType.DROPDOWN)
        .addItem('0', '0', false)
        .addItem('20', '20', false)
        .addItem('40', '40', false)
        .addItem('60', '60', false);

    let cardSection1ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('prepareGetQuery');

    let cardSection1ButtonList1Button1 = CardService.newTextButton()
        .setText('Get Contacts')
        .setBackgroundColor('#0F9D58')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(cardSection1ButtonList1Button1Action1);

    let cardSection1ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection1ButtonList1Button1);

    let cardSection1DecoratedText3 = CardService.newTextParagraph()
        .setText('Remaining monthly quota ≃ '+activeUser.contactsQuota+"/"+CONTACTS_LIMITS[activeUser.tier]);


    let cardSection1 = CardService.newCardSection()
        .setHeader('<b>1. Contacts</b>');
    if(errorInSearch==1)
        cardSection1.addWidget(cardSection1DecoratedTextError1);
    if(errorInSearch==2)
        cardSection1.addWidget(cardSection1DecoratedTextError2);
      
    cardSection1
    .addWidget(cardSection1TextInput1)
    .addWidget(cardSection1SelectionInput1)
    .addWidget(cardSection1ButtonList1)
    .addWidget(cardSection1DecoratedText3);

    /*let cardSection2DecoratedText1 = CardService.newTextParagraph()
        .setText('You have selected N leads');

    let cardSection2SelectionInput1 = CardService.newSelectionInput()
        .setFieldName('select1')
        .setTitle('Which fields do you want to retrieve?')
        .setType(CardService.SelectionInputType.CHECK_BOX)
        .addItem('Phone', '1', false)
        .addItem('Web Site', '2', false)
        .addItem('Social', '3', false)
        .addItem('E-mail', '4', false);*/

    let cardSection2ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('getPlacesDetails')
        .setParameters({});

    let cardSection2ButtonList1Button1 = CardService.newTextButton()
        .setText('Get Contacts Details')
        .setBackgroundColor('#0F9D58')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(cardSection2ButtonList1Button1Action1);

    let cardSection2ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection2ButtonList1Button1);

    let cardSection2DecoratedText2 = CardService.newTextParagraph()
        .setText('Remaining monthly quota ≃ '+activeUser.detailsQuota+"/"+DETAILS_LIMITS[activeUser.tier]);


    let cardSection2DecoratedTextError1 = CardService.newDecoratedText()
        .setText('<font color="#DC143C"><b>Please use the B column \nto select some records</b></font>');
    let cardSection2DecoratedTextError2 = CardService.newDecoratedText() 
        .setText('<font color="#DC143C"><b>Monthly limit reached</b></font>');

    let cardSection2 = CardService.newCardSection()
        .setHeader('<b>2. Contacts Detail</b>');
        //.addWidget(cardSection2DecoratedText1)
        //.addWidget(cardSection2SelectionInput1)
    if(errorInDetails==1)
        cardSection2.addWidget(cardSection2DecoratedTextError1);
    if(errorInDetails==2)
        cardSection2.addWidget(cardSection2DecoratedTextError2);
    cardSection2
        .addWidget(cardSection2ButtonList1)
        .addWidget(cardSection2DecoratedText2)
        .setCollapsible(false);

    let card = CardService.newCardBuilder()
        .setHeader(cardHeader1)
        .setFixedFooter(cardFooter1)
        .addSection(cardSection1)
        .addSection(cardSection2)
        .build();
    return card;
}
