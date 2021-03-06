    Template['login'].helpers({
    });

    Template['login'].events({
        'submit form': function(event){
            event.preventDefault();
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();

            console.log('entro', email, password);
            Meteor.loginWithPassword(email, password, function(error){
                if(error){
                    toastr.error(error.reason, "Error");
                } else {

                    Router.go("home");
                }
            });
        },
        'click #createAccount' : function(){
            event.preventDefault();
            Router.go("register");
        },
        'click .btn-google': function() {
            return Meteor.loginWithGoogle({
                requestPermissions: ['email']
            }, function (error) {
                if (error) {
                    toastr.error(error.reason, "Error");
                }
                else{
                    Router.go("home");
                }
            });
        },
        'click .btn-twitter': function() {
            return Meteor.loginWithTwitter(function(error){
                if (error) {
                    toastr.error(error.reason, "Error");
                }
                else{
                    Router.go("home");
                }
            });
        }
    });


    Template['login'].rendered = function(){
        $('body').addClass('login-alt');
    }

    Template.login.destroyed = function(){
        $('body').removeClass('login-alt');
    }
