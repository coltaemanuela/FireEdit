$(function() {
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
          theme: "default",
          last_edit_by: <random>
      }
    }
    */

    var editorId = 123;

    var uid = Math.random().toString();
    var editor = null;
    //var $editor = document.getElementById("editor");
    //var $editor = document.getElementById("editor");

    function updateData(field, value) {
        switch (field) {
            case "value":
                // TODO Math
                //      Prevent cursur jumping
                var oldPosition = editor.getCursorPosition();
                editor.setValue(value, -1);
                editor.gotoLine(oldPosition.row + 1, oldPosition.column)
                editor.focus();
                break;
            case "theme":
                // Set the theme
                editor.setTheme("ace/theme/" + value);
                //$theme.value = value;
                break;
            case "lang":
                // Set the language
                editor.getSession().setMode("ace/mode/" + value);
                //$lang.value = value;
                break;
        }
    }

    function setEditorValue(c) {
        var val = c.val();
        if (val === null) {
            editorValues.child(editorId).set({
                value: "",
                lang: "text",
                theme: "monokai"
            })
        } else {
            if (typeof val === "object") {
                return Object.keys(val).forEach(function(cField) {
                    updateData(cField, val[cField]);
                });
            }

            // If we want to update the value...
            if (c.key === "value") {
                // Get the last_edit_by value
                c.ref.getParent().child("last_edit_by").once("value", function(snap) {
                    // Check if the update was made by the current user
                    if (snap.val() === uid) {
                        return;
                    }

                    // ...otherwise, update the editor
                    updateData(c.key, val);
                });
            } else {
                updateData(c.key, val);
            }
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
    currentEditorValue.once("value", function(data) {
        // Initialize the ACE editor
        editor = ace.edit("editor");
        editor.$blockScrolling = Infinity;

        // When we change something in the editor, update the value in Firebase
        editor.on("change", function(e) {
            if (!editor.curOp || !editor.curOp.command.name) {
                return;
            }
            currentEditorValue.update({
                value: editor.getValue(),
                last_edit_by: uid
            }).then(function(c) {
                console.log(c)
            }).catch(function(e) {
                console.error(e)
            });
        })

        setEditorValue(data);
    });

    // When the value is changed, update it in the editor
    currentEditorValue.on("child_changed", setEditorValue);
});
