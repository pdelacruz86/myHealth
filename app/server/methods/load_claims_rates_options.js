/**
 * Created by pdelacruz on 8/12/15.
 */
var Fiber = Npm.require('fibers')

//var
loadclaimsdetailsData = function  (user_id, providername, claimtype, claimID, pharmacyhref, callback){
    //set up user and pass by provider name

    //console.log(user_id, providername);

    claimID = s(claimID).trim().value();

    var providerdata = Providers.findOne({user_id :  user_id, provider_name: providername});


    var secondurl = '';
    var element = '';

    var mainurl = process.env["PROVIDERS_URL_AETNA_LOGIN"];
    var mainurl2 = process.env["PROVIDERS_URL_AETNA_LOGIN_2"];
    var urlmedical = process.env["PROVIDERS_URL_AETNA_MEDICAL"];
    var urlpharmacy = process.env["PROVIDERS_URL_AETNA_PHARMACY"];
    var urldental = process.env["PROVIDERS_URL_AETNA_DENTAL"];

    if(claimtype == 'Medical'){
        secondurl = urlmedical;
    }
    else if(claimtype == 'Pharmacy'){
        secondurl = urlpharmacy;
    }
    else if(claimtype == 'Dental'){
        secondurl = urldental;
    }

    var x =Xray();

    Meteor.setTimeout(function(){
        if(claimtype == 'Pharmacy'){
            var optionsPharmacy = new nightmare()
                .goto(mainurl)
                .wait()
                .wait("#secureLoginBtn")
                .type('input#userNameValue', providerdata.provider_user_name)
                .type('input#passwordValue', providerdata.provider_password)
                .click('#secureLoginBtn')
                .wait()
                .check("#planSponsorIndex")
                .click("#go-button label")
                .wait()
                .goto('https://member.aetna.com/' + pharmacyhref)
                .wait()
                .url(function(url){
                    console.log(url);
                })
                .evaluate(function () {
                    return {
                        table: document.querySelector('#claimSummary').outerHTML
                    };
                },
                function (value) {
                    if (value == null) {
                        //var htmltable =  value.errorTable ;
                        callback({error :"no hay dataa"}, null);

                    } else {
                        //validating the data
                        var htmltable = value.table;

                        x(htmltable, '#claimSummaryContent .rowData',
                            [{amountLabel: 'div.amountLabel'}])
                        (function (err, data) {
                            callback(null, {providerrate: data[2]});
                        });
                    }
                })
                .run();
        }
        else{
            var optionsOthers = new nightmare()
                .goto(mainurl)
                .wait()
                .wait("#secureLoginBtn")
                .type('input#userNameValue', providerdata.provider_user_name)
                .type('input#passwordValue', providerdata.provider_password)
                .click('#secureLoginBtn')
                .wait()
                .wait()
                .wait()
                .check("#planSponsorIndex")
                .click("#go-button label")
                .wait()
                .wait()
                .goto(secondurl)
                .wait()
                .url(function(){
                    element = '#sortTable a[href*="' + claimID + '"]';
                    console.log(element)

                })
                .click('#sortTable a[href*="' + claimID + '"]')
                //.click('#sortTable tr:contains("RX0790611") .last a')
                .wait()
                .url(function(url){
                    console.log(url);

                })
                .evaluate(function () {
                    return {
                        table: document.querySelector('#claimSummary').outerHTML
                    };
                },
                function (value) {
                    //console.log(value.table);
                    //console.log('entrooooooooo');
                    if(claimtype == 'Medical') {
                        if (value == null) {
                            //var htmltable =  value.errorTable ;
                            callback({error :"no hay dataa"}, null);

                        } else {
                            //validating the data
                            var htmltable = value.table;

                            x(htmltable, '#claimSummaryContent .rowData',
                                [{amountLabel: 'div.amountLabel'}])
                            (function (err, data) {
                                callback(null, {providerrate: data[2]});
                            });
                        }
                    }
                    else if(claimtype == 'Dental') {
                        if (value == null) {
                            //var htmltable =  value.errorTable ;
                            callback({error :"no hay dataa"}, null);

                        } else {
                            //validating the data
                            var htmltable = value.table;

                            x(htmltable, '#claimSummaryContent .rowData',
                                [{amountLabel: 'div.amountLabel'}])
                            (function (err, data) {
                                callback(null, {providerrate: data[2]});
                            });
                        }
                    }
                })
                .run();
        }


    },20000)
}

var LoadClaimsRatesData =  Meteor.wrapAsync(loadclaimsdetailsData);

Meteor.methods({
    load_claims_rates_with_options :  function(){
        console.log('--------------------------------EMPEZO Carga provider rates------------------------------------');

        var myuser_id = this.userId;

        SyncedCron.add({
            name: 'Load claims details (provider rate)',
            schedule: function(parser) {
                // parser is a later.parse object
                return parser.text('every 2 minutes');
            },
            job: function() {
                var claimlist =  Claims.find({user_id : myuser_id, provider_rate : null, status : "Completed"}, {skip: 0, limit: 1});
                console.log('claims count : ' + claimlist.count())

               if(claimlist.count() == 0){
                   SyncedCron.stop();

               }else {
                   var handlerequest = function (user_id, provider, claimtype, claimid, pharmacyhref) {
                       LoadClaimsRatesData(user_id, provider, claimtype, claimid, pharmacyhref, function (err, data) {
                           if (err) {
                               console.log(err)
                           } else {
                               console.log(JSON.stringify(data.providerrate.amountLabel), claimid);

                               var ratevalue = data.providerrate.amountLabel;

                               loadClaimsRateNoOptions(myuser_id, provider, claimtype, claimid, ratevalue);
                           }
                       });
                   }

                   claimlist.forEach(function (value) {
                       console.log((value.claim_detail_href == undefined) ? 'otro href' : value.claim_detail_href);
                       Fiber(function () {
                           handlerequest(myuser_id, "aetna", value.type, value.claim_id, (value.claim_detail_href == undefined) ? '' : value.claim_detail_href)
                       }).run();
                   })
                   //return numbersCrunched;
               }
            }
        });

        SyncedCron.start();
    }
})


function loadClaimsRate(user,provider, claimtype, claimid, data)
{
    var value = Number(s(s.splice(s(data).trim().value(),0,1,"")).trim().value()) * 100;

    Claims.update({user_id : user, claim_id: claimid}, {$set :{ provider_rate : value }})
}



Meteor.startup(function () {

    var list = {claims : [{ date_of_service: '\n 05/14/15\n ',
        member: 'GEORGIA (Daughter) \n ',
        facility: 'COLIN WALTERS\n ',
        status: '\n Completed\n ',
        claim_amount: '\n $250.00\n ',
        paid_by_plan: ' \n $ 206.00\n ',
        claim_detail_href: 'javascript:getClaimDetail("Qkm5cVUYxf0WFl8mIhV8", "VlgmfpBEsQZr", "VLzZvc%2F67kklJSTVlZu%2B", "FLydF97rzMA%3D", "EW4", "C", "N", "false", "N", "GEORGIA", "false", "Daughter", "DEN", "Dental", false, "E335L2T3B");' },
        { date_of_service: '\n 03/30/15\n ',
            member: 'WILLIAM (Son) \n ',
            facility: 'RANDALL MILLER\n ',
            status: '\n Completed\n ',
            claim_amount: '\n $515.00\n ',
            paid_by_plan: ' \n $ 360.00\n ',
            claim_detail_href: 'javascript:getClaimDetail("YZez4tt9mRjAziLlpWNT", "caTNEu5Iakvy", "UQ6MmkHnYCpGRkegluxu", "NUrcIe6Eplo%3D", "EW1", "C", "N", "false", "N", "WILLIAM", "false", "Son", "DEN", "Dental", false, "E6FBLBV5M");' },
        { date_of_service: '\n 01/20/15\n ',
            member: 'SANDRA (Wife) \n ',
            facility: 'RANDALL MILLER\n ',
            status: '\n Completed\n ',
            claim_amount: '\n $125.00\n ',
            paid_by_plan: ' \n $ 24.80\n ',
            claim_detail_href: 'javascript:getClaimDetail("RSwTP0gi2KPbO9ilO00T", "VylzhLsSmtK8", "ci9nxbf6M%2BlYWFzXQ%2Bai", "IZc7t%2Flf3cU%3D", "EW3", "C", "N", "false", "N", "SANDRA", "false", "Wife", "DEN", "Dental", false, "EHFBKZ10X");' },
        { date_of_service: '\n 01/20/15\n ',
            member: 'SANDRA (Wife) \n ',
            facility: 'RANDALL MILLER\n ',
            status: '\n Completed\n ',
            claim_amount: '\n $80.00\n ',
            paid_by_plan: ' \n $ 75.00\n ',
            claim_detail_href: 'javascript:getClaimDetail("JXk7Lr3Xmc8M7OKQ19lW", "ZCXmxVVgF4cf", "J7DEqQOqJ1Hc3PxBQAp%2F", "dBaYNWBV5E0%3D", "EW3", "C", "N", "false", "N", "SANDRA", "false", "Wife", "DEN", "Dental", false, "EBFBK0NK0");' }
    ]};

    list.claims.forEach(function(item){
        //console.log(item.status)
        //console.log(s(item.status).trim().value())
    });

    var claimlist =  Claims.find({provider_rate : null, status : "Completed"}, {skip: 0, limit: 1});

    console.log(claimlist.fetch(), claimlist.count())

    //var claimlist =  Claims.find({type : "Dental", provider_rate : null});
    //
    ////console.log(claimlist.fetch());
    //
    //claimlist.forEach(function(value){
    //    console.log(value.claim_id)
    //
    //})
});