/*****************************************************************************/
/* SetupStepThree: Event Handlers */
/*****************************************************************************/
Template.setupStepThree.events({
});

/*****************************************************************************/
/* SetupStepThree: Helpers */
/*****************************************************************************/
Template.setupStepThree.helpers({
});

/*****************************************************************************/
/* SetupStepThree: Lifecycle Hooks */
/*****************************************************************************/
Template.setupStepThree.created = function () {

};

Template.setupStepThree.rendered = function () {
    $(".progress-bar-primary").attr("style", "width : 75%");


    $("#step3btn").attr("class", "btn btn-default pull-right disabled");
    $("#step3btn").text("loading...");
    $("#step3btn").attr("disabled", "disabled");


    //for (var i = 0; i < 100; i++) {
    //    var sessionvalue = i.toString();
    //    console.log(i.toString())
    //    Meteor.call("get_progress", sessionvalue, function(err, data){
    //        Session.set('progressvalue', data);
    //
    //    })
    //}
    NProgress.settings.parent = ".loadingtarget";

    NProgress.start();

    var provider = Providers.findOne({user_id :  Meteor.userId(), provider_name : "aetna"});

    if(provider.login_type == "options"){
        Meteor.call("Update_user_Claims_with_options", 3, "aetna", function(err, data) {
            console.log('callback')

            NProgress.done();

            if (err) {

            } else {
                $("#step3btn").attr("class", "btn btn-default pull-right");
                $("#step3btn").text("Next");
                $("#step3btn").removeAttr("disabled");

                $("#step3btn").click();
            }

        });
    }
    else{
        Meteor.call("Update_user_Claims", 3, "aetna", function(err, data) {
            console.log('callback')

            NProgress.done();

            if (err) {

            } else {
                $("#step3btn").attr("class", "btn btn-default pull-right");
                $("#step3btn").text("Next");
                $("#step3btn").removeAttr("disabled");

                $("#step3btn").click();
            }

        });
    }


};

Template.setupStepThree.destroyed = function () {
};
