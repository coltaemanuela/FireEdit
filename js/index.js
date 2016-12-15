$(function () {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAsFK9oDTtsCdqrHAfQKs8_TmNtBOoIkBY",
    authDomain: "emma-ea74d.firebaseapp.com",
    databaseURL: "https://emma-ea74d.firebaseio.com",
    storageBucket: "emma-ea74d.appspot.com",
    messagingSenderId: "95300595436"
  };
  firebase.initializeApp(config);

  function updateTextarea (c) {
      // TODO Declare as variable
      editor.value = c.val();
  }

  var editorId = 123;
  var db = firebase.database();
  var editorValue = db.ref("editor_values");
  editorValue.once("value", updateTextarea);
  editorValue.on("child_changed", updateTextarea);

  editor.oninput = function () {
      var obj = {};
      obj[editorId] = this.value;
      editorValue.update(obj).then(function (c) {
          console.log(c)
      }).catch(e => console.error(e))
  };

});
