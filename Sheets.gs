function onHomepage(){
  //TODO mettere install solo in fase di installazione
  Install()
  return buildCard();
}

function prepareGetQuery(e){
  let res=getPlaces(e.formInput['i_maps_query'], e.formInput['i_queries_to_consume']);
  const sheetName=e.formInput['i_maps_query'].replaceAll(" ", "_");
  insertResultInSheet(res, sheetName+"_"+Date.now());
}

function queriesToConsume_valueCheck(value){
 if(isNaN(value.formInput['i_queries_to_consume'])){
	document.write(num1 + " is not a number <br/>");
  value.formInput['i_queries_to_consume'];
 }
}

function buildCard() {
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

    //REMOVED
    /*let cardFooter1Button2Action1 = CardService.newAction()
        .setFunctionName('TODO')
        .setParameters({});*/

    let cardFooter1Button2 = CardService.newTextButton()
        .setText('Help me')
        .setOpenLink(cardFooter1Button1Action1);

    let cardFooter1 = CardService.newFixedFooter()
        .setPrimaryButton(cardFooter1Button1)
        .setSecondaryButton(cardFooter1Button2);
    
    let cardSection1TextInput1 = CardService.newTextInput()
        .setFieldName('i_maps_query')
        .setTitle('Google Maps Search')
        .setHint('ex. Hotels in new york')
        .setMultiline(false);

    let cardSection1TextInput1Action1 = CardService.newAction()
        .setFunctionName('queriesToConsume_valueCheck');

    let cardSection1TextInput2 = CardService.newTextInput()
        .setFieldName('i_queries_to_consume')
        .setTitle('Queries to consume')
        .setHint('ex. 10')
        .setMultiline(false)
        .setOnChangeAction(cardSection1TextInput1Action1)

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
        .setHeader('<b>1. Contacts</b>')
        .addWidget(cardSection1TextInput1)
        .addWidget(cardSection1TextInput2)
        .addWidget(cardSection1ButtonList1)
        .addWidget(cardSection1DecoratedText3)
        .setCollapsible(true);

    let cardSection2DecoratedText1 = CardService.newTextParagraph()
        .setText('You have selected N leads');

    let cardSection2SelectionInput1 = CardService.newSelectionInput()
        .setFieldName('select1')
        .setTitle('Which fields do you want to retrieve?')
        .setType(CardService.SelectionInputType.CHECK_BOX)
        .addItem('Phone', '1', false)
        .addItem('Web Site', '2', false)
        .addItem('Social', '3', false)
        .addItem('E-mail', '4', false);

    let cardSection2ButtonList1Button1Action1 = CardService.newAction()
        .setFunctionName('TODO')
        .setParameters({});

    let cardSection2ButtonList1Button1 = CardService.newTextButton()
        .setText('Get N Contacts Details')
        .setBackgroundColor('#0F9D58')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(cardSection2ButtonList1Button1Action1);

    let cardSection2ButtonList1 = CardService.newButtonSet()
        .addButton(cardSection2ButtonList1Button1);

    let cardSection2DecoratedText2 = CardService.newTextParagraph()
        .setText('Remaining monthly quota ≃ '+activeUser.detailsQuota+"/"+DETAILS_LIMITS[activeUser.tier]);

    let cardSection2 = CardService.newCardSection()
        .setHeader('<b>2. Contacts Detail</b>')
        .addWidget(cardSection2DecoratedText1)
        .addWidget(cardSection2SelectionInput1)
        .addWidget(cardSection2ButtonList1)
        .addWidget(cardSection2DecoratedText2)
        .setCollapsible(true);

    let card = CardService.newCardBuilder()
        .setHeader(cardHeader1)
        .setFixedFooter(cardFooter1)
        .addSection(cardSection1)
        .addSection(cardSection2)
        .build();
    return card;
}
