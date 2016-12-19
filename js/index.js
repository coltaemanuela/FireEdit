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


  /*
  editor_values: {
    <id>: {
        value: "function hello()\n    return 42;\n}",
        lang: "js",
        theme: "default"
    }
  }
  */

  var editorId = 123;

  var $editor = document.getElementById("editor");
  //var $editor = document.getElementById("editor");
  //var $editor = document.getElementById("editor");

  var isSaving = false;
  function updateData(field, value) {
      switch (field) {
          case "value":
              $editor.value = value;
              break;
          case "theme":
              //$theme.value = value;
              break;
          case "lang":
              //$lang.value = value;
              break;
      }
  }

  function setEditorValue (c) {
      if (isSaving) { return; }
      var val = c.val();

      if (val === null) {
          editorValues.child(editorId).set({
              value: "",
              lang: "text",
              theme: "monokai"
          })
      } else {
            if (typeof val === "object") {
                return Object.keys(val).forEach(function (cField) {
                    updateData(cField, val[cField]);
                });
            }
            updateData(c.key, val);
      }
  }

  // 1. Check if the editor id exists already.
  // 2. Take the editor value and set it in the editor (textarea/ACE editor)
  // 3. When the value is changed by anyone, update the editor value.
  // 4. When we change the value in the editor, update the value in Firebase.

  var db = firebase.database();
  var editorValues = db.ref("editor_values");
  var currentEditorValue = editorValues.child(editorId);

  // Take the editor value on start and set it in the editor
  currentEditorValue.once("value", setEditorValue);

  // When the value is changed, update it in the editor
  currentEditorValue.on("child_changed", setEditorValue);

  // When we change something in the editor, update the value in Firebase
  $editor.oninput = function () {
      isSaving = true;
      currentEditorValue.update({
          value: this.value
      }).then(function (c) {
          console.log(c)
      }).catch(function (e) {
          console.error(e)
      });
      isSaving = false;
  };
});
