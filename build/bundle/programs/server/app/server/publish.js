(function(){
Meteor.publish('hb_profiles', function (/* args */) {
  return HB_Profiles.find({user_id : this.userId});
});

Meteor.publish('providers', function () {
  return Providers.find({user_id : this.userId});
});


Meteor.publish('claims', function (/* args */) {
  return Claims.find({user_id : this.userId});
});

})();
