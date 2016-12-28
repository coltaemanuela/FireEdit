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
          lang: "js",
          queue: []
      }
    }
    */

   // var editorId = 123;
    //create a custom ID
    var editorId=Url.queryString("id")||"_";
	// if(!editorId){
	// 	var defaultId=_id;
	// }

    var LS_THEME_KEY = "editor-theme";
    function getTheme() {
        return localStorage.getItem(LS_THEME_KEY) || "ace/theme/monokai";
    }

    $("#select-theme").change(function () {
        editor.setTheme(this.value);
        try {
            localStorage.setItem(LS_THEME_KEY, this.value);
        } catch (e) {}
    }).val(getTheme());

    var $selectLang = $("#select-lang").change(function () {
        console.log(this.value);
        currentEditorValue.update({
            lang: this.value
        });
        editor.getSession().setMode("ace/mode/" + this.value);
    });

    var uid = Math.random().toString();
    var editor = null;

    function setEditorValue(c) {
        var val = c.val();
        if (val === null) {
            editorValues.child(editorId).set({
                lang: "javascript"
            })
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
        window.editor  = editor = ace.edit("editor");
        editor.setTheme(getTheme());
        editor.$blockScrolling = Infinity;


        // When we change something in the editor, update the value in Firebase
        editor.on("change", function(e) {
            if (!editor.curOp || !editor.curOp.command.name) {
                return;
            }
            // set(id, {})
            // .child(id).set({})
            currentEditorValue.child("queue").child(Date.now().toString()).set({
                event: e,
                by: uid
            }).then(function(c) {
                console.log(c)
            }).catch(function(e) {
                console.error(e)
            });
        });

        var doc = editor.getSession().getDocument();

        currentEditorValue.child("queue").on("child_added", function (ref) {
            var value = ref.val();
            editor.curOp = null;
            if (value.by === uid) { return; }
            doc.applyDeltas([value.event]);
        });

        setEditorValue(data);
        currentEditorValue.child("lang").on("value", function (r) {
            var value = r.val();
            // if (date.now() > r.key) { return; }
            // Set the language
            var cLang = $selectLang.val();
            if (cLang !== value) {
                $selectLang.val(value).change();
            }
        });
    });
});
